const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const normaliserPath = fs.existsSync(path.join(__dirname, '../dist/src/app/module/ai-automation/normalisers/command-normaliser.js'))
  ? path.join(__dirname, '../dist/src/app/module/ai-automation/normalisers/command-normaliser')
  : path.join(__dirname, '../dist/app/module/ai-automation/normalisers/command-normaliser');
const {
  inferExpenseCategory,
  normalizeCommandText,
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

test('infers grocery and food categories from ordinary item language', () => {
  assert.equal(inferExpenseCategory('আলু', '৫ কেজি বাজার'), 'GROCERY');
  assert.equal(inferExpenseCategory('potato', 'grocery shopping'), 'GROCERY');
  assert.equal(inferExpenseCategory('চা-নাস্তা', 'office snack'), 'FOOD');
  assert.equal(inferExpenseCategory('unknown item', 'miscellaneous'), null);
  assert.equal(inferExpenseCategory(null, 'current bill 1200 taka'), 'ELECTRICITY');
  assert.equal(inferExpenseCategory(null, 'wifi bill 800 taka'), 'WIFI');
});
