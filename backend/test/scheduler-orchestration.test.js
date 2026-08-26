const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');

require('reflect-metadata');
require('ts-node/register/transpile-only');
require('tsconfig-paths/register');

const {
  SCHEDULE_CRON_OPTIONS,
  SCHEDULE_INTERVAL_OPTIONS,
} = require('@nestjs/schedule/dist/schedule.constants');
const {
  MonthlyBillReconciliationService,
} = require('../src/app/module/monthly-bill/monthly-bill-reconciliation.service');
const {
  SubscriptionService,
} = require('../src/app/module/subscription/subscription.service');
const {
  MealPatternService,
} = require('../src/app/module/meal-pattern/meal-pattern.service');

const services = [];

afterEach(() => {
  for (const service of services.splice(0)) service.onApplicationShutdown();
});

function createBillingHarness() {
  const calls = {
    queued: 0,
    recalculated: 0,
    ready: 0,
  };
  const candidate = {
    id: 'billing-state-1',
    mess_id: '11111111-1111-1111-1111-111111111111',
    month: new Date('2026-08-01T00:00:00.000Z'),
    revision: 0,
    attempts: 0,
  };
  let candidatesReturned = false;

  const prisma = {
    $executeRaw: async () => {
      calls.queued += 1;
      return 1;
    },
    $transaction: async (operations) => Promise.all(operations),
    $queryRaw: async () => {
      if (candidatesReturned) return [];
      candidatesReturned = true;
      return [candidate];
    },
    monthlyBillingState: {
      updateMany: async ({ where }) => {
        if (where.id === candidate.id && where.status === 'PROCESSING') {
          calls.ready += 1;
        }
        return { count: where.id === candidate.id ? 1 : 0 };
      },
      findFirst: async () => null,
      findUnique: async () => null,
    },
    monthlyBill: {
      findFirst: async () => null,
    },
  };
  const monthlyBillService = {
    recalculateMonthlyBills: async () => {
      calls.recalculated += 1;
    },
  };
  const service = new MonthlyBillReconciliationService(
    prisma,
    monthlyBillService,
  );
  services.push(service);
  return { calls, service };
}

describe('scheduler orchestration', () => {
  it('uses Dhaka time for subscription expiry and twice-daily billing safety checks', () => {
    const subscriptionSchedule = Reflect.getMetadata(
      SCHEDULE_CRON_OPTIONS,
      SubscriptionService.prototype.checkExpiredSubscriptionsDaily,
    );
    const billingSchedule = Reflect.getMetadata(
      SCHEDULE_CRON_OPTIONS,
      MonthlyBillReconciliationService.prototype.runScheduledSafetyCheck,
    );
    const mealPatternSchedule = Reflect.getMetadata(
      SCHEDULE_CRON_OPTIONS,
      MealPatternService.prototype.generateUpcomingMeals,
    );

    assert.deepEqual(subscriptionSchedule, {
      cronTime: '5 0 * * *',
      timeZone: 'Asia/Dhaka',
    });
    assert.deepEqual(billingSchedule, {
      cronTime: '0 3,15 * * *',
      timeZone: 'Asia/Dhaka',
    });
    assert.deepEqual(mealPatternSchedule, {
      cronTime: '1 0 * * *',
      timeZone: 'Asia/Dhaka',
    });
    assert.equal(
      Reflect.getMetadata(
        SCHEDULE_INTERVAL_OPTIONS,
        MonthlyBillReconciliationService.prototype.processQueuedBilling,
      ),
      undefined,
    );
  });

  it('wakes the billing worker immediately after a month is queued', async () => {
    const { calls, service } = createBillingHarness();

    const status = await service.reconcile(
      '11111111-1111-1111-1111-111111111111',
      new Date('2026-08-24T00:00:00.000Z'),
    );
    await new Promise((resolve) => setTimeout(resolve, 25));

    assert.equal(status, 'RECALCULATION_QUEUED');
    assert.equal(calls.queued, 1);
    assert.equal(calls.recalculated, 1);
    assert.equal(calls.ready, 1);
    assert.equal(service.workerTimer, null);
  });

  it('generates only the next Dhaka day and reconciles each affected mess once', async () => {
    let patternQuery;
    const generatedDates = [];
    const reconciliationCalls = [];
    const messId = '22222222-2222-2222-2222-222222222222';
    const patterns = [
      { id: 'pattern-1', membership: { mess_id: messId } },
      { id: 'pattern-2', membership: { mess_id: messId } },
    ];
    const prisma = {
      mealPattern: {
        findMany: async (query) => {
          patternQuery = query;
          return patterns;
        },
      },
    };
    const billReconciliation = {
      reconcile: async (...args) => {
        reconciliationCalls.push(args);
      },
    };
    const service = new MealPatternService(prisma, billReconciliation);
    service.generateDate = async (_pattern, date) => {
      generatedDates.push(date);
      return true;
    };

    await service.generateUpcomingMeals();

    const expectedToday = new Date(
      `${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date())}T00:00:00.000Z`,
    );
    const expectedTarget = new Date(expectedToday.getTime() + 86_400_000);
    assert.equal(
      patternQuery.where.start_date.lte.toISOString(),
      expectedTarget.toISOString(),
    );
    assert.equal(
      patternQuery.where.OR[1].end_date.gte.toISOString(),
      expectedTarget.toISOString(),
    );
    assert.deepEqual(
      generatedDates.map((date) => date.toISOString()),
      [expectedTarget.toISOString(), expectedTarget.toISOString()],
    );
    assert.deepEqual(patternQuery.where.membership, { is_active: true });
    assert.deepEqual(reconciliationCalls, [[messId, expectedTarget]]);
  });

  it('generates the current and upcoming meals immediately when a pattern is activated', async () => {
    const actorId = '33333333-3333-3333-3333-333333333333';
    const messId = '44444444-4444-4444-4444-444444444444';
    const membership = {
      id: '55555555-5555-5555-5555-555555555555',
      user_id: actorId,
      mess_id: messId,
      is_active: true,
      role: 'MEMBER',
      mess: { created_by: '66666666-6666-6666-6666-666666666666' },
    };
    const todayKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
    }).format(new Date());
    const today = new Date(`${todayKey}T00:00:00.000Z`);
    const tomorrow = new Date(today.getTime() + 86_400_000);
    const generatedDates = [];
    const reconciliationCalls = [];
    const prisma = {
      messMembership: {
        findUnique: async () => membership,
      },
      $transaction: async (callback) =>
        callback({
          mealPattern: {
            findFirst: async () => null,
            create: async ({ data }) => ({
              id: 'pattern-1',
              ...data,
              membership,
            }),
          },
        }),
    };
    const service = new MealPatternService(prisma, {
      reconcile: async (...args) => reconciliationCalls.push(args),
    });
    service.generateDate = async (_pattern, date) => {
      generatedDates.push(date);
      return true;
    };

    const pattern = await service.create(actorId, 'MEMBER', {
      membershipId: membership.id,
      patternType: 'DAILY',
      dailySchedule: { BREAKFAST: 0.5, LUNCH: 1, DINNER: 1 },
      startDate: todayKey,
      activate: true,
    });

    assert.equal(pattern.status, 'ACTIVE');
    assert.deepEqual(
      generatedDates.map((date) => date.toISOString()),
      [today.toISOString(), tomorrow.toISOString()],
    );
    assert.deepEqual(reconciliationCalls, [[messId, today, tomorrow]]);
  });
});
