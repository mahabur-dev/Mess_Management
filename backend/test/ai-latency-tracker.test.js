const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AiLatencyTracker,
} = require('../dist/src/app/module/ai-automation/ai-latency-tracker');

test('records reusable AI preview stage timings', async () => {
  const tracker = new AiLatencyTracker();
  const value = await tracker.measure('parse', async () => 'parsed');
  const snapshot = tracker.snapshot();

  assert.equal(value, 'parsed');
  assert.equal(typeof snapshot.totalMs, 'number');
  assert.equal(typeof snapshot.stages.parse, 'number');
  assert.equal(snapshot.totalMs >= snapshot.stages.parse, true);
});
