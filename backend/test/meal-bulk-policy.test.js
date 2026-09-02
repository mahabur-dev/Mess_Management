const assert = require('node:assert/strict');
const test = require('node:test');

const {
  bulkMealUpdateKey,
  mealCountFromAttendance,
  normalizeBulkMealUpdates,
} = require('../dist/app/module/meal/meal-bulk.policy');

test('normalizes changed meal-sheet cells and preserves expected values', () => {
  const result = normalizeBulkMealUpdates(
    [
      {
        memberId: 'member-1',
        mealName: 'BREAKFAST',
        mealCount: 1.5,
        expectedMealCount: 0.5,
      },
      { memberId: 'member-2', mealName: 'DINNER', mealCount: 0 },
    ],
    'ON',
  );

  assert.deepEqual(result[0].normalized, {
    status: 'ON',
    guests: 1,
    mealCount: 1.5,
  });
  assert.equal(result[0].expectedMealCount, 0.5);
  assert.deepEqual(result[1].normalized, {
    status: 'OFF',
    guests: 0,
    mealCount: 0,
  });
});

test('rejects duplicate member and meal pairs before any write', () => {
  assert.throws(
    () =>
      normalizeBulkMealUpdates(
        [
          { memberId: 'member-1', mealName: 'LUNCH', mealCount: 1 },
          { memberId: 'member-1', mealName: 'LUNCH', mealCount: 2 },
        ],
        'ON',
      ),
    /Duplicate bulk meal update/,
  );
});

test('uses the same meal-count rules as individual meal writes', () => {
  assert.equal(bulkMealUpdateKey('member-1', 'DINNER'), 'member-1:DINNER');
  assert.equal(
    mealCountFromAttendance('BREAKFAST', { status: 'ON', guests: '2' }),
    2.5,
  );
  assert.equal(
    mealCountFromAttendance('LUNCH', { status: 'OFF', guests: '20' }),
    0,
  );
  assert.throws(
    () =>
      normalizeBulkMealUpdates(
        [{ memberId: 'member-1', mealName: 'BREAKFAST', mealCount: 0.25 }],
        'ON',
      ),
    /guests must be between 0 and 20/,
  );
});
