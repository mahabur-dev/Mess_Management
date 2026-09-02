const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const tscBuildRoot = path.join(__dirname, '../dist/src');
const servicePath = fs.existsSync(
  path.join(tscBuildRoot, 'app/module/ai-automation/ai-automation.service.js'),
)
  ? '../dist/src/app/module/ai-automation/ai-automation.service'
  : '../dist/app/module/ai-automation/ai-automation.service';

const { AiAutomationService } = require(servicePath);

function createService(used) {
  return new AiAutomationService(
    {
      user: {
        findUnique: async () => ({ ai_free_commands_used: used }),
      },
    },
    {},
    {},
    {},
    {},
    {},
  );
}

test('capabilities exposes persistent free command usage', async () => {
  const capabilities = await createService(4).capabilities('user-1', 'en');

  assert.deepEqual(capabilities.quota, {
    limit: 10,
    used: 4,
    remaining: 6,
    exhausted: false,
  });
});

test('free command quota blocks users after ten commands', async () => {
  const service = createService(10);

  await assert.rejects(service.assertFreeQuota('user-1'), (error) => {
    assert.equal(error.getStatus(), 429);
    assert.equal(error.getResponse().code, 'AI_FREE_LIMIT_REACHED');
    return true;
  });
});
