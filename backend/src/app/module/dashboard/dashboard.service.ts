import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
    personalUtilityExpenses,
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
          notIn: ['FROM_DEPOSIT']
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
    this.prisma.messMembership.findMany({
      where: { mess_id: messId, is_active: true },
      select: { monthly_rent: true, room_no: true },
    }),
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
  const personalUtilityExpensesAmount = Number(personalUtilityExpenses._sum.amount ?? 0);

  const activeMembersCount = activeMembers.length;
  const extraExpenses = Number(monthlyExtraExpenses._sum.amount ?? 0);
  const perExtraExpenses = activeMembersCount > 0 ? Number((extraExpenses / activeMembersCount).toFixed(2)) : 0;

  // Calculate total room rent same way as monthly bills
  const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
  const rooms = Array.isArray(mess?.rooms) ? mess!.rooms : [];
  
  const totalRoomRent = activeMembersCount > 0 ? activeMembers.reduce((sum, member) => {
    const roomRent = this.getRoomRentPerMember(rooms, member.room_no, Number(member.monthly_rent), Number(mess?.monthly_rent));
    return sum + (roomRent || 0);
  }, 0) : 0;
  const totalCost = totalBazar + extraExpenses + totalRoomRent;

  // console.log("totalBazar:", totalBazar, "extraExpenses:", extraExpenses, "totalRoomRent:", totalRoomRent, "totalCost:", totalCost, "personalUtilityExpensesAmount:", personalUtilityExpensesAmount);

  const totalDepositAmount = Number(totalPayment._sum.amount ?? 0) +  personalUtilityExpensesAmount;

  const billedTotalDue = Number(billsAgg._sum.final_due ?? 0);
  const paidAmount = Number(billsAgg._sum.paid_amount ?? 0);
  const estimatedTotalDue = Math.max(totalCost - totalDepositAmount, 0);

  // Use billed total due from monthly bills if available, otherwise use estimated
  const totalDue = Number((billedTotalDue > 0 ? billedTotalDue : estimatedTotalDue).toFixed(2));
  // const totalDue = estimatedTotalDue;
  // console.log("totalCost:", totalCost, "totolDeposit : ", totalDepositAmount, "billedTotalDue : ", billedTotalDue, "totalDue : ", totalDue);
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
    activeMembers: activeMembersCount,
    pendingPayments,
    openComplaints: complaints,
    notices,
    totalRoomRent,
    totalCost,
  };
}

  private getRoomRentPerMember(
    rooms: Prisma.JsonValue[],
    roomNo?: string | null,
    memberMonthlyRent?: number | null,
    messMonthlyRent?: number | null,
  ): number {
    if (!roomNo) {
      if (memberMonthlyRent && memberMonthlyRent > 0) return memberMonthlyRent;
      if (messMonthlyRent && messMonthlyRent > 0) return messMonthlyRent;
      return 0;
    }

    const roomConfig = rooms.find((room) => {
      if (!room || typeof room !== 'object' || Array.isArray(room)) return false;
      return (room as Record<string, unknown>)['roomName'] === roomNo;
    });

    if (!roomConfig || typeof roomConfig !== 'object' || Array.isArray(roomConfig)) {
      if (memberMonthlyRent && memberMonthlyRent > 0) return memberMonthlyRent;
      if (messMonthlyRent && messMonthlyRent > 0) return messMonthlyRent;
      return 0;
    }

    const room = roomConfig as Record<string, unknown>;
    const roomPrice = Number(room['roomPrice'] ?? 0);
    const totalPerson = Number(room['perPerson'] ?? 0);

    if (roomPrice > 0 && totalPerson > 0) {
      return Number((roomPrice / totalPerson).toFixed(2));
    }

    if (memberMonthlyRent && memberMonthlyRent > 0) return memberMonthlyRent;
    if (messMonthlyRent && messMonthlyRent > 0) return messMonthlyRent;
    return 0;
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
