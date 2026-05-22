/**
 * Test email delivery from .env
 * Run: npm run test:smtp
 */
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import type { NodemailerSmtpOptions } from '../src/types/nodemailer-smtp.js';

dotenv.config();

const cleanEnv = (value: string | undefined): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const smtpMode = cleanEnv(process.env.SMTP_MODE).toLowerCase() || 'gmail';
const user = cleanEnv(process.env.SMTP_USER);
const pass = cleanEnv(process.env.SMTP_PASS).replace(/\s/g, '');

const tryVerify = async (
  label: string,
  options: NodemailerSmtpOptions,
): Promise<boolean> => {
  const transport = nodemailer.createTransport(
    options as Parameters<typeof nodemailer.createTransport>[0],
  );
  try {
    await transport.verify();
    console.log(`✓ ${label}: OK`);
    return true;
  } catch (err) {
    const e = err as Error & { code?: string };
    console.log(
      `✗ ${label}: ${e.code ?? 'ERROR'} — ${e.message.split('\n')[0]}`,
    );
    return false;
  }
};

const run = async (): Promise<void> => {
  console.log(`SMTP_MODE=${smtpMode}\n`);

  if (smtpMode === 'ethereal') {
    const account = await nodemailer.createTestAccount();
    const ok = await tryVerify('Ethereal (auto)', {
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
    if (ok) {
      console.log('\nSet SMTP_MODE=ethereal in .env and restart the API.');
      console.log(
        'After register, open the preview URL printed in the server log.',
      );
    }
    process.exit(ok ? 0 : 1);
    return;
  }

  if (!user || !pass) {
    console.error('Missing SMTP_USER or SMTP_PASS in .env');
    process.exit(1);
  }

  console.log(`Testing as ${user} (password length: ${pass.length})\n`);

  const attempts: Array<[string, NodemailerSmtpOptions]> = [
    ['Gmail service preset', { service: 'gmail', auth: { user, pass } }],
    [
      'smtp.gmail.com:587 STARTTLS',
      {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user, pass },
      },
    ],
    [
      'smtp.gmail.com:465 SSL',
      {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass },
      },
    ],
  ];

  const results = await Promise.all(
    attempts.map(([label, opts]) => tryVerify(label, opts)),
  );
  const anyOk = results.some(Boolean);

  console.log('\n---');
  if (anyOk) {
    console.log(
      'At least one config works. Use matching SMTP_PORT / SMTP_SECURE in .env',
    );
    process.exit(0);
  }

  console.log(
    'All Gmail attempts failed (EAUTH = wrong App Password or account restriction).',
  );
  console.log('\nOptions:');
  console.log(
    '  1) New App Password: https://myaccount.google.com/apppasswords',
  );
  console.log('     - 2-Step Verification ON');
  console.log('     - Delete old app passwords, create new one');
  console.log('     - SMTP_USER must be the same @gmail.com account');
  console.log('  2) Local dev without Gmail — add to .env:');
  console.log('     SMTP_MODE=ethereal');
  console.log(
    '     Then npm run dev and use the preview URL in the terminal after register.',
  );
  console.log('  3) Use Brevo/Mailtrap SMTP instead of Gmail (see README)');
  process.exit(1);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
