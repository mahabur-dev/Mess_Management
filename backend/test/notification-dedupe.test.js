require('reflect-metadata');

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const {
  NotificationService,
} = require('../dist/app/module/notification/notification.service');

const storedNotification = {
  id: 'notification-1',
  type: 'MEAL_UPDATE',
  title: 'Meal reminder',
  body: 'Choose your meals.',
  metadata: { targetUserIds: ['member-1'] },
  created_at: new Date('2026-09-26T12:00:00.000Z'),
  mess: { id: 'mess-1', name: 'Together We Dine' },
  sender: null,
  reads: [],
};

function serviceWithInsertCount(count) {
  const calls = { inserts: [], pushes: [] };
  const prisma = {
    notification: {
      createMany: async (args) => {
        calls.inserts.push(args);
        return { count };
      },
      findUnique: async () => storedNotification,
      create: async () => {
        throw new Error('deduplicated notifications must not use create');
      },
    },
  };
  const service = new NotificationService(prisma, {});
  service.dispatchPushToUsers = async (...args) => {
    calls.pushes.push(args);
    return { sent: 1, failed: 0 };
  };
  return { service, calls };
}

describe('notification deduplication', () => {
  it('uses a conflict-safe insert and does not resend push for an existing key', async () => {
    const { service, calls } = serviceWithInsertCount(0);

    const result = await service.createForMess(
      null,
      'mess-1',
      'MEAL_UPDATE',
      'Meal reminder',
      'Choose your meals.',
      { source: 'TEST' },
      ['member-1'],
      '/meals',
      'meal:reminder:mess-1:2026-09-27',
    );

    assert.equal(result.id, storedNotification.id);
    assert.equal(calls.inserts.length, 1);
    assert.equal(calls.inserts[0].skipDuplicates, true);
    assert.equal(calls.pushes.length, 0);
  });

  it('dispatches push exactly once when this process creates the record', async () => {
    const { service, calls } = serviceWithInsertCount(1);

    await service.createForMess(
      null,
      'mess-1',
      'MEAL_UPDATE',
      'Meal reminder',
      'Choose your meals.',
      undefined,
      ['member-1'],
      '/meals',
      'meal:reminder:mess-1:2026-09-27',
    );

    assert.equal(calls.pushes.length, 1);
  });
});
