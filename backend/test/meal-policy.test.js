const assert = require('node:assert/strict');
const test = require('node:test');

const {
  assertValidMealWindow,
  getDhakaDateKey,
  getMealDecisionWindow,
  normalizeMealAttendance,
  shiftDateKey,
} = require('../dist/app/module/meal/meal-policy');

test('Dhaka date remains correct during the UTC previous-day boundary', () => {
  assert.equal(
    getDhakaDateKey(new Date('2026-07-30T18:30:00.000Z')),
    '2026-07-31',
  );
});

test('member window for August 1 is July 31 from 09:00 to 17:00 Dhaka', () => {
  const duringWindow = getMealDecisionWindow(
    '2026-08-01',
    '09:00',
    '17:00',
    new Date('2026-07-31T06:00:00.000Z'),
  );

  assert.equal(duringWindow.decisionDate, '2026-07-31');
  assert.equal(duringWindow.windowStart.toISOString(), '2026-07-31T03:00:00.000Z');
  assert.equal(duringWindow.windowEnd.toISOString(), '2026-07-31T11:00:00.000Z');
  assert.equal(duringWindow.isTargetDateEditable, true);
  assert.equal(duringWindow.isWindowOpen, true);

  const afterWindow = getMealDecisionWindow(
    '2026-08-01',
    '09:00',
    '17:00',
    new Date('2026-07-31T11:00:00.001Z'),
  );
  assert.equal(afterWindow.isWindowOpen, false);
});

test('member cannot edit today or a date beyond tomorrow', () => {
  const now = new Date('2026-07-31T06:00:00.000Z');
  assert.equal(
    getMealDecisionWindow('2026-07-31', '09:00', '17:00', now)
      .isTargetDateEditable,
    false,
  );
  assert.equal(
    getMealDecisionWindow('2026-08-02', '09:00', '17:00', now)
      .isTargetDateEditable,
    false,
  );
});

test('overnight meal windows can cross midnight and stay open until the target day deadline', () => {
  assert.doesNotThrow(() => assertValidMealWindow('22:00', '11:00'));

  const openWindow = getMealDecisionWindow(
    '2026-08-01',
    '22:00',
    '11:00',
    new Date('2026-07-31T17:00:00.000Z'),
  );

  assert.equal(openWindow.decisionDate, '2026-07-31');
  assert.equal(openWindow.windowStart.toISOString(), '2026-07-31T16:00:00.000Z');
  assert.equal(openWindow.windowEnd.toISOString(), '2026-08-01T05:00:00.000Z');
  assert.equal(openWindow.isWindowOpen, true);

  const closedWindow = getMealDecisionWindow(
    '2026-08-01',
    '22:00',
    '11:00',
    new Date('2026-08-01T05:00:01.000Z'),
  );

  assert.equal(closedWindow.isWindowOpen, false);
});

test('meal windows cannot be zero-length', () => {
  assert.throws(() => assertValidMealWindow('09:00', '09:00'), /non-zero duration/);
});

test('date shifting handles month and leap-year boundaries', () => {
  assert.equal(shiftDateKey('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDateKey('2028-03-01', -1), '2028-02-29');
});

test('attendance normalization uses breakfast base and guest meals', () => {
  assert.deepEqual(
    normalizeMealAttendance({
      mealName: 'BREAKFAST',
      status: 'ON',
      guests: 2,
      mealCount: 2.5,
    }),
    { status: 'ON', guests: 2, mealCount: 2.5 },
  );
});

test('OFF attendance cannot retain guest meals', () => {
  assert.deepEqual(
    normalizeMealAttendance({
      mealName: 'DINNER',
      status: 'OFF',
      guests: 0,
      mealCount: 0,
    }),
    { status: 'OFF', guests: 0, mealCount: 0 },
  );
  assert.throws(
    () =>
      normalizeMealAttendance({
        mealName: 'DINNER',
        status: 'OFF',
        guests: 1,
      }),
    /guests must be 0/,
  );
});

test('attendance normalization rejects inconsistent or excessive counts', () => {
  assert.throws(
    () =>
      normalizeMealAttendance({
        mealName: 'LUNCH',
        status: 'ON',
        guests: 2,
        mealCount: 1,
      }),
    /base meal plus guests/,
  );
  assert.throws(
    () =>
      normalizeMealAttendance({
        mealName: 'LUNCH',
        status: 'ON',
        guests: 21,
      }),
    /between 0 and 20/,
  );
});
