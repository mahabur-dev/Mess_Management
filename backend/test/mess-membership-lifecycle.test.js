const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const path = require('node:path');

require('reflect-metadata');
process.env.NODE_PATH = path.resolve(__dirname, '../dist');
require('node:module').Module._initPaths();

const { MembershipRole } = require('@prisma/client');
const { MessService } = require('../dist/app/module/mess/mess.service');

const MESS_ID = '11111111-1111-1111-1111-111111111111';
const MANAGER_ID = '22222222-2222-2222-2222-222222222222';
const MEMBER_ID = '33333333-3333-3333-3333-333333333333';

function createService(prisma) {
  return new MessService(
    prisma,
    { reconcile: async () => 'RECALCULATION_QUEUED' },
    {},
    {},
  );
}

describe('mess membership lifecycle', () => {
  it('uses active-only membership counts in mess responses', () => {
    const service = createService({});

    assert.deepEqual(service.messSelect._count.select.memberships, {
      where: { is_active: true },
    });
  });

  it('removes the mess membership without deleting the user profile', async () => {
    let membershipUpdate;
    let patternUpdate;
    let userDeleted = false;
    const prisma = {
      mess: {
        findUnique: async () => ({ id: MESS_ID, created_by: MANAGER_ID }),
      },
      messMembership: {
        findUnique: async () => ({
          id: 'membership-1',
          mess_id: MESS_ID,
          user_id: MEMBER_ID,
          is_active: true,
        }),
      },
      user: {
        delete: async () => {
          userDeleted = true;
        },
      },
      $transaction: async (callback) =>
        callback({
          messMembership: {
            update: async (query) => {
              membershipUpdate = query;
              return query;
            },
          },
          mealPattern: {
            updateMany: async (query) => {
              patternUpdate = query;
              return { count: 1 };
            },
          },
        }),
    };

    await createService(prisma).removeMember(
      MESS_ID,
      MEMBER_ID,
      MANAGER_ID,
      'MANAGER',
    );

    assert.equal(membershipUpdate.data.is_active, false);
    assert.ok(membershipUpdate.data.left_at instanceof Date);
    assert.equal(patternUpdate.where.membership_id, 'membership-1');
    assert.equal(patternUpdate.where.status, 'ACTIVE');
    assert.equal(patternUpdate.data.status, 'CANCELLED');
    assert.equal(userDeleted, false);
  });

  it('returns only active users as deposit and form member options', async () => {
    let membershipQuery;
    const prisma = {
      mess: {
        findUnique: async () => ({ id: MESS_ID, created_by: MANAGER_ID }),
      },
      messMembership: {
        findMany: async (query) => {
          membershipQuery = query;
          return [{ user: { id: MEMBER_ID, name: 'Member', email: 'm@test.dev' } }];
        },
      },
    };

    const options = await createService(prisma).getMemberOptions(
      MESS_ID,
      MANAGER_ID,
      'MANAGER',
    );

    assert.equal(membershipQuery.where.mess_id, MESS_ID);
    assert.equal(membershipQuery.where.is_active, true);
    assert.deepEqual(membershipQuery.where.user, { is_active: true });
    assert.deepEqual(options, [
      { id: MEMBER_ID, name: 'Member', email: 'm@test.dev' },
    ]);
  });

  it('can reactivate a previous membership while keeping the same user profile', async () => {
    let membershipUpdate;
    let membershipCreated = false;
    const prisma = {
      mess: {
        findUnique: async () => ({ id: MESS_ID, created_by: MANAGER_ID, rooms: [] }),
      },
      user: {
        findUnique: async () => ({ id: MEMBER_ID, email: 'm@test.dev' }),
      },
      messMembership: {
        findFirst: async () => null,
        findUnique: async () => ({
          id: 'membership-1',
          mess_id: MESS_ID,
          user_id: MEMBER_ID,
          is_active: false,
        }),
        update: async (query) => {
          membershipUpdate = query;
          return query;
        },
        create: async () => {
          membershipCreated = true;
        },
      },
    };

    await createService(prisma).addMember(
      MESS_ID,
      MANAGER_ID,
      'm@test.dev',
      MembershipRole.MEMBER,
    );

    assert.equal(membershipCreated, false);
    assert.equal(membershipUpdate.data.is_active, true);
    assert.equal(membershipUpdate.data.left_at, null);
    assert.ok(membershipUpdate.data.joined_at instanceof Date);
  });
});
