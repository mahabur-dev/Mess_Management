# Mess AI accuracy patch

Replace/adapt these files inside the existing AI module. Keep existing CRUD/service-layer writes unchanged.

## Provider configuration

Command parsing and speech-to-text are independently configurable. Command
providers must implement an OpenAI-compatible Chat Completions endpoint;
speech providers must implement an OpenAI-compatible multipart audio
transcriptions endpoint.

Groq command parsing:

```env
AI_COMMAND_PROVIDER=groq
AI_COMMAND_BASE_URL=https://api.groq.com/openai/v1
AI_COMMAND_PATH=/chat/completions
AI_COMMAND_API_KEY=gsk_replace_me
AI_COMMAND_MODEL=openai/gpt-oss-20b
AI_COMMAND_RESPONSE_FORMAT=auto
AI_COMMAND_TIMEOUT_MS=20000
AI_PREVIEW_SLOW_LOG_MS=1000

AI_SPEECH_PROVIDER=groq
AI_SPEECH_BASE_URL=https://api.groq.com/openai/v1
AI_SPEECH_PATH=/audio/transcriptions
AI_SPEECH_API_KEY=gsk_replace_me
AI_SPEECH_MODEL=whisper-large-v3
AI_SPEECH_RESPONSE_FORMAT=json
AI_SPEECH_TIMEOUT_MS=30000
AI_SPEECH_SEND_LANGUAGE=true
AI_SPEECH_SEND_PROMPT=true
AI_SPEECH_PROMPT=
```

DeepSeek command parsing with Groq speech-to-text:

```env
AI_COMMAND_PROVIDER=deepseek
AI_COMMAND_BASE_URL=https://api.deepseek.com
AI_COMMAND_PATH=/chat/completions
AI_COMMAND_API_KEY=your_deepseek_api_key
AI_COMMAND_MODEL=deepseek-v4-pro
AI_COMMAND_RESPONSE_FORMAT=auto

AI_SPEECH_PROVIDER=groq
AI_SPEECH_BASE_URL=https://api.groq.com/openai/v1
AI_SPEECH_PATH=/audio/transcriptions
AI_SPEECH_API_KEY=your_groq_api_key
AI_SPEECH_MODEL=whisper-large-v3
AI_SPEECH_RESPONSE_FORMAT=json
```

`AI_COMMAND_RESPONSE_FORMAT=auto` uses `json_object` for DeepSeek and
`json_schema` for other providers. Set it explicitly to `json_schema`,
`json_object`, or `text` if a provider has different capabilities. `text`
omits `response_format` and relies on the JSON schema included in the prompt.

Speech response formats can be `json`, `text`, `verbose_json`, or `none`.
`none` omits the multipart `response_format` field and auto-detects JSON/plain
text responses. Leave `AI_SPEECH_TEMPERATURE` empty to omit that field. Set
`AI_SPEECH_SEND_LANGUAGE=false` or `AI_SPEECH_SEND_PROMPT=false` when a
compatible provider/model rejects those optional multipart fields. Endpoint
paths are configurable for providers that mount the compatible API under a
different path.

Clear deposit, utility, meal, and priced-expense commands use the local
deterministic parser before any command-provider request. Ambiguous language
falls back to the configured model. `AI_COMMAND_TIMEOUT_MS` and
`AI_SPEECH_TIMEOUT_MS` bound external waits; previews slower than
`AI_PREVIEW_SLOW_LOG_MS` emit per-stage timing logs without recording command
text or credentials.

Quick Add sends the language selected in the site header as the primary speech
hint because the transcription API documents that an ISO-639-1 language hint
improves both accuracy and latency. Each language receives a matching, natural
mess-command prompt to guide common item names, quantities, and prices. Keep
`speechLanguage=auto` for clients where the spoken language is unknown.
Set `AI_SPEECH_PROMPT` only when testing a custom vocabulary prompt.

Compare several speech models against the same recording:

```env
AI_SPEECH_BENCHMARK_MODELS=whisper-large-v3,whisper-large-v3-turbo
```

```bash
npm run benchmark:stt -- --audio ./samples/voice.webm --language auto \
  --expected-file ./samples/voice.txt
```

The benchmark prints each transcript, latency, word error rate (WER), and
character error rate (CER). It only calls the configured transcription API and
does not create or save an application command.

For backward compatibility, `GROQ_API_KEY`, `GROQ_COMMAND_MODEL`, and
`GROQ_SPEECH_MODEL` are used when their corresponding `AI_*` values are absent.

## Required integration changes

1. Voice DTO now accepts `speechLanguage?: 'auto' | 'en' | 'bn'`.
Send the best available spoken-language hint. Quick Add uses the language
selected in the site header; use `auto` only when no reliable hint exists.

```ts
const transcript = await speechProvider.transcribe(
  file,
  dto.speechLanguage ?? 'auto',
);
```

2. Keep `auto` available when UI locale and spoken language differ.

3. Send both original and normalized text to the LLM. The provider already does this.

4. Keep preview/confirmation before existing CRUD services save any data.

5. Run the normalizer tests and add your own real voice regressions from Bangla, English and Banglish users.
