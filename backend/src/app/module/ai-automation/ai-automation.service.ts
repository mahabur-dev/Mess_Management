import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { randomUUID } from 'crypto';
import {
  AiCommandIntent,
  AiCommandSourceType,
  AiCommandStatus,
  AttendanceStatus,
  ExpenseCategory,
  ExpensePaymentType,
  ExpenseRecordType,
  ExpenseSplitMethod,
  ExpenseUsedBy,
  MealName,
  Prisma,
  UtilityType,
} from '@prisma/client';
import config from 'src/app/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDepositDto } from '../deposit/dto/deposit.dto';
import { DepositService, PreparedDeposit } from '../deposit/deposit.service';
import { CreateExpenseDto } from '../expense/dto/expense.dto';
import { ExpenseService, PreparedExpense } from '../expense/expense.service';
import { CreateMealDto } from '../meal/dto/meal.dto';
import { MealService, PreparedMeal } from '../meal/meal.service';
import {
  inferExpenseCategory,
  normalizeCommandText,
  resolveMemberName,
} from './normalisers/command-normaliser';
import {
  AI_COMMAND_PROVIDER,
  AiCommandProvider,
  ParsedAiCommand,
  ParsedCommandData,
  ParsedExpenseItem,
  SPEECH_TO_TEXT_PROVIDER,
  SpeechToTextProvider,
  type SpeechLanguage,
} from './ai-command.types';

type AuthRole = string;
type Locale = 'en' | 'bn';
type MemberOption = { id: string; name: string };

type PreparedDomainCommand =
  | { intent: 'EXPENSE_CREATE'; dto: CreateExpenseDto; prepared: PreparedExpense }
  | { intent: 'UTILITY_CREATE'; dto: CreateExpenseDto; prepared: PreparedExpense }
  | { intent: 'DEPOSIT_CREATE'; dto: CreateDepositDto; prepared: PreparedDeposit }
  | { intent: 'MEAL_CREATE'; dto: CreateMealDto; prepared: PreparedMeal };

const AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/x-m4a',
  'audio/3gpp',
]);

