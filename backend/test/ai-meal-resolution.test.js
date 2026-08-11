const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AiAutomationService,
} = require('../dist/app/module/ai-automation/ai-automation.service');

function command(overrides) {
  return {
    intent: 'MEAL_CREATE',
    confidence: 1,
    clarification: null,
    missingFields: [],
    data: {
      amount: null,
      date: null,
      startDate: null,
      endDate: null,
      category: null,
      utilityType: null,
      itemName: null,
      description: null,
      memberName: 'Test User',
      mealName: null,
      mealCount: null,
      status: null,
      quantity: null,
      unit: null,
      items: [],
      meals: [],
      ...overrides,
    },
  };
}

function resolve(parsed) {
  const service = new AiAutomationService({}, {}, {}, {}, {}, {});
  const actor = { id: 'member-1', name: 'Test User' };
  return service.resolveParsed(parsed, 'mess-1', actor, [actor], true);
}

test('resolves breakfast, lunch and dinner from one command', () => {
  const result = resolve(
    command({
      meals: [
        { mealName: 'BREAKFAST', mealCount: 1, status: 'ON', date: '2026-08-11', startDate: null, endDate: null, memberName: null },
        { mealName: 'DINNER', mealCount: 1, status: 'ON', date: '2026-08-11', startDate: null, endDate: null, memberName: null },
        { mealName: 'LUNCH', mealCount: 1, status: 'ON', date: '2026-08-11', startDate: null, endDate: null, memberName: null },
      ],
    }),
  );

  assert.equal(result.intent, 'MEAL_CREATE');
  assert.deepEqual(result.missingFields, []);
  assert.deepEqual(
    result.payload.items.map(({ mealName, mealCount, date }) => ({ mealName, mealCount, date })),
    [
      { mealName: 'BREAKFAST', mealCount: 0.5, date: '2026-08-11' },
      { mealName: 'DINNER', mealCount: 1, date: '2026-08-11' },
      { mealName: 'LUNCH', mealCount: 1, date: '2026-08-11' },
    ],
  );
});

test('expands several meal types over exactly five inclusive dates', () => {
  const result = resolve(
    command({
      meals: [
        { mealName: 'BREAKFAST', mealCount: 2, status: 'ON', date: null, startDate: '2026-08-11', endDate: '2026-08-15', memberName: null },
        { mealName: 'LUNCH', mealCount: 1, status: 'ON', date: null, startDate: '2026-08-11', endDate: '2026-08-15', memberName: null },
      ],
    }),
  );

  assert.equal(result.payload.items.length, 10);
  assert.deepEqual(
    result.payload.items.filter((item) => item.mealName === 'BREAKFAST').map((item) => item.mealCount),
    [1, 1, 1, 1, 1],
  );
  assert.equal(result.payload.items[0].date, '2026-08-11');
  assert.equal(result.payload.items.at(-1).date, '2026-08-15');
});

test('keeps an arbitrary dinner count on a past date', () => {
  const result = resolve(
    command({
      mealName: 'DINNER',
      mealCount: 3,
      status: 'ON',
      date: '2026-08-10',
    }),
  );

  assert.equal(result.payload.mealName, 'DINNER');
  assert.equal(result.payload.mealCount, 3);
  assert.equal(result.payload.date, '2026-08-10');
});
