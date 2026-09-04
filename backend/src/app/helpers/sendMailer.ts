import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import config from '../config';

type SendMailerResult = {
  id?: string;
};

/**
 * Send transactional email through Resend.
 *
 * Configuration is checked when an email is actually sent instead of during
 * module import. This keeps non-email flows (including authentication tests)
 * runnable in environments that intentionally do not have mail credentials.
 */
const sendMailer = async (
  email: string,
  subject = '',
  html = '',
): Promise<SendMailerResult> => {
  try {
    const apiKey = config.resendApiKey?.trim();
    const recipient = email?.trim().toLowerCase();
    const emailSubject = subject?.trim();
    const fromAddress = config.email.resendFrom?.trim();

    if (!recipient) {
      throw new Error('Email recipient is required');
    }

    if (!emailSubject) {
      throw new Error('Email subject is required');
    }

    if (!html) {
      throw new Error('Email HTML content is required');
    }

    if (apiKey && fromAddress) {
      // Resend's testing domain cannot deliver registration OTPs to arbitrary
      // recipients, so production must use a verified sender domain.
      if (fromAddress.includes('@resend.dev')) {
        throw new Error(
          'Invalid sender address. Use an email address from your verified Resend domain.',
        );
      }

      const { data, error } = await new Resend(apiKey).emails.send({
        from: fromAddress,
        to: [recipient],
        subject: emailSubject,
        html,
      });

      if (error) {
        console.error('Resend API error:', error);

        throw new Error(
          `Resend email failed: ${error.message || 'Unknown Resend error'}`,
        );
      }

      return { id: data?.id };
    }

    const smtpHost = config.email.smtpHost.trim();
    const smtpUser = config.email.smtpUser.trim();
    const smtpPass = config.email.smtpPass.trim();
    const smtpFrom = config.email.smtpFrom.trim();
    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      throw new Error(
        'Email transport is not configured. Set RESEND_API_KEY with RESEND_FROM_EMAIL, or configure EMAIL_HOST, EMAIL_PORT, EMAIL_ADDRESS, EMAIL_PASS, and EMAIL_FROM.',
      );
    }

    const info = await nodemailer
      .createTransport({
        host: smtpHost,
        port: config.email.smtpPort,
        secure: config.email.smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      })
      .sendMail({
        from: smtpFrom,
        to: recipient,
        subject: emailSubject,
        html,
      });

    return { id: info.messageId };
  } catch (error) {
    console.error('sendMailer error:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Unknown error occurred while sending email');
  }
};

export default sendMailer;

// import { Resend } from 'resend';
// import config from '../config';

// type SendMailerResult = {
//   id?: string;
// };

// /** Send transactional email through Resend. */
// const sendMailer = async (
//   email: string,
//   subject = '',
//   html = '',
// ): Promise<SendMailerResult> => {
//   const apiKey = config.resendApiKey?.trim();
//   if (!apiKey) {
//     throw new Error('RESEND_API_KEY is not configured');
//   }

//   const recipient = email.trim().toLowerCase();
//   if (!recipient) {
//     throw new Error('Email recipient is required');
//   }

//   const resend = new Resend(apiKey);
//   const { data, error } = await resend.emails.send({
//     from: config.email.resendFrom,
//     to: recipient,
//     subject: subject.trim(),
//     html,
//   });

//   if (error) {
//     throw new Error(`Resend email failed: ${error.message}`);
//   }

//   return data ?? {};
// };

// export default sendMailer;
