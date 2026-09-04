const test = require('node:test');
const assert = require('node:assert/strict');

const mailerPath = require.resolve('../dist/app/helpers/sendMailer');
const sentEmails = [];
require.cache[mailerPath] = {
  id: mailerPath,
  filename: mailerPath,
  loaded: true,
  exports: {
    __esModule: true,
    default: async (...args) => {
      sentEmails.push(args);
      return { id: 'email-1' };
    },
  },
};

const { AuthService } = require('../dist/app/module/auth/auth.service');

function createRegistrationService() {
  const challenges = [];
  const prisma = {
    user: {
      findUnique: async () => null,
      create: async ({ data }) => ({
        id: 'user-1',
        name: data.name,
        email: data.email,
      }),
    },
    authOtpChallenge: {
      findUnique: async () => null,
      upsert: async (args) => {
        challenges.push(args);
        return args.create;
      },
      deleteMany: async () => ({ count: 0 }),
    },
  };
  const service = new AuthService(
    prisma,
    { sign: () => 'token' },
    { verifyGoogleIdToken: async () => assert.fail('Google auth is not used') },
  );
  return { service, challenges };
}

test('registration creates an email-verification challenge and sends its OTP', async () => {
  sentEmails.length = 0;
  const { service, challenges } = createRegistrationService();

  const result = await service.register({
    name: 'New Member',
    email: 'new-member@example.com',
    phone: '01700000000',
    password: 'secret123',
  });

  assert.equal(challenges.length, 1);
  assert.equal(challenges[0].create.purpose, 'EMAIL_VERIFICATION');
  assert.match(challenges[0].create.otp_hash, /^[a-f0-9]{64}$/);
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0][0], 'new-member@example.com');
  assert.match(sentEmails[0][1], /verify your email/i);
  assert.match(sentEmails[0][2], /finish creating your account/i);
  assert.equal(sentEmails[0][2].includes(challenges[0].create.otp_hash), false);
  assert.equal(result.email, 'new-member@example.com');
});
