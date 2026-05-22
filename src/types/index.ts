export interface EnvConfig {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  elasticsearchNode: string;
  corsOrigin: string;
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
  data: T;
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
