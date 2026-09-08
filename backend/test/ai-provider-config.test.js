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
  normalizeTranscriptionText,
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

test('uses language-matched contextual transcription prompts', () => {
  const autoPrompt = buildTranscriptionPrompt('auto');
  const banglaPrompt = buildTranscriptionPrompt('bn');
  const englishPrompt = buildTranscriptionPrompt('en');
  assert.match(autoPrompt, /Banglish/);
  assert.match(autoPrompt, /আজকের বাজার/);
  assert.match(banglaPrompt, /বাংলাদেশি মেসের বাজার/);
  assert.match(banglaPrompt, /পেঁয়াজ ২ কেজি ১০০ টাকা/);
  assert.match(englishPrompt, /Today bazar/);
  assert.notEqual(banglaPrompt, englishPrompt);
  assert.equal(
    buildTranscriptionPrompt('auto', ' custom vocabulary '),
    'custom vocabulary',
  );
});

test('repairs safe Bangla command boundaries without changing unknown names', () => {
  assert.equal(
    normalizeTranscriptionText('আজকেবাজারখরচ৫০০টাকাআলু১০০টাকা'),
    'আজকে বাজার খরচ ৫০০ টাকা আলু ১০০ টাকা',
  );
  assert.equal(
    normalizeTranscriptionText('Tasnim আজকে 500tk জমা করো'),
    'Tasnim আজকে 500 tk জমা করো',
  );
  assert.equal(
    normalizeTranscriptionText('শাহরিয়ারকে ৫০০ টাকা দাও'),
    'শাহরিয়ারকে ৫০০ টাকা দাও',
  );
});

test('repairs observed Bangla grocery speech recognition errors conservatively', () => {
  assert.equal(
    normalizeTranscriptionText(
      'আলো দুই কেজি পন্ছাস টাকা, পিযাস দুই কেজি এক সুতাকা, এবং তেল এক কেজি দুই সুতাকা এট করো.',
    ),
    'আলু দুই কেজি পঞ্চাশ টাকা, পেঁয়াজ দুই কেজি একশ টাকা, এবং তেল এক কেজি দুইশ টাকা add.',
  );
  assert.equal(
    normalizeTranscriptionText('ঘরের আলো বন্ধ করো'),
    'ঘরের আলো বন্ধ করো',
  );
});

test('keeps every fallback transcription prompt below the Groq size limit', () => {
  for (const language of ['auto', 'en', 'bn']) {
    const prompt = buildTranscriptionPrompt(language);
    assert.ok(
      Buffer.byteLength(prompt, 'utf8') < 896,
      `${language} prompt exceeds the Groq 896-byte limit`,
    );
  }
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
