import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private getMonthRange(month?: string) {
    const start = month ? new Date(month) : new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return { start, end };
  }

  private async verifyMessMember(messId: string, userId: string, role: string) {
    if (role === 'ADMIN') return;
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;
    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (!membership?.is_active) throw new HttpException('Forbidden: Not a member of this mess', 403);
  }

  async getMessDashboard(messId: string, userId: string, role: string, month?: string) {
  await this.verifyMessMember(messId, userId, role);
  const { start, end } = this.getMonthRange(month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    todayMeals,
    monthlyExpenses,
    monthlyExtraExpenses,
    fromDepositexpenses,
    monthlyMealAttendances,
    totalPayment,
    billsAgg,
    activeMembers,
    pendingPayments,
    notices,
    complaints,
  ] = await Promise.all([
    this.prisma.mealAttendance.aggregate({
      where: {
        status: 'ON',
        meal: {
          mess_id: messId,
          scheduled_date: { gte: today, lt: tomorrow },
          status: { not: 'CANCELLED' },
        },
      },
      _count: { _all: true },
      _sum: { guests: true },
    }),
   this.prisma.expense.aggregate({
      where: {
        mess_id: messId,
        category: {
          in: ['FOOD', 'GROCERY']
        },
        expense_date: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amount: true,
      },
    }),
     // Extra expenses = all categories except FOOD
    this.prisma.expense.aggregate({
      where: {
        mess_id: messId,
        category: {
          notIn: ['FOOD', 'GROCERY'],
        },
        expense_date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),

    this.prisma.expense.aggregate({
      where: {
        mess_id: messId,
        payment_type:{
          in: ['FROM_DEPOSIT']
        },
        expense_date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),

    this.prisma.mealAttendance.aggregate({
      where: {
        status: 'ON',
        meal: {
          mess_id: messId,
          scheduled_date: { gte: start, lt: end },
          status: { not: 'CANCELLED' },
        },
      },
      _count: { _all: true },
      _sum: { guests: true },
    }),
    this.prisma.payment.aggregate({
      where: {mess_id: messId, status: "APPROVED", created_at:{gte:start, lt:end}},
      _sum: {amount:true}
    }),
    this.prisma.monthlyBill.aggregate({
      where: { mess_id: messId, month: start },
      _sum: { final_due: true, paid_amount: true },
    }),
    this.prisma.messMembership.count({ where: { mess_id: messId, is_active: true } }),
    this.prisma.payment.count({ where: { mess_id: messId, status: 'PENDING' } }),
    this.prisma.notice.findMany({
      where: { mess_id: messId },
      take: 5,
      orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
      select: { id: true, title: true, type: true, is_pinned: true, created_at: true },
    }),
    this.prisma.complaint.count({ where: { mess_id: messId, status: { in: ['PENDING', 'PROCESSING'] } } }),
  ]);

  const todayTotalMeals = todayMeals._count._all + Number(todayMeals._sum.guests ?? 0);
  const totalMeals = monthlyMealAttendances._count._all + Number(monthlyMealAttendances._sum.guests ?? 0);

  const totalBazar = Number(monthlyExpenses._sum.amount ?? 0);
  const currentMealRate = totalMeals > 0 ? Number((totalBazar / totalMeals).toFixed(2)) : 0;
  const fromDepositAmount = Number(fromDepositexpenses._sum.amount ?? 0);

  const extraExpenses = Number(monthlyExtraExpenses._sum.amount ?? 0);
  const perExtraExpenses = activeMembers > 0 ? Number((extraExpenses / activeMembers).toFixed(2)) : 0;

  const totalDepositAmount = Number(totalPayment._sum.amount ?? 0) + totalBazar + extraExpenses - fromDepositAmount;

  const billedTotalDue = Number(billsAgg._sum.final_due ?? 0);
  const paidAmount = Number(billsAgg._sum.paid_amount ?? 0);
  const estimatedTotalDue = Math.max(totalBazar + extraExpenses - totalDepositAmount, 0);

  console.log("billedTotalDue:", billedTotalDue, "paidAmount:", paidAmount, "estimatedTotalDue:", estimatedTotalDue);
  const totalDue = Number(
    (billedTotalDue > 0 ? billedTotalDue : estimatedTotalDue).toFixed(2),
  );
  return {
    todayTotalMeals,
    totalMeals,
    currentMonthTotalBazar: totalBazar,
    extraExpenses,
    perExtraExpenses,
    currentMealRate,
    totalDue,
    totalDepositAmount,
    paidAmount: Number(totalPayment._sum.amount ?? 0),
    activeMembers,
    pendingPayments,
    openComplaints: complaints,
    notices,
  };
}

  async getAdminDashboard() {
    const [
      users,
      pendingRequests,
      approvedRequests,
      messes,
      pendingComplaints,
      pendingPayments,
      recentExpenses,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.messRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.messRequest.count({ where: { status: 'APPROVED' } }),
      this.prisma.mess.count(),
      this.prisma.complaint.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.expense.findMany({
        where: { receipt_url: { not: null } },
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          item_name: true,
          category: true,
          amount: true,
          receipt_url: true,
          expense_date: true,
          mess: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      users,
      pendingRequests,
      approvedRequests,
      messes,
      pendingComplaints,
      pendingPayments,
      recentExpenses,
    };
  }
}
