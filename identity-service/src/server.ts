/**
 * Identity Service Entry Point
 * Starts the Express server with graceful shutdown
 */
import { createApp } from './app';
import { config } from './config/config';

async function startServer() {
  try {
    const { app, mongoClient } = await createApp();

    const server = app.listen(config.port, () => {
      console.log(`🚀 Identity Service running on port ${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down Identity Service...');
      server.close(async () => {
        await mongoClient.close();
        console.log('✅ Identity Service shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start Identity Service:', error);
    process.exit(1);
  }
}

startServer();
