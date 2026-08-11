const fs = require('node:fs');
const path = require('node:path');

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function mimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const types = {
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.m4a': 'audio/x-m4a',
    '.mp3': 'audio/mpeg',
    '.mp4': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.webm': 'audio/webm',
  };
  return types[extension] || 'application/octet-stream';
}

function usage() {
  process.stdout.write(
    [
      'Usage:',
      '  npm run benchmark:stt -- --audio <file> [--models model-a,model-b] [--language auto|bn|en]',
      '                           [--expected "reference text" | --expected-file <utf8-file>]',
      '',
      'The command uses AI_SPEECH_* settings from backend/.env and never saves application data.',
    ].join('\n') + '\n',
  );
}

async function main() {
  if (process.argv.includes('--help')) {
    usage();
    return;
  }

  const audioArgument = option('--audio');
  if (!audioArgument) {
    usage();
    throw new Error('--audio is required');
  }

  const audioPath = path.resolve(audioArgument);
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  const language = option('--language') || 'auto';
  if (!['auto', 'bn', 'en'].includes(language)) {
    throw new Error('--language must be auto, bn, or en');
  }

  const config = require('../dist/app/config').default;
  const { OpenAiCompatibleProvider } = require(
    '../dist/app/module/ai-automation/providers/openai-compatible.provider'
  );
  const { calculateTranscriptionErrorRates } = require(
    '../dist/app/module/ai-automation/providers/transcription-quality'
  );

  const configuredModels =
    option('--models') ||
    process.env.AI_SPEECH_BENCHMARK_MODELS ||
    config.aiAutomation.speechModel;
  const models = [
    ...new Set(
      configuredModels
        .split(',')
        .map((model) => model.trim())
        .filter(Boolean),
    ),
  ];
  if (!models.length) throw new Error('No speech models were supplied');

  const expectedFile = option('--expected-file');
  const expected = expectedFile
    ? fs.readFileSync(path.resolve(expectedFile), 'utf8').trim()
    : option('--expected')?.trim();
  const buffer = fs.readFileSync(audioPath);
  const file = {
    buffer,
    size: buffer.length,
    mimetype: mimeType(audioPath),
    originalname: path.basename(audioPath),
  };
  const results = [];

  for (const model of models) {
    config.aiAutomation.speechModel = model;
    const provider = new OpenAiCompatibleProvider();
    const startedAt = Date.now();

    try {
      const transcript = await provider.transcribe(file, language);
      const durationMs = Date.now() - startedAt;
      results.push({
        model,
        transcript,
        durationMs,
        ...(expected
          ? calculateTranscriptionErrorRates(expected, transcript)
          : {}),
      });
    } catch (error) {
      results.push({
        model,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      });
    }
  }

  process.stdout.write(`${JSON.stringify({ audio: audioPath, language, expected, results }, null, 2)}\n`);
  if (results.every((result) => result.error)) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