@Injectable()
export class AiAutomationService {
  private readonly recentAttempts = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly expenseService: ExpenseService,
    private readonly depositService: DepositService,
    private readonly mealService: MealService,
    @Inject(AI_COMMAND_PROVIDER)
    private readonly commandProvider: AiCommandProvider,
    @Inject(SPEECH_TO_TEXT_PROVIDER)
    private readonly speechProvider: SpeechToTextProvider,
  ) {}

  private assertEnabled() {
    if (!config.aiAutomation.enabled) {
      throw new ServiceUnavailableException({
        code: 'AI_DISABLED',
        message: 'AI automation is currently disabled',
      });
    }
  }

  private todayDhaka() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private async accessContext(messId: string, userId: string, role: AuthRole) {
    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: {
        id: true,
        name: true,
        created_by: true,
        creator: { select: { id: true, name: true, is_active: true } },
        memberships: {
          where: { is_active: true },
          select: {
            user_id: true,
            role: true,
            user: { select: { id: true, name: true, is_active: true } },
          },
        },
      },
    });
    if (!mess) throw new NotFoundException('Mess not found');
    const membership = mess.memberships.find((item) => item.user_id === userId);
    const isAdmin = role === 'ADMIN';
    const isCreator = mess.created_by === userId;
    if (!isAdmin && !isCreator && !membership) {
      throw new ForbiddenException('You are not an active member of this mess');
    }
    const members = new Map<string, MemberOption>();
    if (mess.creator.is_active) members.set(mess.creator.id, mess.creator);
    for (const item of mess.memberships) {
      if (item.user.is_active) members.set(item.user.id, item.user);
    }
    const actor = members.get(userId) ?? { id: userId, name: 'User' };
    return {
      mess,
      actor,
      members: [...members.values()],
      canManage: isAdmin || isCreator || membership?.role === 'MANAGER',
    };
  }

  private resolveMember(name: string | null, members: MemberOption[]) {
    return resolveMemberName(name, members);
  }

  private validateProviderResult(value: ParsedAiCommand) {
    if (!value || typeof value !== 'object') throw new BadRequestException('AI returned an invalid command');
    if (!Object.values(AiCommandIntent).includes(value.intent as AiCommandIntent)) {
      throw new BadRequestException('AI returned an unsupported command');
    }
    if (!value.data || typeof value.data !== 'object' || !Array.isArray(value.missingFields)) {
      throw new BadRequestException('AI returned an invalid command payload');
    }
    if (
      !Number.isFinite(value.confidence) ||
      value.confidence < 0 ||
      value.confidence > 1 ||
      !value.missingFields.every((field) => typeof field === 'string') ||
      (value.clarification !== null && typeof value.clarification !== 'string')
    ) {
      throw new BadRequestException('AI returned invalid command metadata');
    }
    const nullableStrings: Array<keyof ParsedCommandData> = [
      'date',
      'category',
      'utilityType',
      'itemName',
      'description',
      'memberName',
      'mealName',
      'status',
      'unit',
    ];
    if (
      nullableStrings.some(
        (key) => value.data[key] !== null && typeof value.data[key] !== 'string',
      ) ||
      (value.data.amount !== null && !Number.isFinite(value.data.amount)) ||
      (value.data.mealCount !== null && !Number.isFinite(value.data.mealCount))
    ) {
      throw new BadRequestException('AI returned invalid command fields');
    }
    if (!Array.isArray(value.data.items)) {
      throw new BadRequestException('AI returned invalid expense items');
    }
    for (const item of value.data.items) {
      if (!item || typeof item !== 'object') throw new BadRequestException('AI returned invalid expense item');
      const candidate = item as ParsedExpenseItem;
      if (
        (candidate.amount !== null && !Number.isFinite(candidate.amount)) ||
        (candidate.quantity !== null && !Number.isFinite(candidate.quantity)) ||
        [candidate.date, candidate.category, candidate.utilityType, candidate.itemName,
          candidate.description, candidate.memberName, candidate.unit].some(
          (field) => field !== null && typeof field !== 'string',
        )
      ) {
        throw new BadRequestException('AI returned invalid expense item fields');
      }
    }
    return value;
  }

  private async assertRateLimit(userId: string) {
    const now = Date.now();
    const attempts = (this.recentAttempts.get(userId) ?? []).filter(
      (timestamp) => now - timestamp < 60_000,
    );
    if (attempts.length >= config.aiAutomation.maxRequestsPerMinute) {
      throw new HttpException(
        { code: 'AI_RATE_LIMITED', message: 'Too many AI requests. Please try again shortly.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    attempts.push(now);
    this.recentAttempts.set(userId, attempts);

    const dayStart = new Date(now - 24 * 60 * 60 * 1000);
    const dailyCommands = await this.prisma.aiCommand.count({
      where: { user_id: userId, created_at: { gte: dayStart } },
    });
    if (dailyCommands >= config.aiAutomation.maxCommandsPerDay) {
      throw new HttpException(
        { code: 'AI_RATE_LIMITED', message: 'Daily AI command limit reached.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private utilityMapping(data: ParsedCommandData) {
    const utilityType = (data.utilityType ?? data.category ?? 'OTHER') as UtilityType;
    const categoryByUtility: Record<UtilityType, ExpenseCategory> = {
      ELECTRICITY: ExpenseCategory.ELECTRICITY,
      GAS: ExpenseCategory.GAS,
      WATER: ExpenseCategory.WATER,
      WIFI: ExpenseCategory.WIFI,
      CLEANING: ExpenseCategory.CLEANER,
      OTHER: ExpenseCategory.OTHER,
    };
    return {
      utilityType: Object.values(UtilityType).includes(utilityType) ? utilityType : UtilityType.OTHER,
      category: categoryByUtility[utilityType] ?? ExpenseCategory.OTHER,
    };
  }

  private resolveParsed(
    parsed: ParsedAiCommand,
    messId: string,
    actor: MemberOption,
    members: MemberOption[],
    canManage: boolean,
  ) {
    const requiredFieldsByIntent: Record<string, Set<string>> = {
      EXPENSE_CREATE: new Set(['amount', 'category']),
      UTILITY_CREATE: new Set(['amount']),
      DEPOSIT_CREATE: new Set(['amount', 'memberName']),
      MEAL_CREATE: new Set(['mealName']),
    };
    const allowedMissing = requiredFieldsByIntent[parsed.intent] ?? new Set<string>();
    // Models sometimes list every nullable JSON property as "missing". Only
    // business-required fields may block a command; date defaults to today and
    // itemName/quantity/unit/description are optional expense metadata.
    const missing = new Set((parsed.missingFields ?? []).filter((field) => allowedMissing.has(field)));
    const memberMatch = this.resolveMember(parsed.data.memberName, members);
    if (memberMatch.ambiguous) missing.add('memberName');
    const date = parsed.data.date ?? this.todayDhaka();
    let payload: Record<string, unknown> | null = null;
    let intent = parsed.intent;

    if (intent === 'EXPENSE_CREATE' || intent === 'UTILITY_CREATE') {
      const sourceItems = parsed.data.items.length
        ? parsed.data.items
        : [{
            amount: parsed.data.amount,
            date: parsed.data.date,
            category: parsed.data.category,
            utilityType: parsed.data.utilityType,
            itemName: parsed.data.itemName,
            description: parsed.data.description,
            memberName: parsed.data.memberName,
            quantity: parsed.data.quantity,
            unit: parsed.data.unit,
          }];
      const resolvedItems = sourceItems.map((item) => {
        const itemMember = this.resolveMember(item.memberName ?? parsed.data.memberName, members);
        if (itemMember.ambiguous) missing.add('memberName');
        if (!item.amount || item.amount <= 0) missing.add('amount');
        const inferredCategory = inferExpenseCategory(item.itemName, item.description) as ExpenseCategory | null;
        const aiCategory = item.category as ExpenseCategory | null;
        const category = intent === 'UTILITY_CREATE'
          ? this.utilityMapping({ ...parsed.data, ...item }).category
          : (aiCategory && aiCategory !== ExpenseCategory.OTHER ? aiCategory : inferredCategory ?? aiCategory);
        if (!category) missing.add('category');
        const utility = this.utilityMapping({ ...parsed.data, ...item });
        return {
          messId,
          type: intent === 'UTILITY_CREATE' ? ExpenseRecordType.UTILITY : ExpenseRecordType.EXPENSE,
          category,
          utilityType: intent === 'UTILITY_CREATE' ? utility.utilityType : null,
          amount: item.amount,
          expenseDate: item.date ?? date,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          description: item.description,
          purchasedBy: itemMember.member?.id ?? memberMatch.member?.id ?? actor.id,
          paidFrom: ExpensePaymentType.FROM_DEPOSIT,
          usedBy: ExpenseUsedBy.ALL_MEMBERS,
          splitMethod:
            category === ExpenseCategory.GROCERY || category === ExpenseCategory.FOOD
              ? ExpenseSplitMethod.MEAL_COUNT
              : ExpenseSplitMethod.EQUAL,
        };
      });
      payload = resolvedItems.length === 1 ? resolvedItems[0] : { items: resolvedItems };
    } else if (intent === 'DEPOSIT_CREATE') {
      if (!canManage) throw new ForbiddenException('Only managers can record direct deposits');
      if (!parsed.data.amount || parsed.data.amount <= 0) missing.add('amount');
      if (!parsed.data.memberName || !memberMatch.member) missing.add('memberName');
      payload = {
        messId,
        memberId: memberMatch.member?.id,
        amount: parsed.data.amount,
        date,
        note: parsed.data.description,
      };
    } else if (intent === 'MEAL_CREATE') {
      if (!parsed.data.mealName || parsed.data.mealName === 'OTHER') missing.add('mealName');
      payload = {
        messId,
        memberId: memberMatch.member?.id ?? actor.id,
        mealName: parsed.data.mealName,
        date,
        status: parsed.data.status ?? AttendanceStatus.ON,
        ...(parsed.data.mealCount == null ? {} : { mealCount: parsed.data.mealCount }),
      };
    } else {
      intent = missing.size ? 'NEEDS_CLARIFICATION' : 'UNKNOWN';
    }

    return {
      intent,
      missingFields: [...missing],
      payload,
      clarification: missing.size
        ? `Please provide: ${[...missing].join(', ')}`
        : (intent === 'NEEDS_CLARIFICATION' || intent === 'UNKNOWN' ? parsed.clarification : null),
    };
  }

  private async validateDto<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
    const instance = plainToInstance(cls, payload);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
    });
    if (errors.length) {
      const messages = errors.flatMap((item) => Object.values(item.constraints ?? {}));
      throw new BadRequestException({
        code: 'AI_SCHEMA_INVALID',
        message: messages[0] ?? 'Command details are invalid',
      });
    }
    return instance;
  }

  private normalizeEditedPayload(
    intent: AiCommandIntent,
    payload: Record<string, unknown>,
  ) {
    if (intent !== AiCommandIntent.UTILITY_CREATE) return payload;
    const utility = this.utilityMapping({
      amount: null,
      date: null,
      category: null,
      utilityType:
        typeof payload.utilityType === 'string' &&
        Object.values(UtilityType).includes(payload.utilityType as UtilityType)
          ? (payload.utilityType as UtilityType)
          : null,
      itemName: null,
      description: null,
      memberName: null,
      mealName: null,
      mealCount: null,
      status: null,
      quantity: null,
      unit: null,
      items: [],
    });
    return {
      ...payload,
      type: ExpenseRecordType.UTILITY,
      category: utility.category,
      utilityType: utility.utilityType,
    };
  }

  private async domainPreview(
    intent: string,
    payload: Record<string, unknown>,
    userId: string,
    role: AuthRole,
  ) {
    if (intent === 'EXPENSE_CREATE' || intent === 'UTILITY_CREATE') {
      if (Array.isArray(payload.items)) {
        return Promise.all(
          payload.items.map((item) => this.domainPreview(intent, item as Record<string, unknown>, userId, role)),
        );
      }
      const dto = await this.validateDto(CreateExpenseDto, payload);
      return this.expenseService.preview(userId, role, dto);
    }
    if (intent === 'DEPOSIT_CREATE') {
      const dto = await this.validateDto(CreateDepositDto, payload);
      const prepared = await this.depositService.prepareCreate(userId, role, dto);
      return {
        memberId: prepared.memberId,
        amount: prepared.amount,
        date: prepared.depositDate,
        note: prepared.note,
        method: 'CASH',
      };
    }
    if (intent === 'MEAL_CREATE') {
      const dto = await this.validateDto(CreateMealDto, payload);
      const prepared = await this.mealService.prepareCreate(userId, role, dto);
      return {
        memberId: prepared.targetMemberId,
        mealName: dto.mealName,
        date: prepared.dateKey,
        status: prepared.normalized.status,
        mealCount: prepared.normalized.mealCount,
        warning: 'Confirming may update existing attendance for the same member, date, and meal.',
      };
    }
    return null;
  }

  private jsonSafe<T>(value: T): T {
    return JSON.parse(
      JSON.stringify(value, (_key, item) =>
        typeof item === 'bigint' ? item.toString() : item,
      ),
    ) as T;
  }

  private async runSerializable<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 20000,
        });
      } catch (error) {
        const conflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';
        if (!conflict || attempt === 3) throw error;
      }
    }
    throw new ConflictException('Could not confirm the command safely');
  }

  private mapCommand(command: any) {
    return {
      id: command.id,
      messId: command.mess_id,
      sourceType: command.source_type,
      intent: command.intent,
      status: command.status,
      locale: command.locale,
      input: command.original_input,
      transcript: command.transcript,
      payload: command.resolved_payload,
      preview: command.parsed_payload?.preview ?? null,
      missingFields: command.missing_fields ?? [],
      clarification: command.clarification,
      confidence: command.confidence == null ? null : Number(command.confidence),
      result: command.result_payload,
      errorCode: command.error_code,
      createdAt: command.created_at,
      confirmedAt: command.confirmed_at,
    };
  }

  private async createFromText(params: {
    messId: string;
    userId: string;
    role: AuthRole;
    text: string;
    locale: Locale;
    sourceType: AiCommandSourceType;
    transcript?: string;
    idempotencyKey?: string;
    rateLimitChecked?: boolean;
  }) {
    this.assertEnabled();
    const idempotencyKey = params.idempotencyKey ?? randomUUID();
    const existing = await this.prisma.aiCommand.findUnique({ where: { idempotency_key: idempotencyKey } });
    if (existing) {
      if (existing.user_id !== params.userId) throw new ConflictException('Idempotency key is already in use');
      return this.mapCommand(existing);
    }
    const context = await this.accessContext(params.messId, params.userId, params.role);
    if (!params.rateLimitChecked) await this.assertRateLimit(params.userId);
    const normalizedText = normalizeCommandText(params.text);
    const parsed = this.validateProviderResult(
      await this.commandProvider.parse(normalizedText, {
        today: this.todayDhaka(),
        timeZone: 'Asia/Dhaka',
        locale: params.locale,
        actorName: context.actor.name,
        canManage: context.canManage,
        memberNames: context.members.map((item) => item.name),
      }),
    );
    const resolved = this.resolveParsed(
      parsed,
      params.messId,
      context.actor,
      context.members,
      context.canManage,
    );
    const preview =
      resolved.intent !== 'NEEDS_CLARIFICATION' &&
      resolved.intent !== 'UNKNOWN' &&
      resolved.missingFields.length === 0 &&
      resolved.payload
        ? await this.domainPreview(resolved.intent, resolved.payload, params.userId, params.role)
        : null;
    const status =
      resolved.intent === 'NEEDS_CLARIFICATION' ||
      resolved.intent === 'UNKNOWN' ||
      resolved.missingFields.length > 0
      ? AiCommandStatus.NEEDS_CLARIFICATION
      : AiCommandStatus.PENDING;
    const command = await this.prisma.aiCommand.create({
      data: {
        mess_id: params.messId,
        user_id: params.userId,
        source_type: params.sourceType,
        intent: resolved.intent as AiCommandIntent,
        status,
        locale: params.locale,
        original_input: params.sourceType === AiCommandSourceType.TEXT ? params.text : null,
        transcript: params.transcript ?? null,
        normalized_text: normalizedText,
        provider: 'groq',
        stt_model: params.sourceType === AiCommandSourceType.VOICE ? config.aiAutomation.speechModel : null,
        command_model: config.aiAutomation.commandModel,
        parsed_payload: this.jsonSafe({ ...parsed, preview }),
        resolved_payload: resolved.payload
          ? (this.jsonSafe(resolved.payload) as Prisma.InputJsonValue)
          : undefined,
        missing_fields: resolved.missingFields,
        clarification: resolved.clarification,
        confidence: parsed.confidence,
        idempotency_key: idempotencyKey,
      },
    });
    return this.mapCommand(command);
  }

  createText(
    userId: string,
    role: AuthRole,
    input: { messId: string; text: string; locale?: Locale; idempotencyKey?: string },
  ) {
    return this.createFromText({
      ...input,
      userId,
      role,
      locale: input.locale ?? 'en',
      sourceType: AiCommandSourceType.TEXT,
    });
  }

  async createVoice(
    userId: string,
    role: AuthRole,
    input: {
      messId: string;
      locale?: Locale;
      speechLanguage?: SpeechLanguage;
      idempotencyKey?: string;
    },
    file?: Express.Multer.File,
  ) {
    this.assertEnabled();
    if (!file) throw new BadRequestException({ code: 'AI_UNSUPPORTED_AUDIO', message: 'Audio recording is required' });
    const audioMimeType = file.mimetype.split(';', 1)[0].trim().toLowerCase();
    if (!AUDIO_TYPES.has(audioMimeType)) {
      throw new BadRequestException({ code: 'AI_UNSUPPORTED_AUDIO', message: 'This audio format is not supported' });
    }
    if (file.size > config.aiAutomation.maxAudioBytes) {
      throw new BadRequestException({ code: 'AI_UNSUPPORTED_AUDIO', message: 'Audio recording is too large' });
    }
    await this.assertRateLimit(userId);
    const transcript = await this.speechProvider.transcribe(
      file,
      input.speechLanguage ?? 'auto',
    );
    if (/[\u0900-\u097f\u0a00-\u0d7f]/u.test(transcript)) {
      throw new BadRequestException({
        code: 'AI_UNSUPPORTED_TRANSCRIPT_LANGUAGE',
        message:
          'Only Bangla and English speech are supported. Select the correct voice language and try again.',
      });
    }
    return this.createFromText({
      ...input,
      userId,
      role,
      text: transcript,
      transcript,
      locale: input.locale ?? 'en',
      sourceType: AiCommandSourceType.VOICE,
      rateLimitChecked: true,
    });
  }

  private async prepareDomain(
    intent: AiCommandIntent,
    payload: Record<string, unknown>,
    userId: string,
    role: AuthRole,
  ): Promise<PreparedDomainCommand> {
    if (intent === AiCommandIntent.EXPENSE_CREATE || intent === AiCommandIntent.UTILITY_CREATE) {
      const dto = await this.validateDto(CreateExpenseDto, payload);
      return { intent, dto, prepared: await this.expenseService.prepareCreate(userId, role, dto) };
    }
    if (intent === AiCommandIntent.DEPOSIT_CREATE) {
      const dto = await this.validateDto(CreateDepositDto, payload);
      return { intent, dto, prepared: await this.depositService.prepareCreate(userId, role, dto) };
    }
    if (intent === AiCommandIntent.MEAL_CREATE) {
      const dto = await this.validateDto(CreateMealDto, payload);
      return { intent, dto, prepared: await this.mealService.prepareCreate(userId, role, dto) };
    }
    throw new BadRequestException({ code: 'AI_COMMAND_AMBIGUOUS', message: 'Command still needs clarification' });
  }

  async confirm(
    commandId: string,
    userId: string,
    role: AuthRole,
    editedPayload?: Record<string, unknown>,
  ) {
    this.assertEnabled();
    const command = await this.prisma.aiCommand.findFirst({ where: { id: commandId, user_id: userId } });
    if (!command) throw new NotFoundException('AI command not found');
    if (command.status === AiCommandStatus.CONFIRMED) return this.mapCommand(command);
    if (command.status === AiCommandStatus.CANCELLED) throw new ConflictException('AI command was cancelled');
    const base = (command.resolved_payload ?? {}) as Record<string, unknown>;
    const payload = this.normalizeEditedPayload(command.intent, {
      ...base,
      ...(editedPayload ?? {}),
      messId: command.mess_id,
    });
    const itemPayloads = Array.isArray(payload.items)
      ? payload.items.map((item) => ({ ...(item as Record<string, unknown>), messId: command.mess_id }))
      : [payload];
    const preparedCommands = await Promise.all(
      itemPayloads.map((item) => this.prepareDomain(command.intent, item, userId, role)),
    );

    const committed = await this.runSerializable(async (tx) => {
        const claimed = await tx.aiCommand.updateMany({
          where: {
            id: command.id,
            user_id: userId,
            status: { in: [AiCommandStatus.PENDING, AiCommandStatus.NEEDS_CLARIFICATION] },
          },
          data: {
            status: AiCommandStatus.PROCESSING,
            resolved_payload: this.jsonSafe(payload) as Prisma.InputJsonValue,
          },
        });
        if (claimed.count !== 1) {
          const latest = await tx.aiCommand.findUniqueOrThrow({ where: { id: command.id } });
          if (latest.status === AiCommandStatus.CONFIRMED) return { command: latest, domains: null };
          throw new ConflictException('AI command is already being processed');
        }

        const domains: any[] = [];
        for (const prepared of preparedCommands) {
          if (prepared.intent === 'EXPENSE_CREATE' || prepared.intent === 'UTILITY_CREATE') {
            domains.push(await this.expenseService.persistCreate(tx, userId, prepared.dto, prepared.prepared));
          } else if (prepared.intent === 'DEPOSIT_CREATE') {
            domains.push(await this.depositService.persistCreate(tx, userId, prepared.prepared));
          } else {
            domains.push(await this.mealService.persistCreate(tx, userId, prepared.dto, prepared.prepared));
          }
        }
        const firstPrepared = preparedCommands[0];
        const result = this.jsonSafe({
          id: domains[0]?.id,
          ids: domains.map((domain) => domain.id),
          intent: firstPrepared.intent,
          redirectTo:
            firstPrepared.intent === 'MEAL_CREATE'
              ? '/meals'
              : firstPrepared.intent === 'DEPOSIT_CREATE'
                ? '/payments'
                : '/expenses',
        });
        const saved = await tx.aiCommand.update({
          where: { id: command.id },
          data: {
            status: AiCommandStatus.CONFIRMED,
            result_payload: result,
            missing_fields: [],
            clarification: null,
            confirmed_at: new Date(),
            error_code: null,
            error_message: null,
          },
        });
        return { command: saved, domains };
      });

    if (committed.domains?.length) {
      try {
        for (const [index, prepared] of preparedCommands.entries()) {
          const domain = committed.domains[index];
          if (prepared.intent === 'EXPENSE_CREATE' || prepared.intent === 'UTILITY_CREATE') {
            await this.expenseService.completeCreate(userId, prepared.prepared, domain);
          } else if (prepared.intent === 'DEPOSIT_CREATE') {
            await this.depositService.completeCreate(prepared.prepared, domain);
          } else {
            await this.mealService.completeCreate(prepared.prepared, domain);
          }
        }
      } catch {
        // The atomic domain write is complete; reconciliation services can safely retry independently.
      }
    }
    return this.mapCommand(committed.command);
  }

  async cancel(commandId: string, userId: string) {
    this.assertEnabled();
    const result = await this.prisma.aiCommand.updateMany({
      where: {
        id: commandId,
        user_id: userId,
        status: { in: [AiCommandStatus.PENDING, AiCommandStatus.NEEDS_CLARIFICATION] },
      },
      data: { status: AiCommandStatus.CANCELLED },
    });
    if (!result.count) {
      const command = await this.prisma.aiCommand.findFirst({ where: { id: commandId, user_id: userId } });
      if (!command) throw new NotFoundException('AI command not found');
      if (command.status === AiCommandStatus.CANCELLED) return this.mapCommand(command);
      throw new ConflictException('Only pending AI commands can be cancelled');
    }
    return this.mapCommand(await this.prisma.aiCommand.findUniqueOrThrow({ where: { id: commandId } }));
  }

  capabilities(locale: Locale = 'en') {
    const enabled = config.aiAutomation.enabled && Boolean(config.aiAutomation.groqApiKey);
    return {
      enabled,
      locale,
      supportedLocales: ['en', 'bn'],
      supportedInputLanguages: ['bn', 'en', 'banglish', 'mixed'],
      intents: ['EXPENSE_CREATE', 'UTILITY_CREATE', 'DEPOSIT_CREATE', 'MEAL_CREATE'],
      voice: { enabled, maxBytes: config.aiAutomation.maxAudioBytes, maxDurationSeconds: 60 },
      confirmationRequired: true,
      multiAction: true,
    };
  }

  @Cron('20 3 * * *', { timeZone: 'Asia/Dhaka' })
  async purgeExpiredCommands() {
    const cutoff = new Date(Date.now() - config.aiAutomation.retentionDays * 86_400_000);
    await this.prisma.aiCommand.deleteMany({
      where: {
        created_at: { lt: cutoff },
        status: { in: [AiCommandStatus.CONFIRMED, AiCommandStatus.CANCELLED, AiCommandStatus.FAILED] },
      },
    });
  }
}
