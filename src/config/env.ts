import dotenv from 'dotenv';
import type { EnvConfig, SmtpMode } from '../types/index.js';

dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'] as const;

/** Trim whitespace and optional surrounding quotes from .env values */
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

/** Gmail app passwords are 16 chars; Google often displays them as "xxxx xxxx xxxx xxxx" */
const cleanSmtpPassword = (value: string | undefined): string =>
  cleanEnv(value).replace(/\s/g, '');

export const validateEnv = (): void => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
};

const smtpUser = cleanEnv(process.env.SMTP_USER);
const smtpPass = cleanSmtpPassword(process.env.SMTP_PASS);
const smtpHost = cleanEnv(process.env.SMTP_HOST);
const smtpPort = Number(process.env.SMTP_PORT) || 587;

const rawSmtpMode = cleanEnv(process.env.SMTP_MODE).toLowerCase();
const smtpMode: SmtpMode =
  rawSmtpMode === 'ethereal' ||
  rawSmtpMode === 'smtp' ||
  rawSmtpMode === 'gmail'
    ? rawSmtpMode
    : 'gmail';

const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  elasticsearchNode: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  frontendUrl:
    cleanEnv(process.env.FRONTEND_URL) ||
    cleanEnv(process.env.CORS_ORIGIN) ||
    'http://localhost:3000',
  smtpMode,
  smtp: {
    host: smtpHost,
    port: smtpPort,
    secure:
      process.env.SMTP_SECURE === 'true' ||
      (process.env.SMTP_SECURE !== 'false' && smtpPort === 465),
    user: smtpUser,
    pass: smtpPass,
    from: cleanEnv(process.env.SMTP_FROM) || smtpUser,
    fromName: cleanEnv(process.env.SMTP_FROM_NAME) || 'Smart Job Portal',
    service: cleanEnv(process.env.SMTP_SERVICE),
  },
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export const isSmtpConfigured = (): boolean => {
  if (env.smtpMode === 'ethereal') {
    return env.isDevelopment;
  }
  return Boolean(
    env.smtp.host && env.smtp.user && env.smtp.pass && env.smtp.from,
  );
};

export default env;
