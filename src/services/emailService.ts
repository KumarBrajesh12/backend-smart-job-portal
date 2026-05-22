import nodemailer, { type SentMessageInfo, type Transporter } from 'nodemailer';
import type { NodemailerSmtpOptions } from '../types/nodemailer-smtp.js';
import env, { isSmtpConfigured } from '../config/env.js';
import AppError from '../utils/AppError.js';

let smtpTransporter: Transporter | null = null;
let etherealTransporterPromise: Promise<Transporter> | null = null;

const isGmail = (): boolean =>
  env.smtpMode === 'gmail' ||
  env.smtp.service === 'gmail' ||
  env.smtp.host.toLowerCase().includes('gmail');

const createSmtpTransportOptions = (): NodemailerSmtpOptions => {
  const auth = {
    user: env.smtp.user,
    pass: env.smtp.pass,
  };

  if (env.smtp.service || env.smtpMode === 'gmail' || isGmail()) {
    return {
      service: env.smtp.service || 'gmail',
      auth,
    };
  }

  return {
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth,
    requireTLS: !env.smtp.secure && env.smtp.port === 587,
    tls: {
      minVersion: 'TLSv1.2',
    },
  };
};

const getEtherealTransporter = async (): Promise<Transporter> => {
  if (!env.isDevelopment) {
    throw new AppError(
      'SMTP_MODE=ethereal is only allowed in development',
      500,
    );
  }

  if (!etherealTransporterPromise) {
    etherealTransporterPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount();
      console.log('\n[DEV] Ethereal test email active (no Gmail needed)');
      console.log('[DEV] Open preview URLs in the terminal after each send\n');
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    })();
  }

  return etherealTransporterPromise;
};

const getSmtpTransporter = (): Transporter => {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport(
      createSmtpTransportOptions() as Parameters<
        typeof nodemailer.createTransport
      >[0],
    );
  }
  return smtpTransporter;
};

const getTransporter = async (): Promise<Transporter> => {
  if (!isSmtpConfigured()) {
    throw new AppError(
      'Email service is not configured. Set SMTP_* in .env or SMTP_MODE=ethereal for local dev',
      503,
    );
  }

  if (env.smtpMode === 'ethereal') {
    return getEtherealTransporter();
  }

  return getSmtpTransporter();
};

const formatSmtpError = (error: unknown): string => {
  const err = error as Error & { code?: string };
  const code = err.code ?? '';
  const message = err.message ?? 'Unknown email error';

  if (code === 'EAUTH' || message.includes('BadCredentials')) {
    return (
      'Gmail rejected SMTP login (EAUTH). Fix: create a new App Password at https://myaccount.google.com/apppasswords ' +
      '(16 chars, 2-Step Verification required). Or set SMTP_MODE=ethereal in .env for local testing without Gmail.'
    );
  }

  if (code === 'ESOCKET' || code === 'ETIMEDOUT' || code === 'ECONNECTION') {
    return `Cannot reach SMTP server (${code}): ${message}`;
  }

  return message;
};

const logSentMessage = (info: SentMessageInfo, verifyUrl: string): void => {
  if (!env.isDevelopment) return;

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log('[DEV] Email preview (Ethereal):', preview);
  }
  console.log(`[DEV] Verification link: ${verifyUrl}`);
};

export const verifySmtpConnection = async (): Promise<void> => {
  const transport = await getTransporter();
  await transport.verify();
};

interface VerificationEmailParams {
  to: string;
  name: string;
  token: string;
}

const buildVerificationEmail = (
  name: string,
  verifyUrl: string,
): { subject: string; text: string; html: string } => {
  const subject = 'Verify your Smart Job Portal account';

  const text = `Hi ${name},

Thanks for signing up for Smart Job Portal.

Please verify your email by opening this link (valid for 24 hours):
${verifyUrl}

If you did not create an account, you can ignore this email.

— Smart Job Portal`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #0f172a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 20px; margin-bottom: 16px;">Verify your email</h1>
  <p>Hi ${name},</p>
  <p>Thanks for signing up for <strong>Smart Job Portal</strong>. Click the button below to verify your email address. This link expires in 24 hours.</p>
  <p style="margin: 28px 0;">
    <a href="${verifyUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">Verify email</a>
  </p>
  <p style="font-size: 14px; color: #64748b;">Or copy this link into your browser:<br /><a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a></p>
  <p style="font-size: 14px; color: #64748b; margin-top: 32px;">If you did not create an account, you can safely ignore this email.</p>
</body>
</html>`;

  return { subject, text, html };
};

export const sendVerificationEmail = async ({
  to,
  name,
  token,
}: VerificationEmailParams): Promise<void> => {
  const transport = await getTransporter();
  const verifyUrl = `${env.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const { subject, text, html } = buildVerificationEmail(name, verifyUrl);

  const fromAddress =
    env.smtpMode === 'ethereal'
      ? `"${env.smtp.fromName}" <noreply@ethereal.local>`
      : `"${env.smtp.fromName}" <${env.smtp.from}>`;

  try {
    const info = await transport.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    logSentMessage(info, verifyUrl);

    if (env.isDevelopment && env.smtpMode !== 'ethereal') {
      console.log(`[DEV] Verification email sent to ${to}`);
    }
  } catch (error) {
    const detail = formatSmtpError(error);
    console.error('Failed to send verification email:', detail);
    if (error instanceof Error && 'code' in error) {
      console.error(
        'SMTP error code:',
        (error as Error & { code?: string }).code,
      );
    }

    throw new AppError(
      env.isDevelopment
        ? detail
        : 'Failed to send verification email. Please check SMTP settings and try again.',
      500,
    );
  }
};

export const resetEmailTransporter = (): void => {
  smtpTransporter = null;
  etherealTransporterPromise = null;
};
