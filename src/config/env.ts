import dotenv from 'dotenv';
import type { EnvConfig } from '../types/index.js';

dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'] as const;

export const validateEnv = (): void => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
};

const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  elasticsearchNode: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export default env;
