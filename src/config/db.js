import mongoose from 'mongoose';
import env from './env.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export const getDbStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    status: states[state] || 'unknown',
    isConnected: state === 1,
  };
};

const connectWithRetry = async (retriesLeft = MAX_RETRIES) => {
  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    // eslint-disable-next-line no-console
    console.log('MongoDB connected successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`MongoDB connection failed: ${error.message}`);

    if (retriesLeft > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `Retrying in ${RETRY_DELAY_MS / 1000}s... (${retriesLeft} attempts left)`,
      );
      await new Promise((resolve) => {
        setTimeout(resolve, RETRY_DELAY_MS);
      });
      return connectWithRetry(retriesLeft - 1);
    }

    throw new Error(`MongoDB connection failed after ${MAX_RETRIES} attempts`);
  }
};

mongoose.connection.on('disconnected', () => {
  // eslint-disable-next-line no-console
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('MongoDB connection error:', err.message);
});

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  await connectWithRetry();
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
