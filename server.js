import app from './src/app.js';
import env, { validateEnv } from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();

    const server = app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });

    const shutdown = async (signal) => {
      // eslint-disable-next-line no-console
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
