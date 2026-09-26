require('reflect-metadata');

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const {
  MonthlyReportPdfService,
} = require('../dist/app/module/monthly-report/monthly-report-pdf.service');
const {
  MonthlyReportService,
} = require('../dist/app/module/monthly-report/monthly-report.service');

const memberOne = {
  memberId: 'member-1',
  name: 'Rahim Ahmed',
  email: 'rahim@example.com',
  totalMeals: 52,
  mealCost: 2600,
  otherCost: 1000,
  rentCost: 700,
  utilityCost: 300,
  totalAmount: 3600,
  deposit: 4000,
  paidAmount: 0,
  previousBalance: 0,
  balance: -400,
  due: 0,
  credit: 400,
  status: 'PAID',
};

const memberTwo = {
  memberId: 'member-2',
  name: 'করিম',
  email: 'karim@example.com',
  totalMeals: 48,
  mealCost: 2400,
  otherCost: 1000,
  rentCost: 700,
  utilityCost: 300,
  totalAmount: 3400,
  deposit: 3000,
  paidAmount: 0,
  previousBalance: 0,
  balance: 400,
  due: 400,
  credit: 0,
  status: 'PENDING',
};

const snapshot = {
  schemaVersion: 1,
  mess: { id: 'mess-1', name: 'শান্তি নিবাস', currency: 'BDT' },
  month: '2026-08-01T00:00:00.000Z',
  summary: {
    totalMembers: 2,
    totalMeals: 100,
    totalExpense: 7000,
    totalDeposit: 7000,
    mealRate: 50,
    totalMessCost: 11000,
    totalDue: 400,
    totalCredit: 400,
  },
  expenseSummary: {
    foodBazar: 5000,
    utility: 1200,
    rentHouse: 4000,
    otherExpenses: 800,
    totalExpense: 7000,
    totalMessCost: 11000,
  },
  members: [memberOne, memberTwo],
  expenseRegister: [
    {
      id: 'expense-1',
      date: '2026-08-05T00:00:00.000Z',
      purchasedBy: 'Rahim Ahmed',
      category: 'GROCERY',
      description: 'Rice and vegetables',
      amount: 2500,
    },
  ],
  depositRegister: [
    {
      id: 'deposit-1',
      date: '2026-08-03T00:00:00.000Z',
      member: 'Rahim Ahmed',
      method: 'BKASH',
      amount: 4000,
    },
  ],
};

describe('monthly report', () => {
  it('renders valid English and Bangla PDF buffers from one snapshot', async () => {
    const pdf = new MonthlyReportPdfService();
    for (const locale of ['en', 'bn']) {
      const buffer = await pdf.render(snapshot, locale);
      assert.equal(buffer.subarray(0, 4).toString(), '%PDF');
      assert.ok(buffer.length > 4000);
    }
  });

  it('keeps another member financial row private', () => {
    const service = new MonthlyReportService({}, {}, {}, {});
    const record = {
      id: 'report-1',
      mess_id: 'mess-1',
      month: new Date(snapshot.month),
      status: 'FINALIZED',
      version: 1,
      source_revision: 1,
      snapshot,
      generated_at: new Date(),
      finalized_at: new Date(),
      generator: null,
      finalizer: null,
      deliveries: [{ id: 'delivery-1' }],
    };
    const result = service.presentReport(record, 'member-1', {
      canManage: false,
      isMember: true,
    });
    assert.deepEqual(
      result.snapshot.members.map((member) => member.memberId),
      ['member-1'],
    );
    assert.deepEqual(result.deliveries, []);
  });

  it('removes inactive memberships from an existing report presentation', async () => {
    const service = new MonthlyReportService(
      {
        messMembership: {
          findMany: async () => [{ user_id: 'member-1' }],
        },
      },
      {},
      {},
      {},
    );
    const result = await service.onlyActiveMembers(snapshot, 'mess-1');

    assert.deepEqual(
      result.members.map((member) => member.memberId),
      ['member-1'],
    );
    assert.equal(result.summary.totalMembers, 1);
    assert.equal(result.summary.totalMeals, 52);
    assert.equal(result.summary.totalDeposit, 4000);
    assert.equal(result.summary.totalCredit, 400);
    assert.equal(result.summary.totalDue, 0);
  });

  it('presents credit as a positive localized balance in member email', () => {
    const service = new MonthlyReportService({}, {}, {}, {});
    const message = service.emailContent(
      'report-1',
      snapshot,
      memberOne,
      'bn',
    );
    assert.match(message.html, /৪০০[^<]*জমা/);
    assert.doesNotMatch(message.html, /-৪০০/);
  });
});
