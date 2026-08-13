const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const tscBuildRoot = path.join(__dirname, '../dist/src');
const moduleAliasRoot = path.join(__dirname, '../dist');
const usesTscBuild = fs.existsSync(
  path.join(tscBuildRoot, 'app/module/ai-automation/ai-automation.service.js'),
);
if (usesTscBuild) {
  process.env.NODE_PATH = [moduleAliasRoot, process.env.NODE_PATH]
    .filter(Boolean)
    .join(path.delimiter);
  require('node:module').Module._initPaths();
}
const servicePath = usesTscBuild
  ? '../dist/src/app/module/ai-automation/ai-automation.service'
  : '../dist/app/module/ai-automation/ai-automation.service';
const {
  AiAutomationService,
} = require(servicePath);

function depositCommand(memberName, amount = 2000) {
  return {
    intent: 'DEPOSIT_CREATE',
    confidence: 1,
    clarification: null,
    missingFields: memberName ? [] : ['memberName'],
    data: {
      amount,
      date: '2026-08-12',
      startDate: null,
      endDate: null,
      category: null,
      utilityType: null,
      itemName: null,
      description: 'Deposit from AI command',
      memberName,
      mealName: null,
      mealCount: null,
      status: null,
      quantity: null,
      unit: null,
      items: [],
      meals: [],
    },
  };
}

function resolve(memberName, amount = 2000) {
  const service = new AiAutomationService({}, {}, {}, {}, {}, {});
  const actor = { id: 'actor-1', name: 'Mahabur Rahman' };
  const najmul = { id: 'member-2', name: 'Najmul Hossain' };
  return {
    result: service.resolveParsed(
      depositCommand(memberName, amount),
      'mess-1',
      actor,
      [actor, najmul],
      true,
    ),
    actor,
    najmul,
  };
}

test('uses the authenticated actor when a deposit member is omitted', () => {
  const { result, actor } = resolve(null);
  assert.equal(result.intent, 'DEPOSIT_CREATE');
  assert.deepEqual(result.missingFields, []);
  assert.equal(result.payload.memberId, actor.id);
  assert.equal(result.payload.amount, 2000);
});

test('understands self references in Bangla, English and Banglish', () => {
  for (const reference of ['আমার জন্য', 'for me', 'amar jonno', 'myself']) {
    const { result, actor } = resolve(reference);
    assert.equal(result.payload.memberId, actor.id, reference);
    assert.deepEqual(result.missingFields, [], reference);
  }
});

test('resolves named deposits across Latin and Bangla scripts', () => {
  for (const reference of ['Najmul', 'নাজমুল']) {
    const { result, najmul } = resolve(reference, 1000);
    assert.equal(result.payload.memberId, najmul.id, reference);
    assert.equal(result.payload.amount, 1000);
    assert.deepEqual(result.missingFields, [], reference);
  }
});

test('does not guess an explicitly unknown deposit member', () => {
  const { result } = resolve('Unknown Person', 1000);
  assert.equal(result.intent, 'DEPOSIT_CREATE');
  assert.equal(result.missingFields.includes('memberName'), true);
});
