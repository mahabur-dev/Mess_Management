const assert = require('node:assert/strict');
const test = require('node:test');
require('ts-node/register/transpile-only');
require('tsconfig-paths/register');

const { isSwaggerEnabled } = require('../src/app/config/swagger.policy.ts');

test('keeps Swagger disabled unless it is explicitly enabled', () => {
  assert.equal(isSwaggerEnabled({ NODE_ENV: 'development' }), false);
});

test('allows explicit Swagger access outside production', () => {
  assert.equal(
    isSwaggerEnabled({
      NODE_ENV: 'development',
      SWAGGER_ENABLED: 'true',
    }),
    true,
  );
});

test('always disables Swagger in production', () => {
  assert.equal(
    isSwaggerEnabled({
      NODE_ENV: 'production',
      SWAGGER_ENABLED: 'true',
    }),
    false,
  );
});
