const test = require('node:test');
const assert = require('node:assert/strict');
const {
  BazarDateStatus,
  BazarDutySlotStatus,
  BazarFrequency,
} = require('@prisma/client');
const {
  BazarScheduleService,
} = require('../dist/app/module/bazar/bazar-schedule.service');
const {
  daysInMonth,
  generateBazarDays,
  daysUntil,
  recommendedDutyCount,
} = require('../dist/app/module/bazar/bazar-schedule.policy');

test('generates every day including leap day', () => {
  const days = generateBazarDays(2028, 2, {
    frequency: BazarFrequency.EVERY_DAY,
  });
  assert.equal(daysInMonth(2028, 2), 29);
  assert.equal(days.length, 29);
  assert.deepEqual(days.slice(-2), [28, 29]);
});

test('generates only configured weekdays', () => {
  // September 2026 starts on Tuesday (2).
  const days = generateBazarDays(2026, 9, {
    frequency: BazarFrequency.SPECIFIC_WEEKDAYS,
    weekdays: [2, 5],
  });
  assert.deepEqual(days.slice(0, 4), [1, 4, 8, 11]);
  assert.ok(
    days.every((day) =>
      [2, 5].includes(new Date(Date.UTC(2026, 8, day)).getUTCDay()),
    ),
  );
});

test('custom day pattern repeats safely and excludes invalid month days', () => {
  const pattern = {
    frequency: BazarFrequency.CUSTOM_DATES,
    customDays: [31, 1, 4, 4, 7],
  };
  assert.deepEqual(generateBazarDays(2026, 9, pattern), [1, 4, 7]);
  assert.deepEqual(generateBazarDays(2026, 10, pattern), [1, 4, 7, 31]);
});

test('recommends ceiling of total slots divided by eligible members', () => {
  assert.equal(recommendedDutyCount(24, 8), 3);
  assert.equal(recommendedDutyCount(25, 8), 4);
  assert.equal(recommendedDutyCount(10, 0), 0);
});

test('release notice calculation uses Dhaka calendar date', () => {
  const now = new Date('2026-09-04T18:30:00.000Z'); // Sep 5 in Dhaka
  assert.equal(daysUntil(new Date('2026-09-10T00:00:00.000Z'), now), 5);
  assert.equal(daysUntil(new Date('2026-09-05T00:00:00.000Z'), now), 0);
});

test('overview keeps past assignments in distribution but expires unclaimed slots', () => {
  const service = new BazarScheduleService({}, {});
  const member = {
    id: 'member-1',
    name: 'Rahim',
    email: 'rahim@example.com',
    avatar_url: null,
  };
  const result = service.buildOverview(
    {
      id: 'schedule-1',
      dates: [
        {
          duty_date: new Date('2000-01-01T00:00:00.000Z'),
          status: BazarDateStatus.OPEN,
          slots: [
            {
              status: BazarDutySlotStatus.ASSIGNED,
              assigned_member_id: member.id,
            },
            {
              status: BazarDutySlotStatus.AVAILABLE,
              assigned_member_id: null,
            },
          ],
        },
      ],
    },
    [member],
    member.id,
  );

  assert.equal(result.dates[0].effectiveStatus, BazarDateStatus.COMPLETED);
  assert.equal(result.overview.totalDutySlots, 2);
  assert.equal(result.overview.assigned, 1);
  assert.equal(result.overview.available, 0);
  assert.equal(result.overview.expiredUnassigned, 1);
  assert.equal(result.overview.distribution[0].dutyCount, 1);
});
