/**
 * Git API Change Detector
 * Compares HEAD vs HEAD-1 to detect API deletions, even when tests are also removed
 */

import { execSync } from 'child_process';
import * as path from 'path';
import { ServiceConfig, APIChange, Scenario, UnitTest } from '../types';

export interface GitAPISnapshot {
  commit: string;
  timestamp: Date;
  apis: APIEndpoint[];
  tests: TestSnapshot[];
}

export interface APIEndpoint {
  path: string;
  method: string;
  controller: string;
  lineNumber: number;
}

export interface TestSnapshot {
  name: string;
  file: string;
  relatedAPI: string;
}

export class GitAPIChangeDetector {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Detect API changes by comparing HEAD with HEAD-1
   */
  async detectChanges(service: ServiceConfig): Promise<APIChange[]> {
    const changes: APIChange[] = [];

    try {
      // Get current APIs (HEAD)
      const currentAPIs = await this.extractAPIsFromCommit('HEAD', service);
      
      // Get previous APIs (HEAD-1)
      const previousAPIs = await this.extractAPIsFromCommit('HEAD~1', service);

      // Compare and detect removals
      const removedAPIs = this.findRemovedAPIs(previousAPIs, currentAPIs);
      
      if (removedAPIs.length > 0) {
        // Check if tests were also removed
        const currentTests = await this.extractTestsFromCommit('HEAD', service);
        const previousTests = await this.extractTestsFromCommit('HEAD~1', service);
        
        for (const removedAPI of removedAPIs) {
          const relatedTests = previousTests.filter(t => 
            this.isTestRelatedToAPI(t, removedAPI)
          );
          
          const testsAlsoRemoved = relatedTests.filter(prevTest =>
            !currentTests.some(currTest => currTest.name === prevTest.name)
          );

          changes.push({
            type: testsAlsoRemoved.length > 0 ? 'API and Test Deleted Together' : 'API Removed',
            apiEndpoint: removedAPI.path,
            httpMethod: removedAPI.method,
            affectedScenarios: [],
            affectedTests: testsAlsoRemoved.map(t => ({
              id: t.name,
              name: t.name,
              file: t.file,
              description: `Test for ${removedAPI.path}`,
              framework: service.testFramework,
              language: service.language
            })),
            detectedAt: new Date(),
            impact: testsAlsoRemoved.length > 0 
              ? `CRITICAL: API ${removedAPI.path} and ${testsAlsoRemoved.length} related test(s) were deleted together. This change is untracked!`
              : `API ${removedAPI.path} was removed but tests remain (orphan tests detected)`,
            recommendations: testsAlsoRemoved.length > 0
              ? [
                  '⚠️ CRITICAL: API and tests deleted simultaneously',
                  'This deletion bypassed normal coverage tracking',
                  'Verify if this removal was intentional',
                  'Update scenarios to reflect API removal',
                  'Document reason for deletion in commit message'
                ]
              : [
                  'Review and remove orphaned tests',
                  'Update scenarios if API was intentionally removed'
                ]
          });
        }
      }

      // Detect new APIs without tests
      const newAPIs = this.findNewAPIs(previousAPIs, currentAPIs);
      
      if (newAPIs.length > 0) {
        const currentTests = await this.extractTestsFromCommit('HEAD', service);
        
        for (const newAPI of newAPIs) {
          const hasTest = currentTests.some(t => this.isTestRelatedToAPI(t, newAPI));
          
          if (!hasTest) {
            changes.push({
              type: 'API Added Without Test',
              apiEndpoint: newAPI.path,
              httpMethod: newAPI.method,
              affectedScenarios: [],
              affectedTests: [],
              detectedAt: new Date(),
              impact: `New API ${newAPI.path} added without corresponding unit test`,
              recommendations: [
                'Create unit test for this new API',
                'Add scenario to document expected behavior',
                'Ensure proper test coverage before merging'
              ]
            });
          }
        }
      }

    } catch (error) {
      console.warn(`Git API change detection skipped: ${error instanceof Error ? error.message : String(error)}`);
    }

    return changes;
  }

