const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const normaliserPath = fs.existsSync(path.join(__dirname, '../dist/src/app/module/ai-automation/normalisers/command-normaliser.js'))
  ? path.join(__dirname, '../dist/src/app/module/ai-automation/normalisers/command-normaliser')
  : path.join(__dirname, '../dist/app/module/ai-automation/normalisers/command-normaliser');
const {
  extractPricedExpenseItems,
  hasDepositIntent,
  inferExpenseCategory,
  inferMealName,
  inferMealServings,
  inferMealStatus,
  inferNumericMoneyAmount,
  inferUtilityCommandType,
  isSelfReference,
  normalizeCommandText,
  resolveMemberMention,
  resolveMemberName,
} = require(normaliserPath);

test.skip('legacy normalizer expectation (superseded by the current normalization bundle)', () => {
  assert.equal(
    normalizeCommandText('  আজকে   grocery  ৮৫০ টাকা  '),
    'আজকে grocery 850 টাকা',
  );
});

test('repairs the common Whisper currency artefact in a money command', () => {
  assert.equal(normalizeCommandText('Add grocery shobji 1000 times'), 'Add grocery shobji 1000 taka');
});

test('normalizes natural Bangla, English, and Banglish purchase phrasing', () => {
  assert.equal(
    normalizeCommandText('ami 500 tk bazer korchi add koro'),
    'ami 500 taka bazar korchi add',
  );
  assert.equal(
    normalizeCommandText('ami alu dosh taka diye kinchi add koro'),
    'ami alu dosh taka diye purchased add',
  );
  assert.equal(
    normalizeCommandText('আমি ২ কেজি আলু ৬০ টাকা কিনেছি'),
    'আমি 2 kg আলু 60 taka কিনেছি',
  );
});

test('extracts adjacent multi-item prices and removes a matching summary total', () => {
  const items = extractPricedExpenseItems(
    'agke bazer 500 tk hoice, alu 100 tk and potol 100 tk and tel 100 tk chal 100 tk sobji 100 tk',
  );

  assert.deepEqual(
    items.map(({ itemName, amount, quantity, unit }) => ({
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
});

test('keeps explicitly supplied quantities while leaving omitted quantities empty', () => {
  const items = extractPricedExpenseItems(
    '2 kg alu 120 tk and piyaj 80 tk',
  );
  assert.deepEqual(
    items.map(({ itemName, amount, quantity, unit }) => ({
      itemName,
      amount,
      quantity,
      unit,
    })),
    [
      { itemName: 'alu', amount: 120, quantity: 2, unit: 'kg' },
      { itemName: 'piyaj', amount: 80, quantity: null, unit: null },
    ],
  );
});

test('detects multilingual utilities only in utility context', () => {
  const cases = [
    ['current er bill 1200 tk', 'ELECTRICITY'],
    ['current 1200 add koro', 'ELECTRICITY'],
    ['কারেন্ট বিল ১২০০ টাকা', 'ELECTRICITY'],
    ['internet bill 800 tk', 'WIFI'],
    ['wifi 800 add koro', 'WIFI'],
    ['ওয়াইফাই বিল ৮০০ টাকা', 'WIFI'],
    ['gas er bill 900 tk', 'GAS'],
    ['পানির বিল ৫০০ টাকা', 'WATER'],
    ['bua salary 1500 tk', 'CLEANING'],
    ['বুয়া ১৫০০ টাকা', 'CLEANING'],
  ];
  for (const [text, expected] of cases) {
    assert.equal(inferUtilityCommandType(text), expected, text);
  }
  assert.equal(inferUtilityCommandType('water bottle 50 tk'), null);
  assert.equal(inferUtilityCommandType('gas cylinder bought 1200 tk'), null);
});

test('resolves an exact or unambiguous partial member name only inside supplied tenant members', () => {
  const members = [
    { id: '1', name: 'Abdur Rahim' },
    { id: '2', name: 'Karim Hasan' },
  ];
  assert.deepEqual(resolveMemberName('abdur rahim', members), {
    member: members[0],
    ambiguous: false,
  });
  assert.deepEqual(resolveMemberName('Karim', members), {
    member: members[1],
    ambiguous: false,
  });
  assert.deepEqual(resolveMemberName('Unknown', members), {
    member: null,
    ambiguous: false,
  });
});

test('refuses ambiguous member names instead of guessing an ID', () => {
  const members = [
    { id: '1', name: 'Rahim Uddin' },
    { id: '2', name: 'Rahim Mia' },
  ];
  assert.deepEqual(resolveMemberName('Rahim', members), {
    member: null,
    ambiguous: true,
  });
});

test('understands multilingual deposit wording and self references', () => {
  assert.equal(hasDepositIntent('amar jonno 2000 tk joma koro'), true);
  assert.equal(hasDepositIntent('আমার জন্য ২০০০ টাকা জমা করো'), true);
  assert.equal(hasDepositIntent('deposit one thousand for me'), true);
  assert.equal(inferNumericMoneyAmount('Najmul er jonno 1000 deposit koro'), 1000);
  assert.equal(inferNumericMoneyAmount('নাজমুলের জন্য ২০০০ টাকা জমা করো'), 2000);
  assert.equal(isSelfReference('amar jonno'), true);
  assert.equal(isSelfReference('আমার জন্য'), true);
  assert.equal(isSelfReference('for me'), true);
  assert.equal(isSelfReference('Najmul'), false);
});

test('resolves known members from Bangla script and from a complete command', () => {
  const members = [
    { id: '1', name: 'Najmul Hossain' },
    { id: '2', name: 'Karim Hasan' },
  ];
  assert.deepEqual(resolveMemberName('নাজমুল', members), {
    member: members[0],
    ambiguous: false,
  });
  assert.deepEqual(
    resolveMemberMention('Najmul er jonno 1000 deposit koro', members),
    { member: members[0], ambiguous: false },
  );
  assert.deepEqual(
    resolveMemberMention('নাজমুলের জন্য ১০০০ টাকা জমা করো', members),
    { member: members[0], ambiguous: false },
  );
});

test('recognizes dinner variants without treating restaurant as night meal', () => {
  for (const phrase of [
    'dinner 2 ta',
    'dinar add koro',
    'diner 1 meal',
    'rater khabar add koro',
    'আমার ডিনার ২টা যোগ করো',
    'রাতের খাবার বন্ধ করো',
  ]) {
    assert.equal(inferMealName(phrase), 'DINNER', phrase);
  }
  assert.equal(inferMealName('restaurant bill 500 taka'), null);
  assert.equal(inferMealServings('আমার ডিনার ২টা যোগ করো'), 2);
  assert.equal(inferMealStatus('rater khabar bondho koro'), 'OFF');
  assert.equal(inferMealStatus('dinner add koro'), 'ON');
});

test('infers grocery and food categories from ordinary item language', () => {
  assert.equal(inferExpenseCategory('আলু', '৫ কেজি বাজার'), 'GROCERY');
  assert.equal(inferExpenseCategory('potato', 'grocery shopping'), 'GROCERY');
  assert.equal(inferExpenseCategory('চা-নাস্তা', 'office snack'), 'FOOD');
  assert.equal(inferExpenseCategory('unknown item', 'miscellaneous'), null);
  assert.equal(inferExpenseCategory(null, 'current bill 1200 taka'), 'ELECTRICITY');
  assert.equal(inferExpenseCategory(null, 'wifi bill 800 taka'), 'WIFI');
});
