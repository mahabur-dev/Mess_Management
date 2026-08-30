const test = require('node:test');
const assert = require('node:assert/strict');
const {
  errorMessageContract,
  successMessageContract,
} = require('../dist/app/contracts/api-message.contract');
const { UtilsInterceptor } = require('../dist/app/utils/utils.interceptor');
const { lastValueFrom, of } = require('rxjs');

test('creates a stable domain code and params for resource errors', () => {
  assert.deepEqual(
    errorMessageContract({
      statusCode: 404,
      message: 'Meal entry not found',
      code: 'RESOURCE_NOT_FOUND',
    }),
    {
      code: 'MEAL_ENTRY_NOT_FOUND',
      message: 'Meal entry not found',
      params: { resource: 'mealEntry' },
    },
  );
});

test('maps known authentication errors without exposing sentence matching to clients', () => {
  assert.equal(
    errorMessageContract({
      statusCode: 401,
      message: 'Invalid email or password',
      code: 'AUTH_UNAUTHORIZED',
    }).code,
    'AUTH_INVALID_CREDENTIALS',
  );
  assert.equal(
    errorMessageContract({
      statusCode: 401,
      message: 'Invalid Google authentication token',
      code: 'AUTH_UNAUTHORIZED',
    }).code,
    'AUTH_GOOGLE_TOKEN_INVALID',
  );
  assert.equal(
    errorMessageContract({
      statusCode: 409,
      message: 'Google account is linked to another user',
      code: 'RESOURCE_CONFLICT',
    }).code,
    'AUTH_GOOGLE_LINK_CONFLICT',
  );
});

test('preserves explicit domain codes and params', () => {
  assert.deepEqual(
    errorMessageContract({
      statusCode: 400,
      message: 'Audio recording is required',
      code: 'AI_UNSUPPORTED_AUDIO',
      params: { maxSizeMb: 8 },
    }),
    {
      code: 'AI_UNSUPPORTED_AUDIO',
      message: 'Audio recording is required',
      params: { field: 'audioRecording', maxSizeMb: 8 },
    },
  );
});

test('uses a stable generic success code unless a domain code is explicit', () => {
  assert.deepEqual(successMessageContract('Expense created successfully'), {
    code: 'REQUEST_COMPLETED',
    message: 'Expense created successfully',
    params: {},
  });
  assert.equal(
    successMessageContract('Expense created successfully', 'EXPENSE_CREATED').code,
    'EXPENSE_CREATED',
  );
  assert.equal(successMessageContract(null).code, 'REQUEST_COMPLETED');
});

test('global success interceptor emits the code/message/params envelope', async () => {
  const interceptor = new UtilsInterceptor();
  const context = {
    switchToHttp: () => ({ getResponse: () => ({ statusCode: 201 }) }),
  };
  const response = await lastValueFrom(
    interceptor.intercept(context, {
      handle: () => of({
        code: 'EXPENSE_CREATED',
        message: 'Expense created successfully',
        params: { expenseId: 'expense-1' },
        data: { id: 'expense-1' },
      }),
    }),
  );

  assert.deepEqual(response, {
    statusCode: 201,
    success: true,
    code: 'EXPENSE_CREATED',
    message: 'Expense created successfully',
    params: { expenseId: 'expense-1' },
    meta: null,
    data: { id: 'expense-1' },
  });
});
