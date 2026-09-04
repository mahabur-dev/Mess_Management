const test = require('node:test');
const assert = require('node:assert/strict');

process.env.RESEND_API_KEY = 'test-resend-key';
delete process.env.RESEND_FROM_EMAIL;
process.env.EMAIL_HOST = 'smtp.example.com';
process.env.EMAIL_PORT = '465';
process.env.EMAIL_ADDRESS = 'mailer@example.com';
process.env.EMAIL_PASS = 'app-password';
process.env.EMAIL_FROM = 'Messzen <mailer@example.com>';

const transports = [];
const messages = [];
const nodemailerPath = require.resolve('nodemailer');
require.cache[nodemailerPath] = {
  id: nodemailerPath,
  filename: nodemailerPath,
  loaded: true,
  exports: {
    __esModule: true,
    default: {
      createTransport: (options) => {
        transports.push(options);
        return {
          sendMail: async (message) => {
            messages.push(message);
            return { messageId: 'smtp-message-1' };
          },
        };
      },
    },
  },
};

const sendMailer = require('../dist/app/helpers/sendMailer').default;

test('uses configured SMTP when the Resend sender pair is incomplete', async () => {
  const result = await sendMailer(
    'New-Member@Example.com ',
    ' Registration OTP ',
    '<p>123456</p>',
  );

  assert.equal(result.id, 'smtp-message-1');
  assert.deepEqual(transports[0], {
    host: 'smtp.example.com',
    port: 465,
    secure: true,
    auth: { user: 'mailer@example.com', pass: 'app-password' },
  });
  assert.deepEqual(messages[0], {
    from: 'Messzen <mailer@example.com>',
    to: 'new-member@example.com',
    subject: 'Registration OTP',
    html: '<p>123456</p>',
  });
});
