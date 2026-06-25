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

  /**
   * Get daily expense and payment (income) data for the monthly overview chart
   */
  async getMonthlyOverview(messId: string, userId: string, role: string, month?: string) {
    await this.verifyMessMember(messId, userId, role);
    const { start, end } = this.getMonthRange(month);

    // Get all expenses for the month, grouped by date
    const expenses = await this.prisma.expense.findMany({
      where: {
        mess_id: messId,
        expense_date: { gte: start, lt: end },
      },
      select: {
        amount: true,
        expense_date: true,
      },
      orderBy: { expense_date: 'asc' },
    });

    // Get all approved payments for the month (income/deposit)
    const payments = await this.prisma.payment.findMany({
      where: {
        mess_id: messId,
        status: 'APPROVED',
        created_at: { gte: start, lt: end },
      },
      select: {
        amount: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    // Build a map of dates within the month range
    const dailyMap = new Map<string, { expense: number; income: number }>();
    const current = new Date(start);
    while (current < end) {
      const key = current.toISOString().slice(0, 10); // YYYY-MM-DD
      dailyMap.set(key, { expense: 0, income: 0 });
      current.setDate(current.getDate() + 1);
    }

    // Aggregate expenses by date
    for (const exp of expenses) {
      const key = exp.expense_date.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.expense += Number(exp.amount);
      }
    }

    // Aggregate payments by date
    for (const pay of payments) {
      const key = pay.created_at.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.income += Number(pay.amount);
      }
    }

    // Format for chart: each data point has day label, income, expense
    const data: Array<{ day: string; income: number; expense: number }> = [];
    for (const [dateStr, values] of dailyMap) {
      const day = new Date(dateStr + 'T00:00:00');
      const label = `${String(day.getDate()).padStart(2, '0')} ${day.toLocaleString('en', { month: 'short' })}`;
      data.push({
        day: label,
        income: Number(values.income.toFixed(2)),
        expense: Number(values.expense.toFixed(2)),
      });
    }

    return data;
  }

  /**
   * Get expense breakdown by category for the pie chart
   */
  async getExpenseBreakdown(messId: string, userId: string, role: string, month?: string) {
    await this.verifyMessMember(messId, userId, role);
    const { start, end } = this.getMonthRange(month);

    const expenses = await this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        mess_id: messId,
        expense_date: { gte: start, lt: end },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const categoryColors: Record<string, string> = {
      FOOD: '#2f80ed',
      GROCERY: '#58d68d',
      UTILITY: '#ffb84d',
      RENT: '#ff4d4f',
      GAS: '#8b5cf6',
      ELECTRICITY: '#f59e0b',
      WIFI: '#14b8a6',
      CLEANER: '#ec4899',
      MAINTENANCE: '#6366f1',
      BUABILL: '#f97316',
      WATER: '#06b6d4',
      OTHER: '#94a3b8',
    };

    const totalAmount = expenses.reduce((sum, e) => sum + Number(e._sum.amount ?? 0), 0);

    const data = expenses.map((e) => ({
      name: e.category.charAt(0) + e.category.slice(1).toLowerCase(), // Capitalize first letter
      value: totalAmount > 0 ? Number((((Number(e._sum.amount ?? 0) / totalAmount) * 100).toFixed(1))) : 0,
      amount: Number(e._sum.amount ?? 0),
      color: categoryColors[e.category] || '#94a3b8',
    }));

    return { data, totalAmount };
  }

  /**
   * Get weekly meal counts (Mon-Sun) for the bar chart
   */
  async getWeeklyMealCount(messId: string, userId: string, role: string, date?: string) {
    await this.verifyMessMember(messId, userId, role);

    // Determine the week range (Mon-Sun)
    const refDate = date ? new Date(date) : new Date();
    const dayOfWeek = refDate.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
    // Monday = 1, so we need to calculate diff accordingly
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Go back to Monday
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Get all meals for this week
    const meals = await this.prisma.meal.findMany({
      where: {
        mess_id: messId,
        scheduled_date: { gte: monday, lt: sunday },
        status: { not: 'CANCELLED' },
      },
      select: {
        name: true,
        scheduled_date: true,
        attendances: {
          where: { status: 'ON' },
          select: { guests: true },
        },
      },
      orderBy: { scheduled_date: 'asc' },
    });

    // Initialize daily counts
    const dailyData: Record<string, { breakfast: number; lunch: number; dinner: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dailyData[d.toISOString().slice(0, 10)] = { breakfast: 0, lunch: 0, dinner: 0 };
    }

    // Aggregate meals by day and meal name
    for (const meal of meals) {
      const key = meal.scheduled_date.toISOString().slice(0, 10);
      const entry = dailyData[key];
      if (!entry) continue;
      const mealName = meal.name as string;
      const count = meal.attendances.length + meal.attendances.reduce((sum, a) => sum + Number(a.guests ?? 0), 0);
      if (mealName === 'BREAKFAST') entry.breakfast += count;
      else if (mealName === 'LUNCH') entry.lunch += count;
      else if (mealName === 'DINNER') entry.dinner += count;
    }

    // Format for chart
    const data: Array<{ day: string; breakfast: number; lunch: number; dinner: number }> = [];
    let idx = 0;
    for (const [dateStr, counts] of Object.entries(dailyData).sort()) {
      data.push({
        day: dayNames[idx % 7],
        breakfast: counts.breakfast,
        lunch: counts.lunch,
        dinner: counts.dinner,
      });
      idx++;
    }

    return data;
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