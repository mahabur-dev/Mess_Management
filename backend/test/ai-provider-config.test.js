const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const helperPath = fs.existsSync(
  path.join(
    __dirname,
    '../dist/src/app/module/ai-automation/providers/openai-compatible.helpers.js',
  ),
)
  ? path.join(
      __dirname,
      '../dist/src/app/module/ai-automation/providers/openai-compatible.helpers',
    )
  : path.join(
      __dirname,
      '../dist/app/module/ai-automation/providers/openai-compatible.helpers',
    );

const {
  buildApiUrl,
  buildResponseFormat,
  buildTranscriptionPrompt,
  extractTranscript,
  normalizeApiBaseUrl,
  resolveCommandResponseFormat,
  resolveSpeechResponseFormat,
} = require(helperPath);
const qualityPath = fs.existsSync(
  path.join(
    __dirname,
    '../dist/src/app/module/ai-automation/providers/transcription-quality.js',
  ),
)
  ? path.join(
      __dirname,
      '../dist/src/app/module/ai-automation/providers/transcription-quality',
    )
  : path.join(
      __dirname,
      '../dist/app/module/ai-automation/providers/transcription-quality',
    );
const { calculateTranscriptionErrorRates } = require(qualityPath);

test('normalizes an OpenAI-compatible base URL', () => {
  assert.equal(
    normalizeApiBaseUrl(' https://api.deepseek.com/// '),
    'https://api.deepseek.com',
  );
  assert.equal(
    buildApiUrl(
      'https://api.groq.com/openai/v1/',
      '/audio/transcriptions',
    ),
    'https://api.groq.com/openai/v1/audio/transcriptions',
  );
});

test('auto-selects the response format supported by DeepSeek', () => {
  assert.equal(
    resolveCommandResponseFormat('auto', 'https://api.deepseek.com'),
    'json_object',
  );
  assert.equal(
    resolveCommandResponseFormat('auto', 'https://api.groq.com/openai/v1'),
    'json_schema',
  );
});

test('supports explicit structured and plain JSON modes', () => {
  assert.deepEqual(buildResponseFormat('json_object', {}), {
    type: 'json_object',
  });
  assert.equal(buildResponseFormat('text', {}), undefined);
  assert.equal(
    buildResponseFormat('json_schema', { type: 'object' }).json_schema.strict,
    true,
  );
});

test('rejects an unsupported response format', () => {
  assert.throws(
    () =>
      resolveCommandResponseFormat('yaml', 'https://api.groq.com/openai/v1'),
    /Unsupported AI_COMMAND_RESPONSE_FORMAT/,
  );
});

test('supports JSON and text transcription responses', () => {
  assert.equal(resolveSpeechResponseFormat('json'), 'json');
  assert.equal(resolveSpeechResponseFormat('verbose_json'), 'verbose_json');
  assert.equal(extractTranscript('{"text":" hello "}', 'json'), 'hello');
  assert.equal(extractTranscript(' hello ', 'text'), 'hello');
  assert.equal(extractTranscript('{"text":" hello "}', 'none'), 'hello');
  assert.equal(extractTranscript(' hello ', 'none'), 'hello');
});

test('uses a mixed-language transcription prompt in auto mode', () => {
  const prompt = buildTranscriptionPrompt('auto');
  assert.match(prompt, /Banglish/);
  assert.match(prompt, /বাংলা/);
  assert.match(prompt, /spoken numbers/);
  assert.equal(
    buildTranscriptionPrompt('auto', ' custom vocabulary '),
    'custom vocabulary',
  );
});

test('rejects unsupported speech response formats', () => {
  assert.throws(
    () => resolveSpeechResponseFormat('srt'),
    /Unsupported AI_SPEECH_RESPONSE_FORMAT/,
  );
});

test('calculates multilingual transcription word and character error rates', () => {
  assert.deepEqual(
    calculateTranscriptionErrorRates('আমি ৫০০ টাকা বাজার করেছি', 'আমি ৫০০ টাকা বাজার করেছি'),
    { wordErrorRate: 0, characterErrorRate: 0 },
  );
  const rates = calculateTranscriptionErrorRates(
    'ami 500 taka bazar korechi',
    'ami 500 taka bajar korechi',
  );
  assert.equal(rates.wordErrorRate, 0.2);
  assert.ok(rates.characterErrorRate > 0);
});
