const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const trackerPath = fs.existsSync(
  path.join(
    __dirname,
    '../dist/src/app/module/ai-automation/ai-latency-tracker.js',
  ),
)
  ? '../dist/src/app/module/ai-automation/ai-latency-tracker'
  : '../dist/app/module/ai-automation/ai-latency-tracker';

const { AiLatencyTracker } = require(trackerPath);

test('records reusable AI preview stage timings', async () => {
  const tracker = new AiLatencyTracker();
  const value = await tracker.measure('parse', async () => 'parsed');
  const snapshot = tracker.snapshot();

  assert.equal(value, 'parsed');
  assert.equal(typeof snapshot.totalMs, 'number');
  assert.equal(typeof snapshot.stages.parse, 'number');
  assert.equal(snapshot.totalMs >= snapshot.stages.parse, true);
});
