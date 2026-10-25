const assert = require('node:assert/strict');
const test = require('node:test');
require('ts-node/register/transpile-only');
require('tsconfig-paths/register');

const {
  PersonalService,
} = require('../src/app/module/personal/personal.service.ts');

test('filters dashboard recent transactions by the selected month', async () => {
  let recentTransactionQuery;
  const prisma = {
    personalTransaction: {
      groupBy: async () => [],
      findMany: async (query) => {
        recentTransactionQuery = query;
        return [];
      },
    },
  };
  const service = new PersonalService(prisma);

  await service.getSummary('user-1', '2026-08');

  assert.deepEqual(recentTransactionQuery.where, {
    user_id: 'user-1',
    date: {
      gte: new Date('2026-08-01T00:00:00.000Z'),
      lt: new Date('2026-09-01T00:00:00.000Z'),
    },
  });
});
