/**
 * Multi-Service Unit Test Parser
 * Dynamically discovers and parses unit tests across all services
 */

import * as fs from 'fs';
import * as path from 'path';

export interface UnitTest {
  id: string;
  description: string;
  file: string;
  suite: string;
  layer: string;
  service: string; // NEW: Service name
}

export interface ServiceTestSummary {
  serviceName: string;
  testCount: number;
  tests: UnitTest[];
}

export class UnitTestParser {
  private rootDir: string;

  constructor(rootDir?: string) {
    // Check if running in Docker (workspace is mounted at /workspace)
    if (!rootDir) {
      if (fs.existsSync('/workspace')) {
        rootDir = '/workspace';
      } else {
        // Use process.cwd() as fallback for better context awareness
        const cwdPath = path.resolve(process.cwd(), '..');
        rootDir = fs.existsSync(cwdPath) ? '..' : '../..';
      }
    }
    this.rootDir = path.resolve(__dirname, rootDir);
  }

  /**
   * Dynamically discover all services in the repository
   */
  discoverServices(): string[] {
    const services: string[] = [];
    
    // Directories to exclude from service discovery
    const excludedDirs = new Set([
      'node_modules', 'coverage', 'dist', 'qa', 
      '.git', 'build', '.idea', '.vscode', 
      'reports', 'logs', 'tmp'
    ]);
    
    try {
      // Check for service directories (e.g., onboarding-service/, identity-service/)
      const entries = fs.readdirSync(this.rootDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && 
            entry.name.endsWith('-service') && 
            !excludedDirs.has(entry.name)) {
          const servicePath = path.join(this.rootDir, entry.name);
          
          // Check if directory has test/unit structure
          const testPath = path.join(servicePath, 'test/unit');
          if (fs.existsSync(testPath)) {
            services.push(entry.name);
          }
        }
      }

      console.log(`🔍 Discovered services: ${services.join(', ')}`);
    } catch (error) {
      console.error(`❌ Error discovering services: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return services;
  }

  /**
   * Parse all unit tests across all services
   */
  async parseAllTests(): Promise<UnitTest[]> {
    const services = this.discoverServices();
    const allTests: UnitTest[] = [];

    for (const service of services) {
      const serviceTests = await this.parseServiceTests(service);
      allTests.push(...serviceTests);
    }

    console.log(`✅ Parsed ${allTests.length} unit tests across ${services.length} service(s)`);
    return allTests;
  }

  /**
   * Parse tests for a specific service
   */
  async parseServiceTests(serviceName: string): Promise<UnitTest[]> {
    // All services are now in service-name/ folders
    const testDir = path.join(this.rootDir, serviceName, 'test/unit');
    
    const serviceTests: UnitTest[] = [];

    if (!fs.existsSync(testDir)) {
      console.log(`   📝 ${serviceName}: 0 tests (no test directory)`);
      return serviceTests;
    }

    // Recursively find all .test.ts files
    const testFiles = this.findTestFiles(testDir);

    // Only parse if files exist
    if (testFiles.length === 0) {
      console.log(`   📝 ${serviceName}: 0 tests (no test files)`);
      return serviceTests;
    }

    for (const file of testFiles) {
      const tests = await this.parseTestFile(file, serviceName);
      serviceTests.push(...tests);
    }

    console.log(`   📝 ${serviceName}: ${serviceTests.length} tests`);
    return serviceTests;
  }

  /**
   * Get test summary by service
   */
  async getTestSummaryByService(): Promise<ServiceTestSummary[]> {
    const services = this.discoverServices();
    const summaries: ServiceTestSummary[] = [];

    for (const service of services) {
      const tests = await this.parseServiceTests(service);
      summaries.push({
        serviceName: service,
        testCount: tests.length,
        tests
      });
    }

    return summaries;
  }

  /**
   * Find all test files recursively
   */
  private findTestFiles(dir: string): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...this.findTestFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Parse a single test file
   */
  private parseTestFile(filePath: string, serviceName: string): UnitTest[] {
    const tests: UnitTest[] = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract relative path and layer info
      const relativePath = path.relative(this.rootDir, filePath);
      const layer = this.extractLayer(relativePath);
      const fileName = path.basename(filePath);

      // Extract suite names from describe blocks (including nested)
      const describeRegex = /(?:describe|describe\.(?:skip|only))\s*\(\s*['"`]([^'"`]+)['"`]/g;
      const suites: string[] = [];
      let suiteMatch;
      
      while ((suiteMatch = describeRegex.exec(content)) !== null) {
        suites.push(suiteMatch[1]);
      }

      // Build suite name from nested describes or fall back to file name
      const suiteName = suites.length > 0 ? suites.join(' > ') : fileName.replace('.test.ts', '');

      // Extract individual test cases (including it.skip and it.only)
      const itRegex = /(?:it|test|it\.(?:skip|only)|test\.(?:skip|only))\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let testMatch;
      let testIndex = 1;

      while ((testMatch = itRegex.exec(content)) !== null) {
        const description = testMatch[1];
        const testId = this.generateTestId(serviceName, fileName, testIndex);
        
        tests.push({
          id: testId,
          description,
          file: relativePath,
          suite: suites[0] || fileName.replace('.test.ts', ''), // Use first describe for consistency
          layer,
          service: serviceName
        });

        testIndex++;
      }
    } catch (error) {
      console.error(`❌ Error parsing test file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return tests;
  }

  /**
   * Extract layer from file path with better precision
   */
  private extractLayer(filePath: string): string {
    // Use path segments to avoid false positives
    const segments = filePath.split(path.sep);
    
    // Look for layer indicators in path segments
    for (const segment of segments) {
      if (segment === 'application') return 'Application';
      if (segment === 'infrastructure') return 'Infrastructure';
      if (segment === 'api') return 'API';
      if (segment === 'domain') return 'Domain';
    }
    
    return 'Unknown';
  }

  /**
   * Generate unique test ID including service name to prevent collisions
   */
  private generateTestId(serviceName: string, fileName: string, index: number): string {
    const serviceSlug = serviceName.replace(/-service$/, '').toLowerCase();
    const baseName = fileName
      .replace('.test.ts', '')
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
    
    return `test_${serviceSlug}_${baseName}_${index}`;
  }

  /**
   * Get tests by description pattern
   */
  findTestsByPattern(tests: UnitTest[], pattern: string): UnitTest[] {
    const regex = new RegExp(pattern, 'i');
    return tests.filter(test => regex.test(test.description));
  }

  /**
   * Get tests by layer
   */
  getTestsByLayer(tests: UnitTest[], layer: string): UnitTest[] {
    return tests.filter(test => test.layer === layer);
  }
}
