const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const { AuthService } = require('../dist/app/module/auth/auth.service');
const {
  generateOtp,
  hashAuthSecret,
  matchesAuthSecret,
} = require('../dist/app/module/auth/auth-otp');
const config = require('../dist/app/config').default;

function createService(prisma) {
  return new AuthService(
    prisma,
    { sign: () => 'token' },
    { verifyGoogleIdToken: async () => assert.fail('Google auth is not used') },
  );
}

test('OTP generation and hashing keep the raw code out of storage', () => {
  const otp = generateOtp();
  assert.match(otp, /^\d{6}$/);

  const emailHash = hashAuthSecret(
    otp,
    'user-1',
    'EMAIL_VERIFICATION',
    'test-pepper',
  );
  const resetHash = hashAuthSecret(
    otp,
    'user-1',
    'PASSWORD_RESET',
    'test-pepper',
  );
  assert.equal(emailHash.length, 64);
  assert.notEqual(emailHash, otp);
  assert.notEqual(emailHash, resetHash);
  assert.equal(matchesAuthSecret(emailHash, emailHash), true);
  assert.equal(matchesAuthSecret(emailHash, resetHash), false);
});

test('password login rejects an account whose email is not verified', async () => {
  const password = 'correct-password';
  const password_hash = await bcrypt.hash(password, 4);
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'user-1',
        email: 'member@example.com',
        name: 'Member',
        role: 'MEMBER',
        is_active: true,
        is_verified: false,
        password_hash,
        memberships: [],
      }),
    },
  });

  await assert.rejects(
    service.login(
      { email: 'member@example.com', password },
      { cookie: () => assert.fail('No session cookie should be created') },
    ),
    (error) => error.getStatus() === 403 && /verify your email/i.test(error.message),
  );
});

test('forgot-password keeps account discovery private and returns cooldown metadata', async () => {
  const responses = [];
  for (const user of [null, { is_active: false }]) {
    const service = createService({
      user: { findUnique: async () => user },
    });
    responses.push(await service.forgotPassword({ email: 'unknown@example.com' }));
  }

  assert.deepEqual(responses[0], responses[1]);
  assert.equal(responses[0].message, 'If the account exists, an OTP was sent');
  assert.equal(
    responses[0].resendAvailableInSeconds,
    config.authOtp.resendCooldownSeconds,
  );
});

test('email verification consumes only the registration challenge', async () => {
  const userId = 'user-1';
  const otp = '123456';
  const updates = [];
  const deletions = [];
  const challenge = {
    id: 'challenge-1',
    otp_hash: hashAuthSecret(
      otp,
      userId,
      'EMAIL_VERIFICATION',
      config.authOtp.pepper,
    ),
    expires_at: new Date(Date.now() + 60_000),
    failed_attempts: 0,
    verified_at: null,
  };
  const prisma = {
    user: {
      findUnique: async () => ({
        id: userId,
        email: 'member@example.com',
        is_verified: false,
      }),
      update: (args) => {
        updates.push(args);
        return Promise.resolve(args);
      },
    },
    authOtpChallenge: {
      findUnique: async () => challenge,
      update: async () => assert.fail('A valid OTP must not increment attempts'),
      delete: (args) => {
        deletions.push(args);
        return Promise.resolve(args);
      },
    },
    $transaction: async (operations) => Promise.all(operations),
  };

  const result = await createService(prisma).verifyEmail({
    email: 'member@example.com',
    otp,
  });
  assert.equal(result.verified, true);
  assert.equal(updates[0].data.is_verified, true);
  assert.deepEqual(deletions[0].where, { id: challenge.id });
});

test('password reset uses a one-time token without changing email verification', async () => {
  const userId = 'user-1';
  const resetToken = 'a'.repeat(64);
  const updates = [];
  const challenge = {
    id: 'challenge-2',
    verified_at: new Date(),
    verification_token_hash: hashAuthSecret(
      resetToken,
      userId,
      'PASSWORD_RESET',
      config.authOtp.pepper,
    ),
    verification_token_expiry: new Date(Date.now() + 60_000),
  };
  const prisma = {
    user: {
      findUnique: async () => ({ id: userId }),
      update: (args) => {
        updates.push(args);
        return Promise.resolve(args);
      },
    },
    authOtpChallenge: {
      findUnique: async () => challenge,
      delete: (args) => Promise.resolve(args),
    },
    $transaction: async (operations) => Promise.all(operations),
  };

  await createService(prisma).resetPassword({
    email: 'member@example.com',
    resetToken,
    newPassword: 'new-password',
  });
  assert.ok(updates[0].data.password_hash);
  assert.equal('is_verified' in updates[0].data, false);
});
