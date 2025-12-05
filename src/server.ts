/**
 * Server Entry Point
 * Starts the application
 */
import { Application } from './app';
import { loadConfig } from './config/config';

async function main(): Promise<void> {
  const config = loadConfig();
  const app = new Application(config);

  // Handle shutdown gracefully
  process.on('SIGTERM', async () => {
    await app.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await app.shutdown();
    process.exit(0);
  });

  try {
    await app.initialize();
    await app.start();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

main();
