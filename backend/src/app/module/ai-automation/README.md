# Mess AI accuracy patch

Replace/adapt these files inside the existing AI module. Keep existing CRUD/service-layer writes unchanged.

## Required integration changes

1. Prefer this config during accuracy testing:

```env
GROQ_SPEECH_MODEL=whisper-large-v3
GROQ_COMMAND_MODEL=openai/gpt-oss-20b
```

Map those environment variables to the existing `config.aiAutomation.speechModel` and `commandModel` fields.

2. Voice DTO now accepts `speechLanguage?: 'auto' | 'en' | 'bn'`.
Default to `auto` unless the user explicitly selected their spoken language.

```ts
const transcript = await speechProvider.transcribe(
  file,
  dto.speechLanguage ?? 'auto',
);
```

3. Do not use the UI language as the speech language. UI locale and spoken language can differ.

4. Send both original and normalized text to the LLM. The provider already does this.

5. Keep preview/confirmation before existing CRUD services save any data.

6. Run the normalizer tests and add your own real voice regressions from Bangla, English and Banglish users.
