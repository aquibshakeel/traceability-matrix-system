/**
 * Service Manager - Handles service lifecycle
 * 
 * - Check if service is running
 * - Start service if needed
 * - Health check monitoring
 * - Stop service
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as http from 'http';
import * as https from 'https';

const execAsync = promisify(exec);

export interface ServiceConfig {
  name: string;
  startCommand?: string;
  stopCommand?: string;
  healthCheckUrl?: string;
  healthCheckTimeout?: number;
}

export class ServiceManager {
  private runningServices: Set<string> = new Set();

  /**
   * Ensure service is running
   */
  async ensureServiceRunning(service: ServiceConfig): Promise<boolean> {
    console.log(`\n🔄 Checking service: ${service.name}`);

    // If no health check URL, assume service is managed externally
    if (!service.healthCheckUrl) {
      console.log(`   ℹ️  No health check configured - assuming service is running`);
      return true;
    }

    // Check if already running
    if (await this.isHealthy(service.healthCheckUrl)) {
      console.log(`   ✅ Service is already running`);
      this.runningServices.add(service.name);
      return true;
    }

    // Need to start service
    if (service.startCommand) {
      console.log(`   🚀 Starting service...`);
      try {
        await this.startService(service);
        this.runningServices.add(service.name);
        return true;
      } catch (error) {
        console.error(`   ❌ Failed to start service: ${error}`);
        return false;
      }
    } else {
      console.log(`   ⚠️  Service not running and no start command configured`);
      return false;
    }
  }

  /**
   * Start a service
   */
  private async startService(service: ServiceConfig): Promise<void> {
    if (!service.startCommand) {
      throw new Error('No start command configured');
    }

    // Execute start command in background
    const { stdout, stderr } = await execAsync(service.startCommand + ' &');
    
    if (stderr && !stderr.includes('warning')) {
      console.log(`   ⚠️  Start command warnings: ${stderr}`);
    }

    // Wait for health check
    const timeout = service.healthCheckTimeout || 30000; // Default 30 seconds
    const startTime = Date.now();

    console.log(`   ⏳ Waiting for service to be healthy (timeout: ${timeout}ms)...`);

    while (Date.now() - startTime < timeout) {
      if (service.healthCheckUrl && await this.isHealthy(service.healthCheckUrl)) {
        console.log(`   ✅ Service is healthy`);
        return;
      }
      // Wait 2 seconds before next check
      await this.sleep(2000);
    }

    throw new Error(`Service failed to become healthy within ${timeout}ms`);
  }

  /**
   * Check if service is healthy
   */
  private async isHealthy(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const request = protocol.get(url, (res) => {
        resolve(res.statusCode === 200);
      });

      request.on('error', () => {
        resolve(false);
      });

      request.setTimeout(5000, () => {
        request.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Stop service
   */
  async stopService(service: ServiceConfig): Promise<void> {
    if (!this.runningServices.has(service.name)) {
      return;
    }

    if (service.stopCommand) {
      console.log(`\n🛑 Stopping service: ${service.name}`);
      try {
        await execAsync(service.stopCommand);
        console.log(`   ✅ Service stopped`);
      } catch (error) {
        console.log(`   ⚠️  Failed to stop service: ${error}`);
      }
    }

    this.runningServices.delete(service.name);
  }

  /**
   * Stop all running services
   */
  async stopAll(services: ServiceConfig[]): Promise<void> {
    for (const service of services) {
      await this.stopService(service);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
