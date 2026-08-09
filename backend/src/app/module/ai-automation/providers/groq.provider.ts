import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import config from 'src/app/config';
import {
  AI_INTENTS,
  AiCommandProvider,
  AiParseContext,
  ParsedAiCommand,
  SpeechToTextProvider,
} from '../ai-command.types';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const commandSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['intent', 'confidence', 'clarification', 'missingFields', 'data'],
  properties: {
    intent: { type: 'string', enum: AI_INTENTS },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    clarification: { type: ['string', 'null'] },
    missingFields: { type: 'array', items: { type: 'string' } },
    data: {
      type: 'object',
      additionalProperties: false,
      required: [
        'amount',
        'date',
        'category',
        'utilityType',
        'itemName',
        'description',
        'memberName',
        'mealName',
        'mealCount',
        'status',
      ],
      properties: {
        amount: { type: ['number', 'null'] },
        date: { type: ['string', 'null'] },
        category: {
          type: ['string', 'null'],
          enum: [
            'GROCERY', 'UTILITY', 'RENT', 'FOOD', 'GAS', 'ELECTRICITY',
            'WIFI', 'CLEANER', 'MAINTENANCE', 'BUABILL', 'WATER', 'OTHER', null,
          ],
        },
        utilityType: {
          type: ['string', 'null'],
          enum: ['ELECTRICITY', 'GAS', 'WATER', 'WIFI', 'CLEANING', 'OTHER', null],
        },
        itemName: { type: ['string', 'null'] },
        description: { type: ['string', 'null'] },
        memberName: { type: ['string', 'null'] },
        mealName: {
          type: ['string', 'null'],
          enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'OTHER', null],
        },
        mealCount: { type: ['number', 'null'], minimum: 0 },
        status: {
          type: ['string', 'null'],
          enum: ['ON', 'OFF', null],
        },
      },
    },
  },
} as const;

@Injectable()
export class GroqProvider implements SpeechToTextProvider, AiCommandProvider {
  private get apiKey() {
    const key = config.aiAutomation.groqApiKey?.trim();
    if (!key) {
      throw new ServiceUnavailableException({
        code: 'AI_PROVIDER_UNAVAILABLE',
        message: 'AI provider is not configured',
      });
    }
    return key;
  }

  private async request(url: string, init: RequestInit) {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch {
      throw new ServiceUnavailableException({
        code: 'AI_PROVIDER_UNAVAILABLE',
        message: 'AI service is temporarily unavailable',
      });
    }
    if (response.status === 429) {
      throw new HttpException(
        {
          code: 'AI_RATE_LIMITED',
          message: 'AI request limit reached. Please try again shortly.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (!response.ok) {
      throw new BadGatewayException({
        code: 'AI_PROVIDER_UNAVAILABLE',
        message: 'AI service could not process the request',
      });
    }
    return response;
  }

  async transcribe(
    file: Express.Multer.File,
    language: 'en' | 'bn',
  ): Promise<string> {
    const form = new FormData();
    form.append(
      'file',
      new Blob([Uint8Array.from(file.buffer)], { type: file.mimetype }),
      file.originalname || 'recording.webm',
    );
    form.append('model', config.aiAutomation.speechModel);
    form.append('response_format', 'json');
    form.append('temperature', '0');
    form.append('language', language);
    form.append(
      'prompt',
      language === 'bn'
        ? 'এটি বাংলা ভাষায় মেস ম্যানেজমেন্টের খরচ, ইউটিলিটি, ডিপোজিট ও মিল সংক্রান্ত বক্তব্য।'
        : 'This is an English mess-management command about expenses, utilities, deposits, or meals.',
    );

    const response = await this.request(`${GROQ_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });
    const body = (await response.json()) as { text?: unknown };
    const transcript = typeof body.text === 'string' ? body.text.trim() : '';
    if (!transcript) {
      throw new BadGatewayException({
        code: 'AI_TRANSCRIPTION_FAILED',
        message: 'No speech could be recognized from this recording',
      });
    }
    return transcript;
  }

  async parse(text: string, context: AiParseContext): Promise<ParsedAiCommand> {
    const system = [
      'You extract exactly one create command for a mess-management application.',
      'The user may write Bangla, English, Banglish, or a mixture.',
      'Never invent an amount, member, meal type, or date.',
      'Resolve relative dates using the supplied today and timezone. Return YYYY-MM-DD.',
      'Internet means WIFI. Cleaning/cleaner means category CLEANER and utilityType CLEANING.',
      'Only BREAKFAST, LUNCH, and DINNER are supported. OTHER requires clarification.',
      'Return memberName exactly as one supplied member when there is a clear match; never output IDs.',
      'Set NEEDS_CLARIFICATION and list missingFields when a required value is absent or ambiguous.',
      'Deposit creation requires manager access, amount, and a member. Expense requires amount and category.',
      'Meal requires mealName and date; member defaults to the actor when omitted.',
    ].join(' ');
    const user = JSON.stringify({ input: text, context });
    const response = await this.request(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.aiAutomation.commandModel,
        temperature: 0,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'mess_command', strict: true, schema: commandSchema },
        },
      }),
    });
    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new BadGatewayException({
        code: 'AI_PARSE_FAILED',
        message: 'AI response could not be understood',
      });
    }
    try {
      return JSON.parse(content) as ParsedAiCommand;
    } catch {
      throw new BadGatewayException({
        code: 'AI_SCHEMA_INVALID',
        message: 'AI returned an invalid command',
      });
    }
  }
}
