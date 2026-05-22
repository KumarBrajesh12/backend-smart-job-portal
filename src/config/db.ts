import mongoose from 'mongoose';
import env from './env.js';
import type { DbConnectionStatus, DbStatus } from '../types/index.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectionStates: Record<number, DbConnectionStatus> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const getDbStatus = (): DbStatus => {
  const state = mongoose.connection.readyState;
  return {
    status: connectionStates[state] ?? 'unknown',
    isConnected: state === 1,
  };
};

const connectWithRetry = async (retriesLeft = MAX_RETRIES): Promise<void> => {
  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`MongoDB connection failed: ${message}`);

    if (retriesLeft > 0) {
      console.log(
        `Retrying in ${RETRY_DELAY_MS / 1000}s... (${retriesLeft} attempts left)`,
      );
      await new Promise<void>((resolve) => {
        setTimeout(resolve, RETRY_DELAY_MS);
      });
      await connectWithRetry(retriesLeft - 1);
      return;
    }

    throw new Error(`MongoDB connection failed after ${MAX_RETRIES} attempts`);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err: Error) => {
  console.error('MongoDB connection error:', err.message);
});

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  await connectWithRetry();
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
