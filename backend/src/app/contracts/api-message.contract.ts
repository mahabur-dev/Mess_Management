import { HttpStatus } from '@nestjs/common';

export type ApiMessageParam = string | number | boolean | null;
export type ApiMessageParams = Record<string, ApiMessageParam>;

export type ApiMessageContract = {
  code: string;
  message: string;
  params: ApiMessageParams;
};

export function apiMessage(
  code: string,
  message: string,
  params: ApiMessageParams = {},
): ApiMessageContract {
  return { code, message, params };
}

const FRAMEWORK_ERROR_CODES = new Set([
  'VALIDATION_FAILED',
  'AUTH_UNAUTHORIZED',
  'AUTH_FORBIDDEN',
  'BAD_REQUEST',
  'RESOURCE_NOT_FOUND',
  'RESOURCE_CONFLICT',
  'RELATED_RESOURCE_NOT_FOUND',
  'RELATION_CONFLICT',
]);

const KNOWN_ERROR_CODES = new Map<string, string>([
  ['invalid email or password', 'AUTH_INVALID_CREDENTIALS'],
  ['email already registered', 'AUTH_EMAIL_ALREADY_REGISTERED'],
  ['account is deactivated', 'AUTH_ACCOUNT_DEACTIVATED'],
  [
    'please verify your email before signing in',
    'AUTH_EMAIL_VERIFICATION_REQUIRED',
  ],
  ['email already verified', 'AUTH_EMAIL_ALREADY_VERIFIED'],
  ['invalid google authentication token', 'AUTH_GOOGLE_TOKEN_INVALID'],
  ['google email is not verified', 'AUTH_GOOGLE_EMAIL_UNVERIFIED'],
  ['google account is linked to another user', 'AUTH_GOOGLE_LINK_CONFLICT'],
  ['google authentication is not configured', 'AUTH_GOOGLE_NOT_CONFIGURED'],
  ['email not found', 'AUTH_EMAIL_NOT_FOUND'],
  ['invalid otp', 'AUTH_OTP_INVALID'],
  ['otp has expired', 'AUTH_OTP_EXPIRED'],
  ['please verify otp first', 'AUTH_OTP_VERIFICATION_REQUIRED'],
  ['old password is incorrect', 'AUTH_OLD_PASSWORD_INCORRECT'],
  ['unauthorized: no token provided', 'AUTH_TOKEN_MISSING'],
  ['unauthorized: invalid or expired token', 'AUTH_TOKEN_INVALID'],
  ['unauthorized: user not found', 'AUTH_USER_NOT_FOUND'],
  ['forbidden: account is deactivated', 'AUTH_ACCOUNT_DEACTIVATED'],
  ['too many ai requests. please try again shortly.', 'AI_RATE_LIMITED'],
  ['daily ai command limit reached.', 'AI_RATE_LIMITED'],
]);

function sentenceKey(message: string) {
  return message.trim().replace(/\s+/g, ' ').toLowerCase();
}

function codeSegment(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

function resourceParam(value: string) {
  const words = value
    .trim()
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return words
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : `${word[0]?.toUpperCase() ?? ''}${word.slice(1).toLowerCase()}`,
    )
    .join('');
}

function semanticErrorFromMessage(
  message: string,
): { code: string; params: ApiMessageParams } | null {
  const knownCode = KNOWN_ERROR_CODES.get(sentenceKey(message));
  if (knownCode) return { code: knownCode, params: {} };

  const notFound = message.match(/^(.+?) not found[.!]?$/i);
  if (notFound) {
    const resource = notFound[1].trim();
    return {
      code: `${codeSegment(resource)}_NOT_FOUND`,
      params: { resource: resourceParam(resource) },
    };
  }

  const required = message.match(/^(.+?) (?:is|are) required[.!]?$/i);
  if (required) {
    const field = required[1].trim();
    return {
      code: `${codeSegment(field)}_REQUIRED`,
      params: { field: resourceParam(field) },
    };
  }

  const invalid = message.match(/^Invalid (.+?)[.!]?$/i);
  if (invalid) {
    const field = invalid[1].trim();
    return {
      code: `${codeSegment(field)}_INVALID`,
      params: { field: resourceParam(field) },
    };
  }

  return null;
}

export function errorMessageContract(input: {
  statusCode: number;
  message: string;
  code: string;
  params?: ApiMessageParams;
}): ApiMessageContract {
  const semantic = semanticErrorFromMessage(input.message);
  const canRefineGenericCode = FRAMEWORK_ERROR_CODES.has(input.code);
  return {
    code:
      semantic && canRefineGenericCode
        ? semantic.code
        : input.code || `HTTP_${input.statusCode}`,
    message: input.message,
    params: { ...(semantic?.params ?? {}), ...(input.params ?? {}) },
  };
}

export function successMessageContract(
  message: unknown,
  explicitCode?: unknown,
  explicitParams?: unknown,
): ApiMessageContract {
  const fallbackMessage = 'Request successfully completed';
  const normalizedMessage =
    typeof message === 'string' && message.trim()
      ? message.trim()
      : fallbackMessage;
  const params =
    explicitParams &&
    typeof explicitParams === 'object' &&
    !Array.isArray(explicitParams)
      ? (explicitParams as ApiMessageParams)
      : {};

  return {
    code:
      typeof explicitCode === 'string' && explicitCode.trim()
        ? explicitCode.trim()
        : 'REQUEST_COMPLETED',
    message: normalizedMessage,
    params,
  };
}

export function safeErrorMessage(statusCode: number) {
  if (statusCode === HttpStatus.SERVICE_UNAVAILABLE) {
    return 'Service temporarily unavailable';
  }
  return statusCode >= 500 ? 'Something went wrong' : 'Request failed';
}
