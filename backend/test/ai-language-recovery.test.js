const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const tscBuildRoot = path.join(__dirname, '../dist/src');
const moduleAliasRoot = path.join(__dirname, '../dist');
const usesTscBuild = fs.existsSync(
  path.join(
    tscBuildRoot,
    'app/module/ai-automation/providers/openai-compatible.provider.js',
  ),
);
if (usesTscBuild) {
  process.env.NODE_PATH = [moduleAliasRoot, process.env.NODE_PATH]
    .filter(Boolean)
    .join(path.delimiter);
  require('node:module').Module._initPaths();
}
const providerPath = usesTscBuild
  ? '../dist/src/app/module/ai-automation/providers/openai-compatible.provider'
  : '../dist/app/module/ai-automation/providers/openai-compatible.provider';
const servicePath = usesTscBuild
  ? '../dist/src/app/module/ai-automation/ai-automation.service'
  : '../dist/app/module/ai-automation/ai-automation.service';
const expenseDtoPath = usesTscBuild
  ? '../dist/src/app/module/expense/dto/expense.dto'
  : '../dist/app/module/expense/dto/expense.dto';
const configPath = usesTscBuild
  ? '../dist/src/app/config'
  : '../dist/app/config';
const {
  OpenAiCompatibleProvider,
} = require(providerPath);
const { AiAutomationService } = require(servicePath);
const { CreateExpenseDto } = require(expenseDtoPath);
const config = require(configPath).default;

