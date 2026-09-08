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

const audio = {
  buffer: Buffer.from('test-audio'),
  mimetype: 'audio/webm',
  originalname: 'command.webm',
  size: 10,
};

test('voice transcription and access context are prepared concurrently', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let transcriptionStarted = false;
  let accessStarted = false;
  let createParams;

  const service = new AiAutomationService(
    { aiCommand: { findUnique: async () => null } },
    {},
    {},
    {},
    {},
    {
      transcribe: async (_file, language) => {
        assert.equal(language, 'auto');
        transcriptionStarted = true;
        await gate;
        return 'add bazar 500 taka';
      },
    },
  );
  service.assertRateLimit = async () => undefined;
  service.accessContext = async () => {
    accessStarted = true;
    await gate;
    return {
      actor: { id: 'user-1', name: 'Rahim' },
      members: [{ id: 'user-1', name: 'Rahim' }],
      canManage: true,
    };
  };
  service.createFromText = async (params) => {
    createParams = params;
    return { id: 'preview-1' };
  };

  const pending = service.createVoice(
    'user-1',
    'MANAGER',
    { messId: 'mess-1', locale: 'bn', idempotencyKey: 'voice-key' },
    audio,
  );
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(transcriptionStarted, true);
  assert.equal(accessStarted, true);
  release();
  assert.deepEqual(await pending, { id: 'preview-1' });
  assert.equal(createParams.text, 'add bazar 500 taka');
  assert.equal(createParams.idempotencyChecked, true);
  assert.equal(createParams.rateLimitChecked, true);
  assert.equal(createParams.preloadedAccessContext.canManage, true);
});

test('an idempotent voice retry skips transcription', async () => {
  let transcribeCalls = 0;
  const service = new AiAutomationService(
    { aiCommand: { findUnique: async () => ({ id: 'existing', user_id: 'user-1' }) } },
    {},
    {},
    {},
    {},
    { transcribe: async () => { transcribeCalls += 1; return 'unused'; } },
  );
  service.mapCommand = (command) => ({ id: command.id });

  const result = await service.createVoice(
    'user-1',
    'MANAGER',
    { messId: 'mess-1', idempotencyKey: 'existing-key' },
    audio,
  );

  assert.deepEqual(result, { id: 'existing' });
  assert.equal(transcribeCalls, 0);
});
