import { translate } from './translate'
import type { Locale } from './types'

type MessageParams = Record<string, string | number | boolean | null>

type ErrorPresentation = {
  code: string
  status: number | null
  params: MessageParams
}

const ERROR_KEYS: Record<string, string> = {
  NETWORK_ERROR: 'errors.network',
  SERVER_UNAVAILABLE: 'errors.serviceUnavailable',
  INTERNAL_SERVER_ERROR: 'errors.serviceUnavailable',
  DATABASE_ERROR: 'errors.serviceUnavailable',
  AI_PROVIDER_TIMEOUT: 'errors.aiUnavailable',
  AI_PROVIDER_UNAVAILABLE: 'errors.aiUnavailable',
  AI_TRANSCRIPTION_FAILED: 'errors.aiUnavailable',
  AI_PARSE_FAILED: 'errors.aiUnavailable',
  AI_SCHEMA_INVALID: 'errors.aiUnavailable',
  AI_DISABLED: 'errors.aiUnavailable',
  AI_RATE_LIMITED: 'errors.rateLimited',
  RATE_LIMITED: 'errors.rateLimited',
  AI_UNSUPPORTED_AUDIO: 'errors.audioUnsupported',
  AI_UNSUPPORTED_TRANSCRIPT_LANGUAGE: 'errors.audioUnsupported',
  AI_COMMAND_AMBIGUOUS: 'errors.aiAmbiguous',
  VALIDATION_FAILED: 'errors.validation',
  BAD_REQUEST: 'errors.badRequest',
  AUTH_UNAUTHORIZED: 'errors.unauthorized',
  AUTH_TOKEN_MISSING: 'errors.unauthorized',
  AUTH_TOKEN_INVALID: 'errors.unauthorized',
  AUTH_FORBIDDEN: 'errors.forbidden',
  AUTH_INVALID_CREDENTIALS: 'errors.invalidCredentials',
  AUTH_GOOGLE_TOKEN_INVALID: 'errors.googleAuthenticationFailed',
  AUTH_GOOGLE_EMAIL_UNVERIFIED: 'errors.googleAuthenticationFailed',
  AUTH_GOOGLE_LINK_CONFLICT: 'errors.googleLinkConflict',
  AUTH_GOOGLE_NOT_CONFIGURED: 'errors.serviceUnavailable',
  AUTH_EMAIL_ALREADY_REGISTERED: 'errors.emailRegistered',
  AUTH_ACCOUNT_DEACTIVATED: 'errors.accountDeactivated',
  AUTH_EMAIL_NOT_FOUND: 'errors.emailNotFound',
  AUTH_USER_NOT_FOUND: 'errors.unauthorized',
  AUTH_OTP_INVALID: 'errors.otpInvalid',
  AUTH_OTP_EXPIRED: 'errors.otpExpired',
  AUTH_OTP_VERIFICATION_REQUIRED: 'errors.otpRequired',
  AUTH_OLD_PASSWORD_INCORRECT: 'errors.oldPasswordIncorrect',
  ACCOUNT_MANAGER_TRANSFER_REQUIRED: 'errors.managerTransferRequired',
  ACCOUNT_ALREADY_DELETED: 'errors.accountAlreadyDeleted',
  RESOURCE_NOT_FOUND: 'errors.notFound',
  RESOURCE_CONFLICT: 'errors.conflict',
  RELATED_RESOURCE_NOT_FOUND: 'errors.notFound',
  RELATION_CONFLICT: 'errors.conflict',
}

const RESOURCE_KEYS = new Set([
  'record', 'resource', 'meal', 'mealEntry', 'expense', 'payment', 'deposit',
  'monthlyBill', 'member', 'membership', 'memberJoinRequest', 'user', 'mess',
  'messRequest', 'notice', 'notification', 'complaint', 'subscription',
  'subscriptionPlan', 'familyMember', 'personalTransaction', 'personalBudget',
  'shoppingList', 'shoppingItem', 'collectedFundEntry',
])

const FIELD_KEYS = new Set([
  'field', 'email', 'password', 'messId', 'audioRecording', 'selectedMembers',
  'expenseItems', 'description',
])

function presentationOf(error: unknown): ErrorPresentation {
  if (!error || typeof error !== 'object') return { code: '', status: null, params: {} }
  const record = error as Record<string, unknown>
  const params = record.params && typeof record.params === 'object' && !Array.isArray(record.params)
    ? record.params as MessageParams
    : {}
  return {
    code: typeof record.code === 'string' ? record.code : '',
    status: typeof record.status === 'number' ? record.status : null,
    params,
  }
}

function camelCaseCode(value: string) {
  return value.toLowerCase().replace(/_([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase())
}

function localizedResource(code: string, params: MessageParams, locale: Locale) {
  const fromParams = typeof params.resource === 'string' ? params.resource : ''
  const fromCode = code.endsWith('_NOT_FOUND') ? camelCaseCode(code.slice(0, -'_NOT_FOUND'.length)) : ''
  const resource = RESOURCE_KEYS.has(fromParams) ? fromParams : RESOURCE_KEYS.has(fromCode) ? fromCode : 'resource'
  return translate(locale, 'api', `resources.${resource}`)
}

function localizedField(code: string, params: MessageParams, locale: Locale) {
  const fromParams = typeof params.field === 'string' ? params.field : ''
  const suffix = code.endsWith('_REQUIRED') ? '_REQUIRED' : code.endsWith('_INVALID') ? '_INVALID' : ''
  const fromCode = suffix ? camelCaseCode(code.slice(0, -suffix.length)) : ''
  const field = FIELD_KEYS.has(fromParams) ? fromParams : FIELD_KEYS.has(fromCode) ? fromCode : 'field'
  return translate(locale, 'api', `fields.${field}`)
}

/**
 * Converts the stable API code/params contract to UI copy. The backend's
 * English diagnostic sentence is intentionally never used for presentation.
 */
export function localizedErrorMessage(error: unknown, locale: Locale, fallbackMessage?: string) {
  const { code, status, params } = presentationOf(error)
  const key = ERROR_KEYS[code]
  if (key) return translate(locale, 'api', key)

  if (code.endsWith('_NOT_FOUND')) {
    return translate(locale, 'api', 'errors.resourceNotFound', {
      resource: localizedResource(code, params, locale),
    })
  }
  if (code.endsWith('_REQUIRED')) {
    return translate(locale, 'api', 'errors.required', {
      field: localizedField(code, params, locale),
    })
  }
  if (code.endsWith('_INVALID')) {
    return translate(locale, 'api', 'errors.invalid', {
      field: localizedField(code, params, locale),
    })
  }
  if (status === 401) return translate(locale, 'api', 'errors.unauthorized')
  if (status === 403) return translate(locale, 'api', 'errors.forbidden')
  if (status === 404) return translate(locale, 'api', 'errors.notFound')
  if (status === 409) return translate(locale, 'api', 'errors.conflict')
  if (status === 429) return translate(locale, 'api', 'errors.rateLimited')
  if (status !== null && status >= 500) return translate(locale, 'api', 'errors.serviceUnavailable')
  return fallbackMessage ?? translate(locale, 'api', 'errors.generic')
}

export function localizedSuccessMessage(response: unknown, locale: Locale, fallbackMessage?: string) {
  if (response && typeof response === 'object' && 'code' in response) {
    // Domain screens normally provide a more contextual localized success key.
    // This generic copy is the safe presentation for unrecognised success codes.
    return fallbackMessage ?? translate(locale, 'api', 'success.generic')
  }
  return fallbackMessage ?? translate(locale, 'api', 'success.generic')
}