function emptyCommand(intent = 'UNKNOWN') {
  return {
    intent,
    confidence: 0.4,
    clarification: 'Please clarify',
    missingFields: ['amount', 'memberName', 'mealName'],
    data: {
      amount: null,
      date: null,
      startDate: null,
      endDate: null,
      category: null,
      utilityType: null,
      itemName: null,
      description: null,
      memberName: null,
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

const context = {
  today: '2026-08-12',
  timeZone: 'Asia/Dhaka',
  locale: 'bn',
  actorName: 'Mahabur Rahman',
  canManage: true,
  memberNames: ['Mahabur Rahman', 'Najmul Hossain'],
};

function finalize(text, command = emptyCommand()) {
  const provider = new OpenAiCompatibleProvider();
  return provider.finalizeCommand(command, text, text, context);
}

test('uses the deterministic fast path for clear commands without an HTTP call', async () => {
  const provider = new OpenAiCompatibleProvider();
  const originalFetch = global.fetch;
  let fetchCalls = 0;
  global.fetch = async () => {
    fetchCalls += 1;
    throw new Error('The local fast path must not call the remote provider');
  };

  try {
    const cases = [
      ['amar jonno 2000 tk joma koro', 'DEPOSIT_CREATE'],
      ['current er bill 1200 tk add koro', 'UTILITY_CREATE'],
      ['amar dinar 2 ta add koro', 'MEAL_CREATE'],
      ['alu 100 tk and potol 100 tk', 'EXPENSE_CREATE'],
    ];
    for (const [text, intent] of cases) {
      const result = await provider.parse(text, context);
      assert.equal(result.intent, intent, text);
    }

    const yesterday = await provider.parse(
      'gotokal alu 100 tk kinechi',
      context,
    );
    assert.equal(yesterday.data.date, '2026-08-11');
    assert.equal(fetchCalls, 0);
  } finally {
    global.fetch = originalFetch;
  }
});

test('keeps commands with an explicit unknown member on the safe remote path', () => {
  const provider = new OpenAiCompatibleProvider();
  assert.equal(
    provider.tryParseLocally(
      'Unknown Person 1000 deposit koro',
      'Unknown Person 1000 deposit add',
      context,
    ),
    null,
  );
  assert.equal(
    provider.tryParseLocally(
      'Unknown Person dinner 2 ta add koro',
      'Unknown Person dinner 2 ta add',
      context,
    ),
    null,
  );
  assert.equal(
    provider.tryParseLocally(
      'breakfast 1 lunch 1 dinner 1 add koro',
      'breakfast 1 lunch 1 dinner 1 add',
      context,
    ),
    null,
  );
});

test('bounds ambiguous remote-provider waits with a configurable timeout', async () => {
  const provider = new OpenAiCompatibleProvider();
  const originalFetch = global.fetch;
  const originalTimeout = config.aiAutomation.commandTimeoutMs;
  config.aiAutomation.commandTimeoutMs = 20;
  global.fetch = async (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener(
        'abort',
        () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
        { once: true },
      );
    });

  try {
    await assert.rejects(
      () =>
        provider.request(
          'https://provider.invalid/chat',
          { method: 'POST' },
          'test-provider',
        ),
      (error) =>
        error?.status === 504 &&
        error?.response?.code === 'AI_PROVIDER_TIMEOUT',
    );
  } finally {
    global.fetch = originalFetch;
    config.aiAutomation.commandTimeoutMs = originalTimeout;
  }
});

function resolveFinalized(command) {
  const service = new AiAutomationService({}, {}, {}, {}, {}, {});
  const actor = { id: 'actor-1', name: context.actorName };
  const najmul = { id: 'member-2', name: 'Najmul Hossain' };
  return service.resolveParsed(
    command,
    'mess-1',
    actor,
    [actor, najmul],
    true,
  );
}

async function validateExpensePayload(payload) {
  const service = new AiAutomationService({}, {}, {}, {}, {}, {});
  return service.validateDto(CreateExpenseDto, payload);
}

test('recovers a summarized multi-item bazar command without double counting', async () => {
  const text =
    'agke bazer 500 tk hoice, alu 100 tk and potol 100 tk and tel 100 tk chal 100 tk sobji 100 tk';
  const result = finalize(text);

  assert.equal(result.intent, 'EXPENSE_CREATE');
  assert.equal(result.data.amount, 500);
  assert.deepEqual(result.missingFields, []);
  assert.deepEqual(
    result.data.items.map(({ itemName, amount, quantity, unit }) => ({
      itemName,
      amount,
      quantity,
      unit,
    })),
    [
      { itemName: 'alu', amount: 100, quantity: null, unit: null },
      { itemName: 'potol', amount: 100, quantity: null, unit: null },
      { itemName: 'tel', amount: 100, quantity: null, unit: null },
      { itemName: 'chal', amount: 100, quantity: null, unit: null },
      { itemName: 'sobji', amount: 100, quantity: null, unit: null },
    ],
  );

  const resolved = resolveFinalized(result);
  assert.equal(resolved.intent, 'EXPENSE_CREATE');
  assert.deepEqual(resolved.missingFields, []);
  assert.equal(resolved.payload.category, 'GROCERY');
  assert.equal(resolved.payload.items.length, 5);
  assert.equal(
    resolved.payload.items.reduce((sum, item) => sum + item.amount, 0),
    500,
  );
  assert.equal(
    resolved.payload.items.every(
      (item) => item.quantity === null && item.unit === null,
    ),
    true,
  );
  const dto = await validateExpensePayload(resolved.payload);
  assert.equal(dto.items.length, 5);
  assert.equal(dto.items.every((item) => item.quantity == null), true);
});

test('does not block an expense when only optional quantity and unit are missing', () => {
  const command = emptyCommand('EXPENSE_CREATE');
  command.data.items = [
    {
      amount: 100,
      date: null,
      category: 'GROCERY',
      utilityType: null,
      itemName: 'alu',
      description: null,
      memberName: null,
      quantity: null,
      unit: null,
    },
    {
      amount: 100,
      date: null,
      category: 'GROCERY',
      utilityType: null,
      itemName: 'potol',
      description: null,
      memberName: null,
      quantity: null,
      unit: null,
    },
  ];
  command.missingFields = ['items.quantity', 'items.unit', 'quantity', 'unit'];

  const result = finalize('alu 100 tk and potol 100 tk', command);
  assert.equal(result.intent, 'EXPENSE_CREATE');
  assert.equal(result.data.amount, 200);
  assert.deepEqual(result.missingFields, []);
});

test('recovers multilingual utility commands and preserves utility accounting type', async () => {
  const cases = [
    ['current er bill 1200 tk add koro', 'ELECTRICITY', 'ELECTRICITY', 1200],
    ['current 1200 add koro', 'ELECTRICITY', 'ELECTRICITY', 1200],
    ['ইন্টারনেট বিল ৮০০ টাকা যোগ করো', 'WIFI', 'WIFI', 800],
    ['gas er bill 900 tk add koro', 'GAS', 'GAS', 900],
    ['পানির বিল ৫০০ টাকা যোগ করো', 'WATER', 'WATER', 500],
    ['bua salary 1500 tk add koro', 'CLEANING', 'CLEANER', 1500],
  ];

  for (const [text, utilityType, category, amount] of cases) {
    const result = finalize(text);
    assert.equal(result.intent, 'UTILITY_CREATE', text);
    assert.equal(result.data.utilityType, utilityType, text);
    assert.equal(result.data.category, category, text);
    assert.equal(result.data.amount, amount, text);
    assert.deepEqual(result.missingFields, [], text);

    const resolved = resolveFinalized(result);
    assert.equal(resolved.intent, 'UTILITY_CREATE', text);
    assert.deepEqual(resolved.missingFields, [], text);
    assert.equal(resolved.payload.type, 'UTILITY', text);
    assert.equal(resolved.payload.utilityType, utilityType, text);
    assert.equal(resolved.payload.category, category, text);
    const dto = await validateExpensePayload(resolved.payload);
    assert.equal(dto.type, 'UTILITY', text);
    assert.equal(dto.utilityType, utilityType, text);
  }
});

test('does not convert ordinary water or gas purchases into utilities', () => {
  for (const text of ['water bottle 50 tk', 'gas cylinder bought 1200 tk']) {
    const result = finalize(text);
    assert.notEqual(result.intent, 'UTILITY_CREATE', text);

    const misclassified = emptyCommand('UTILITY_CREATE');
    misclassified.data.amount = text.includes('50') ? 50 : 1200;
    misclassified.data.itemName = text.includes('water')
      ? 'water bottle'
      : 'gas cylinder';
    misclassified.missingFields = ['utilityType'];
    const repaired = finalize(text, misclassified);
    assert.equal(repaired.intent, 'EXPENSE_CREATE', text);
    assert.equal(repaired.data.utilityType, null, text);
  }
});

test('recovers actor deposits from Bangla and Banglish commands', () => {
  for (const text of [
    'amar jonno 2000 tk joma koro',
    'আমার জন্য ২০০০ টাকা জমা করো',
    'deposit 2000 for me',
  ]) {
    const result = finalize(text);
    assert.equal(result.intent, 'DEPOSIT_CREATE', text);
    assert.equal(result.data.amount, 2000, text);
    assert.equal(result.data.memberName, context.actorName, text);
    assert.deepEqual(result.missingFields, [], text);
  }

  const direct = emptyCommand('DEPOSIT_CREATE');
  direct.data.amount = 2000;
  direct.missingFields = ['memberName', 'date'];
  const finalized = finalize('deposit 2000', direct);
  assert.equal(finalized.data.memberName, context.actorName);
  assert.deepEqual(finalized.missingFields, []);
});

test('recovers a named member deposit without inventing an id', () => {
  for (const text of [
    'Najmul er jonno 1000 deposit koro',
    'নাজমুলের জন্য ১০০০ টাকা জমা করো',
  ]) {
    const result = finalize(text);
    assert.equal(result.intent, 'DEPOSIT_CREATE', text);
    assert.equal(result.data.amount, 1000, text);
    assert.equal(result.data.memberName, 'Najmul Hossain', text);
    assert.deepEqual(result.missingFields, [], text);
  }
});

test('canonicalizes a Bangla member name returned by the model', () => {
  const command = emptyCommand('DEPOSIT_CREATE');
  command.data.amount = 1000;
  command.data.memberName = 'নাজমুল';
  command.missingFields = [];
  const result = finalize('নাজমুলের জন্য ১০০০ টাকা জমা করো', command);
  assert.equal(result.data.memberName, 'Najmul Hossain');
  assert.deepEqual(result.missingFields, []);
});

test('recovers conversational dinner commands and their status', () => {
  const add = finalize('amar dinar 2 ta add koro');
  assert.equal(add.intent, 'MEAL_CREATE');
  assert.equal(add.data.memberName, context.actorName);
  assert.equal(add.data.mealName, 'DINNER');
  assert.equal(add.data.mealCount, 2);
  assert.equal(add.data.status, 'ON');

  const off = finalize('আমার রাতের খাবার বন্ধ করো');
  assert.equal(off.intent, 'MEAL_CREATE');
  assert.equal(off.data.mealName, 'DINNER');
  assert.equal(off.data.mealCount, 0);
  assert.equal(off.data.status, 'OFF');

  const misclassified = emptyCommand('EXPENSE_CREATE');
  misclassified.data.category = 'FOOD';
  misclassified.missingFields = ['amount'];
  const repaired = finalize('amar dinar 2 ta add koro', misclassified);
  assert.equal(repaired.intent, 'MEAL_CREATE');
  assert.equal(repaired.data.mealName, 'DINNER');
  assert.equal(repaired.data.mealCount, 2);
});

test('does not reinterpret a priced restaurant dinner as meal attendance', () => {
  const expense = emptyCommand('EXPENSE_CREATE');
  expense.data.amount = 500;
  expense.data.category = 'FOOD';
  expense.data.itemName = 'restaurant dinner';
  expense.missingFields = [];
  const result = finalize('restaurant dinner bill 500 taka', expense);
  assert.equal(result.intent, 'EXPENSE_CREATE');
  assert.equal(result.data.amount, 500);
});
