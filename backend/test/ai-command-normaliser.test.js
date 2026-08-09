const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizeCommandText,
  resolveMemberName,
} = require('../dist/app/module/ai-automation/normalisers/command-normaliser');

test('normalizes Bangla digits and mixed-language whitespace without translating the command', () => {
  assert.equal(
    normalizeCommandText('  আজকে   grocery  ৮৫০ টাকা  '),
    'আজকে grocery 850 টাকা',
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