  /**
   * Extract API endpoints from a specific commit
   */
  private async extractAPIsFromCommit(commit: string, service: ServiceConfig): Promise<APIEndpoint[]> {
    const apis: APIEndpoint[] = [];

    try {
      // Get list of controller files
      const controllerPath = path.join(service.path, 'src/main/java');
      const gitCommand = `git show ${commit}:${controllerPath}`;
      
      // Find controller files
      const files = this.findControllerFiles(commit, service);
      
      for (const file of files) {
        const content = this.getFileContent(commit, file);
        const extractedAPIs = this.parseAPIsFromController(content, file);
        apis.push(...extractedAPIs);
      }
    } catch (error) {
      // Commit might not exist (e.g., initial commit)
      console.warn(`Cannot extract APIs from ${commit}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return apis;
  }

  /**
   * Extract tests from a specific commit
   */
  private async extractTestsFromCommit(commit: string, service: ServiceConfig): Promise<TestSnapshot[]> {
    const tests: TestSnapshot[] = [];

    try {
      const testFiles = this.findTestFiles(commit, service);
      
      for (const file of testFiles) {
        const content = this.getFileContent(commit, file);
        const extractedTests = this.parseTestsFromFile(content, file);
        tests.push(...extractedTests);
      }
    } catch (error) {
      console.warn(`Cannot extract tests from ${commit}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return tests;
  }

  /**
   * Find controller files in a commit
   */
  private findControllerFiles(commit: string, service: ServiceConfig): string[] {
    try {
      const controllerPath = path.join(service.path, 'src/main/java');
      const command = `git ls-tree -r --name-only ${commit} ${controllerPath}`;
      const output = execSync(command, { cwd: this.projectRoot, encoding: 'utf-8' });
      
      return output
        .split('\n')
        .filter(f => f.includes('controller') && f.endsWith('.java'))
        .filter(f => f.length > 0);
    } catch {
      return [];
    }
  }

  /**
   * Find test files in a commit
   */
  private findTestFiles(commit: string, service: ServiceConfig): string[] {
    try {
      const testPath = path.join(service.path, service.testDirectory);
      const command = `git ls-tree -r --name-only ${commit} ${testPath}`;
      const output = execSync(command, { cwd: this.projectRoot, encoding: 'utf-8' });
      
      return output
        .split('\n')
        .filter(f => f.endsWith('Test.java'))
        .filter(f => f.length > 0);
    } catch {
      return [];
    }
  }

  /**
   * Get file content from a specific commit
   */
  private getFileContent(commit: string, filePath: string): string {
    try {
      const command = `git show ${commit}:${filePath}`;
      return execSync(command, { cwd: this.projectRoot, encoding: 'utf-8' });
    } catch {
      return '';
    }
  }

  /**
   * Parse API endpoints from controller content
   */
  private parseAPIsFromController(content: string, file: string): APIEndpoint[] {
    const apis: APIEndpoint[] = [];
    const lines = content.split('\n');

    // Simple regex patterns for Spring Boot controllers
    const mappingPatterns = [
      /@(Get|Post|Put|Delete|Patch)Mapping\s*\(\s*["']([^"']+)["']/g,
      /@RequestMapping\s*\(\s*value\s*=\s*["']([^"']+)["']/g
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of mappingPatterns) {
        const matches = Array.from(line.matchAll(pattern));
        for (const match of matches) {
          const method = match[1] || 'GET';
          const path = match[2] || match[1];
          
          apis.push({
            path,
            method: method.toUpperCase(),
            controller: file,
            lineNumber: i + 1
          });
        }
      }
    }

    return apis;
  }

  /**
   * Parse test methods from test file content
   */
  private parseTestsFromFile(content: string, file: string): TestSnapshot[] {
    const tests: TestSnapshot[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match @Test methods
      if (line.includes('@Test')) {
        // Get next line for method name
        if (i + 1 < lines.length) {
          const methodLine = lines[i + 1];
          const methodMatch = methodLine.match(/public\s+void\s+(\w+)\s*\(/);
          
          if (methodMatch) {
            tests.push({
              name: methodMatch[1],
              file,
              relatedAPI: this.inferAPIFromTestName(methodMatch[1])
            });
          }
        }
      }
    }

    return tests;
  }

  /**
   * Infer API endpoint from test name
   */
  private inferAPIFromTestName(testName: string): string {
    const lower = testName.toLowerCase();
    
    if (lower.includes('register')) return '/register';
    if (lower.includes('login')) return '/login';
    if (lower.includes('verify') && lower.includes('otp')) return '/verify-otp';
    if (lower.includes('create')) return '/create';
    if (lower.includes('update')) return '/update';
    if (lower.includes('delete')) return '/delete';
    if (lower.includes('get')) return '/get';
    
    return '/unknown';
  }

  /**
   * Check if test is related to an API
   */
  private isTestRelatedToAPI(test: TestSnapshot, api: APIEndpoint): boolean {
    const testName = test.name.toLowerCase();
    const apiPath = api.path.toLowerCase().replace(/\//g, '');
    
    return testName.includes(apiPath) || test.relatedAPI === api.path;
  }

  /**
   * Find APIs that were removed
   */
  private findRemovedAPIs(previous: APIEndpoint[], current: APIEndpoint[]): APIEndpoint[] {
    return previous.filter(prevAPI => 
      !current.some(currAPI => 
        currAPI.path === prevAPI.path && currAPI.method === prevAPI.method
      )
    );
  }

  /**
   * Find APIs that were added
   */
  private findNewAPIs(previous: APIEndpoint[], current: APIEndpoint[]): APIEndpoint[] {
    return current.filter(currAPI => 
      !previous.some(prevAPI => 
        prevAPI.path === currAPI.path && prevAPI.method === currAPI.method
      )
    );
  }
}
