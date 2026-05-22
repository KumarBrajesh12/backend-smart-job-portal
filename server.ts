import app from './src/app.js';
import env, { validateEnv } from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';

const startServer = async (): Promise<void> => {
  try {
    validateEnv();
    await connectDB();

    const server = app.listen(env.port, () => {
      console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => {
      shutdown('SIGTERM').catch((shutdownError: Error) => {
        console.error('Shutdown failed:', shutdownError.message);
        process.exit(1);
      });
    });
    process.on('SIGINT', () => {
      shutdown('SIGINT').catch((shutdownError: Error) => {
        console.error('Shutdown failed:', shutdownError.message);
        process.exit(1);
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(message);
  }
};

startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('Failed to start server:', message);
  process.exit(1);
});
