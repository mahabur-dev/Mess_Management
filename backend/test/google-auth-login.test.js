const test = require('node:test');
const assert = require('node:assert/strict');
const { AuthService } = require('../dist/app/module/auth/auth.service');

function sessionUser(overrides = {}) {
  return {
    id: 'user-1',
    name: 'Existing Member',
    email: 'member@example.com',
    role: 'MEMBER',
    is_active: true,
    memberships: [],
    ...overrides,
  };
}

function dependencies(identity, userApi) {
  const cookies = [];
  return {
    service: new AuthService(
      {
        user: userApi,
        authOtpChallenge: { deleteMany: async () => ({ count: 0 }) },
      },
      { sign: (_payload, options) => `jwt-${String(options.secret)}` },
      { verifyGoogleIdToken: async () => identity },
    ),
    response: {
      cookie: (...args) => cookies.push(args),
    },
    cookies,
  };
}

test('links a verified Google identity to an existing same-email user', async () => {
  const updates = [];
  const existing = sessionUser({ firebase_uid: null });
  const { service, response, cookies } = dependencies(
    {
      uid: 'firebase-1',
      email: existing.email,
      name: existing.name,
      picture: 'https://example.com/avatar.png',
    },
    {
      findUnique: async ({ where }) =>
        where.firebase_uid ? null : existing,
      update: async (args) => {
        updates.push(args);
        return sessionUser({ avatar_url: 'https://example.com/avatar.png' });
      },
      create: async () => assert.fail('must not create a duplicate user'),
    },
  );

  const result = await service.googleLogin({ idToken: 'token' }, response);
  assert.equal(updates[0].data.firebase_uid, 'firebase-1');
  assert.equal(updates[0].data.is_verified, true);
  assert.equal(result.user.email, existing.email);
  assert.equal(cookies.length, 1);
});

test('creates a new verified Google user with MEMBER role', async () => {
  const creates = [];
  const identity = {
    uid: 'firebase-2',
    email: 'new@example.com',
    name: 'New Member',
  };
  const { service, response } = dependencies(identity, {
    findUnique: async () => null,
    update: async () => assert.fail('must not update a missing user'),
    create: async (args) => {
      creates.push(args);
      return sessionUser({
        id: 'user-2',
        email: identity.email,
        name: identity.name,
      });
    },
  });

  const result = await service.googleLogin({ idToken: 'token' }, response);
  assert.equal(creates[0].data.firebase_uid, identity.uid);
  assert.equal(creates[0].data.role, 'MEMBER');
  assert.equal(creates[0].data.is_verified, true);
  assert.ok(creates[0].data.password_hash);
  assert.equal(result.user.email, identity.email);
});
