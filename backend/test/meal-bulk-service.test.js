const assert = require('node:assert/strict');
const test = require('node:test');

const { MealService } = require('../dist/app/module/meal/meal.service');

const managerId = '11111111-1111-4111-8111-111111111111';
const messId = '22222222-2222-4222-8222-222222222222';
const memberId = '33333333-3333-4333-8333-333333333333';

function contextMess() {
  return {
    id: messId,
    name: 'Test Mess',
    created_by: managerId,
    meal_deadline_start: '09:00',
    meal_deadline_end: '17:00',
    meal_default_status: 'ON',
    meal_allow_no_meal: true,
    meal_window_notification_enabled: true,
    meal_deadline_notification_enabled: true,
    meal_deadline_reminder_minutes: 60,
  };
}

function createHarness({ membershipRole = 'MANAGER', existingMeals = [], existingAttendances = [] } = {}) {
  let mealFindCalls = 0;
  let transactionCalls = 0;
  const upserts = [];
  const auditBatches = [];
  const tx = {
    meal: {
      findMany: async () => {
        mealFindCalls += 1;
        if (mealFindCalls === 1) return existingMeals;
        return [
          { id: '44444444-4444-4444-8444-444444444444', name: 'BREAKFAST' },
          { id: '55555555-5555-4555-8555-555555555555', name: 'DINNER' },
        ];
      },
      createMany: async () => ({ count: 2 }),
      updateMany: async () => ({ count: 0 }),
    },
    mealAttendance: {
      findMany: async () => existingAttendances,
      upsert: async (args) => {
        upserts.push(args);
        return {
          id: `66666666-6666-4666-8666-66666666666${upserts.length}`,
          member_id: args.where.meal_id_member_id.member_id,
          status: args.create.status,
          guests: args.create.guests,
          updated_at: new Date('2026-09-02T00:00:00.000Z'),
        };
      },
    },
    auditLog: {
      createMany: async ({ data }) => {
        auditBatches.push(data);
        return { count: data.length };
      },
    },
  };
  const prisma = {
    mess: { findUnique: async () => contextMess() },
    messMembership: {
      findUnique: async () => ({ role: membershipRole, is_active: true }),
      findMany: async () => [
        {
          id: memberId,
          user_id: memberId,
          role: 'MEMBER',
          is_active: true,
          user: { id: memberId, name: 'Member One', email: 'one@example.com', avatar_url: null },
        },
      ],
    },
    user: {
      findUnique: async () => ({
        id: managerId,
        name: 'Manager',
        email: 'manager@example.com',
        avatar_url: null,
        is_active: true,
      }),
    },
    $transaction: async (operation) => {
      transactionCalls += 1;
      return operation(tx);
    },
  };
  const reconciliationCalls = [];
  const reconciliation = {
    reconcile: async (...args) => {
      reconciliationCalls.push(args);
      return 'RECALCULATION_QUEUED';
    },
  };
  const service = new MealService(prisma, reconciliation, {});
  return {
    service,
    get transactionCalls() { return transactionCalls; },
    upserts,
    auditBatches,
    reconciliationCalls,
  };
}

test('saves several changed cells in one transaction and queues billing once', async () => {
  const harness = createHarness();
  const result = await harness.service.bulkUpdateAttendances(
    messId,
    managerId,
    'MANAGER',
    {
      date: '2026-09-02',
      updates: [
        { memberId, mealName: 'BREAKFAST', mealCount: 1.5, expectedMealCount: 0 },
        { memberId, mealName: 'DINNER', mealCount: 1, expectedMealCount: 0 },
      ],
    },
  );

  assert.equal(harness.transactionCalls, 1);
  assert.equal(harness.upserts.length, 2);
  assert.equal(harness.auditBatches.length, 1);
  assert.equal(harness.auditBatches[0].length, 2);
  assert.equal(harness.reconciliationCalls.length, 1);
  assert.equal(result.requestedCount, 2);
  assert.equal(result.updatedCount, 2);
  assert.equal(result.affectedMemberCount, 1);
  assert.equal(result.billingSync, 'RECALCULATION_QUEUED');
});

test('rejects a stale expected value atomically before attendance writes', async () => {
  const mealId = '44444444-4444-4444-8444-444444444444';
  const harness = createHarness({
    existingMeals: [{ id: mealId, name: 'BREAKFAST', status: 'CONFIRMED', is_locked: false }],
    existingAttendances: [
      {
        id: '77777777-7777-4777-8777-777777777777',
        member_id: memberId,
        status: 'ON',
        guests: '1',
        source: 'MANUAL',
        pattern_id: null,
        meal: { name: 'BREAKFAST' },
      },
    ],
  });

  await assert.rejects(
    harness.service.bulkUpdateAttendances(messId, managerId, 'MANAGER', {
      date: '2026-09-02',
      updates: [
        { memberId, mealName: 'BREAKFAST', mealCount: 2.5, expectedMealCount: 0.5 },
      ],
    }),
    (error) => error?.status === 409,
  );
  assert.equal(harness.upserts.length, 0);
  assert.equal(harness.auditBatches.length, 0);
  assert.equal(harness.reconciliationCalls.length, 0);
});

test('treats an identical retry as a no-op and does not queue billing again', async () => {
  const mealId = '44444444-4444-4444-8444-444444444444';
  const harness = createHarness({
    existingMeals: [{ id: mealId, name: 'BREAKFAST', status: 'CONFIRMED', is_locked: false }],
    existingAttendances: [
      {
        id: '77777777-7777-4777-8777-777777777777',
        member_id: memberId,
        status: 'ON',
        guests: '1',
        source: 'MANUAL',
        pattern_id: null,
        meal: { name: 'BREAKFAST' },
      },
    ],
  });

  const result = await harness.service.bulkUpdateAttendances(
    messId,
    managerId,
    'MANAGER',
    {
      date: '2026-09-02',
      updates: [
        { memberId, mealName: 'BREAKFAST', mealCount: 1.5, expectedMealCount: 1.5 },
      ],
    },
  );

  assert.equal(result.updatedCount, 0);
  assert.equal(result.unchangedCount, 1);
  assert.equal(result.billingSync, 'SYNCED');
  assert.equal(harness.upserts.length, 0);
  assert.equal(harness.auditBatches.length, 0);
  assert.equal(harness.reconciliationCalls.length, 0);
});

test('rejects a non-manager before opening a write transaction', async () => {
  const harness = createHarness({ membershipRole: 'MEMBER' });
  await assert.rejects(
    harness.service.bulkUpdateAttendances(messId, memberId, 'MEMBER', {
      date: '2026-09-02',
      updates: [{ memberId, mealName: 'LUNCH', mealCount: 1 }],
    }),
    (error) => error?.status === 403,
  );
  assert.equal(harness.transactionCalls, 0);
});
