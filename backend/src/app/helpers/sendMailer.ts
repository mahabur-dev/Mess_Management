import { Resend } from 'resend';
import config from '../config';

type SendMailerResult = {
  id?: string;
};

/** Send transactional email through Resend. */
const sendMailer = async (
  email: string,
  subject = '',
  html = '',
): Promise<SendMailerResult> => {
  const apiKey = config.resendApiKey?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const recipient = email.trim().toLowerCase();
  if (!recipient) {
    throw new Error('Email recipient is required');
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: config.email.resendFrom,
    to: recipient,
    subject: subject.trim(),
    html,
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message}`);
  }

  return data ?? {};
};

export default sendMailer;
