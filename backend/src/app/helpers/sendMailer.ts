import { Resend } from 'resend';
import config from '../config';

type SendMailerResult = {
  id?: string;
};

// Initialize Resend once
const apiKey = config.resendApiKey?.trim();

if (!apiKey) {
  throw new Error('RESEND_API_KEY is not configured');
}

const resend = new Resend(apiKey);

/**
 * Send transactional email through Resend.
 */
const sendMailer = async (
  email: string,
  subject = '',
  html = '',
): Promise<SendMailerResult> => {
  try {
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

    if (!fromAddress) {
      throw new Error('RESEND_FROM_EMAIL is not configured');
    }

    // Prevent accidentally using Resend testing domain
    if (fromAddress.includes('@resend.dev')) {
      throw new Error(
        'Invalid sender address. Use an email address from your verified Resend domain.',
      );
    }

    const { data, error } = await resend.emails.send({
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

    return {
      id: data?.id,
    };
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
