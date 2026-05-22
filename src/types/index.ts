export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
  /** e.g. "gmail" — uses nodemailer well-known service preset */
  service: string;
}

export type SmtpMode = 'gmail' | 'smtp' | 'ethereal';

export interface EnvConfig {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  elasticsearchNode: string;
  corsOrigin: string;
  frontendUrl: string;
  smtpMode: SmtpMode;
  smtp: SmtpConfig;
  isDevelopment: boolean;
  isProduction: boolean;
}

export type DbConnectionStatus =
  | 'disconnected'
  | 'connected'
  | 'connecting'
  | 'disconnecting'
  | 'unknown';

export interface DbStatus {
  status: DbConnectionStatus;
  isConnected: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  stack?: string;
}

export interface HealthData {
  status: string;
  uptime: {
    seconds: number;
    human: string;
  };
  database: {
    status: DbConnectionStatus;
    connected: boolean;
  };
  timestamp: string;
}

export type {
  AuthUser,
  JwtTokenPayload,
  LoginResponse,
  PublicUser,
  UserRole,
} from './auth.js';
