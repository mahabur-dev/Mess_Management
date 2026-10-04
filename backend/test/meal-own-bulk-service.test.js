const assert = require('node:assert/strict');
const test = require('node:test');

const { MealService } = require('../dist/app/module/meal/meal.service');

const managerId = '11111111-1111-4111-8111-111111111111';
const messId = '22222222-2222-4222-8222-222222222222';
const idempotencyKey = '33333333-3333-4333-8333-333333333333';

function contextMess() {
  return {
    id: messId,
    name: 'Performance Test Mess',
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

function fullMonthUpdates() {
  const mealNames = ['BREAKFAST', 'LUNCH', 'DINNER'];
  return Array.from({ length: 31 }, (_item, index) => {
    const date = `2026-12-${String(index + 1).padStart(2, '0')}`;
    return mealNames.map((mealName) => ({
      date,
      mealName,
      status: 'ON',
      guests: 0,
      mealCount: mealName === 'BREAKFAST' ? 0.5 : 1,
    }));
  }).flat();
}

function createHarness() {
  let storedCommand = null;
  let createdMeals = [];
  let mealFindCalls = 0;
  let rawQueryIndex = 0;
  let attendanceUpsertCalls = 0;
  let createManyCalls = 0;
  let auditBatchCalls = 0;
  let commandCreateCalls = 0;
  let transactionCalls = 0;

  const tx = {
    $queryRaw: async () => {
      rawQueryIndex += 1;
      if (rawQueryIndex <= 2) return [];
      if (rawQueryIndex === 3) return storedCommand ? [storedCommand] : [];
      attendanceUpsertCalls += 1;
      return createdMeals.map((meal, index) => ({
        id: `44444444-4444-4444-8444-${String(index + 1).padStart(12, '0')}`,
        meal_id: meal.id,
        status: 'ON',
        guests: 0,
      }));
    },
    meal: {
      findMany: async () => {
        mealFindCalls += 1;
        return mealFindCalls % 2 === 1 ? [] : createdMeals;
      },
      createMany: async ({ data }) => {
        createManyCalls += 1;
        createdMeals = data.map((meal, index) => ({
          id: `55555555-5555-4555-8555-${String(index + 1).padStart(12, '0')}`,
          name: meal.name,
          scheduled_date: meal.scheduled_date,
        }));
        return { count: data.length };
      },
      updateMany: async () => ({ count: 0 }),
    },
    mealAttendance: {
      findMany: async () => [],
    },
    auditLog: {
      createMany: async ({ data }) => {
        auditBatchCalls += 1;
        assert.equal(data.length, 93);
        return { count: data.length };
      },
    },
    mealBulkCommand: {
      create: async ({ data }) => {
        commandCreateCalls += 1;
        storedCommand = {
          request_hash: data.request_hash,
          response: data.response,
        };
        return data;
      },
    },
  };

  const prisma = {
    mess: { findUnique: async () => contextMess() },
    messMembership: {
      findUnique: async () => ({ role: 'MANAGER', is_active: true }),
    },
    user: { findUnique: async () => ({ is_active: true }) },
    subscription: {
      findUnique: async () => ({ status: 'ACTIVE', end_date: null }),
    },
    mealBulkCommand: {
      findUnique: async () => storedCommand,
    },
    $transaction: async (operation) => {
      transactionCalls += 1;
      rawQueryIndex = 0;
      return operation(tx);
    },
  };
  const reconciliation = {
    queueCalls: 0,
    wakeCalls: 0,
    async queueInTransaction() {
      this.queueCalls += 1;
      return 1;
    },
    wakeWorker() {
      this.wakeCalls += 1;
    },
  };

  return {
    service: new MealService(prisma, reconciliation, {}),
    reconciliation,
    metrics: () => ({
      attendanceUpsertCalls,
      createManyCalls,
      auditBatchCalls,
      commandCreateCalls,
      transactionCalls,
    }),
  };
}

test('writes a 31-day routine with set-based operations and replays safely', async () => {
  const harness = createHarness();
  const dto = { idempotencyKey, updates: fullMonthUpdates() };

  const first = await harness.service.bulkUpdateOwnAttendances(
    messId,
    managerId,
    'MANAGER',
    dto,
  );

  assert.equal(first.updatedCount, 93);
  assert.deepEqual(harness.metrics(), {
    attendanceUpsertCalls: 1,
    createManyCalls: 1,
    auditBatchCalls: 1,
    commandCreateCalls: 1,
    transactionCalls: 1,
  });
  assert.equal(harness.reconciliation.queueCalls, 1);
  assert.equal(harness.reconciliation.wakeCalls, 1);

  const replay = await harness.service.bulkUpdateOwnAttendances(
    messId,
    managerId,
    'MANAGER',
    dto,
  );

  assert.equal(replay.updatedCount, 93);
  assert.equal(replay.idempotentReplay, true);
  assert.deepEqual(harness.metrics(), {
    attendanceUpsertCalls: 1,
    createManyCalls: 1,
    auditBatchCalls: 1,
    commandCreateCalls: 1,
    transactionCalls: 1,
  });
  assert.equal(harness.reconciliation.queueCalls, 1);
  assert.equal(harness.reconciliation.wakeCalls, 1);

  const changedDto = {
    ...dto,
    updates: dto.updates.map((update, index) =>
      index === 0 ? { ...update, guests: 1, mealCount: 1.5 } : update,
    ),
  };
  await assert.rejects(
    harness.service.bulkUpdateOwnAttendances(
      messId,
      managerId,
      'MANAGER',
      changedDto,
    ),
    (error) => error?.status === 409,
  );
  assert.equal(harness.metrics().attendanceUpsertCalls, 1);
  assert.equal(harness.reconciliation.queueCalls, 1);
});
