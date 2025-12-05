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

  constructor(rootDir: string = '../..') {
    this.rootDir = path.resolve(__dirname, rootDir);
  }

  /**
   * Dynamically discover all services in the repository
   */
  discoverServices(): string[] {
    const services: string[] = [];
    
    // Check for root-level test/unit (main service or monorepo root)
    const rootTestPath = path.join(this.rootDir, 'test/unit');
    if (fs.existsSync(rootTestPath)) {
      // Determine service name from package.json or use a default
      const packageJsonPath = path.join(this.rootDir, 'package.json');
      let serviceName = 'onboarding-service'; // default
      
      if (fs.existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          serviceName = pkg.name || 'onboarding-service';
        } catch (e) {
          // Use default
        }
      }
      
      services.push(serviceName);
    }
    
    // Check for subdirectory services (e.g., identity-service/)
    const entries = fs.readdirSync(this.rootDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'coverage' && entry.name !== 'dist' && entry.name !== 'qa') {
        const servicePath = path.join(this.rootDir, entry.name);
        
        // Check if directory has test/unit structure
        const testPath = path.join(servicePath, 'test/unit');
        if (fs.existsSync(testPath)) {
          services.push(entry.name);
        }
      }
    }

    console.log(`🔍 Discovered services: ${services.join(', ')}`);
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
    // Handle root-level service (onboarding-service)
    let testDir: string;
    if (serviceName === 'onboarding-service') {
      testDir = path.join(this.rootDir, 'test/unit');
    } else {
      testDir = path.join(this.rootDir, serviceName, 'test/unit');
    }
    
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
  private async parseTestFile(filePath: string, serviceName: string): Promise<UnitTest[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const tests: UnitTest[] = [];
    
    // Extract relative path and layer info
    const relativePath = path.relative(this.rootDir, filePath);
    const layer = this.extractLayer(relativePath);
    const fileName = path.basename(filePath);

    // Extract suite name from describe blocks
    const describeRegex = /describe\(['"`]([^'"`]+)['"`]/g;
    let suiteMatch;
    const suites: string[] = [];
    
    while ((suiteMatch = describeRegex.exec(content)) !== null) {
      suites.push(suiteMatch[1]);
    }

    const suiteName = suites[0] || fileName.replace('.test.ts', '');

    // Extract individual test cases
    const itRegex = /it\(['"`]([^'"`]+)['"`]/g;
    let testMatch;
    let testIndex = 1;

    while ((testMatch = itRegex.exec(content)) !== null) {
      const description = testMatch[1];
      const testId = this.generateTestId(fileName, testIndex);
      
      tests.push({
        id: testId,
        description,
        file: relativePath,
        suite: suiteName,
        layer,
        service: serviceName
      });

      testIndex++;
    }

    return tests;
  }

  /**
   * Extract layer from file path
   */
  private extractLayer(filePath: string): string {
    if (filePath.includes('application')) return 'Application';
    if (filePath.includes('infrastructure')) return 'Infrastructure';
    if (filePath.includes('api')) return 'API';
    if (filePath.includes('domain')) return 'Domain';
    return 'Unknown';
  }

  /**
   * Generate unique test ID
   */
  private generateTestId(fileName: string, index: number): string {
    const baseName = fileName
      .replace('.test.ts', '')
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
    
    return `test_${baseName}_${index}`;
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
