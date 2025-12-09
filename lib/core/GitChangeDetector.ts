/**
 * Git Change Detector
 * Detects API changes by analyzing git diffs
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface APIChange {
  type: 'added' | 'modified' | 'removed';
  endpoint: string;
  method: string;
  file: string;
  lineNumber?: number;
  hasTest: boolean;
  hasScenario: boolean;
  recommendation: string;
  affectedTests?: string[];  // NEW: Tests that may be affected
  changeDetails?: {          // NEW: Details about the change
    linesChanged: number;
    oldCode?: string;
    newCode?: string;
  };
}

export interface GitChangeAnalysis {
  changedFiles: string[];
  apiChanges: APIChange[];
  affectedServices: string[];
  summary: {
    apisAdded: number;
    apisModified: number;
    apisRemoved: number;
    apisWithoutTests: number;
  };
}

export class GitChangeDetector {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async detectChanges(servicePaths: string[]): Promise<GitChangeAnalysis> {
    console.log('\n🔍 Detecting Git changes...');
    
    // Get changed files from git
    const changedFiles = this.getChangedFiles();
    console.log(`  Found ${changedFiles.length} changed files`);

    if (changedFiles.length === 0) {
      return {
        changedFiles: [],
        apiChanges: [],
        affectedServices: [],
        summary: {
          apisAdded: 0,
          apisModified: 0,
          apisRemoved: 0,
          apisWithoutTests: 0
        }
      };
    }

    // Filter to service files (controllers, routes, etc.)
    const serviceFiles = changedFiles.filter(f => 
      this.isServiceFile(f) && servicePaths.some(sp => f.includes(sp))
    );

    console.log(`  ${serviceFiles.length} service files changed`);

    // Detect API changes
    const apiChanges: APIChange[] = [];
    for (const file of serviceFiles) {
      const changes = await this.analyzeFileChanges(file);
      apiChanges.push(...changes);
    }

    // Determine affected services
    const affectedServices = new Set<string>();
    for (const file of serviceFiles) {
      for (const servicePath of servicePaths) {
        if (file.includes(servicePath)) {
          const serviceName = path.basename(servicePath);
          affectedServices.add(serviceName);
        }
      }
    }

    const summary = {
      apisAdded: apiChanges.filter(c => c.type === 'added').length,
      apisModified: apiChanges.filter(c => c.type === 'modified').length,
      apisRemoved: apiChanges.filter(c => c.type === 'removed').length,
      apisWithoutTests: apiChanges.filter(c => c.type === 'added' && !c.hasTest).length
    };

    console.log(`  API Changes: +${summary.apisAdded} ~${summary.apisModified} -${summary.apisRemoved}`);
    if (summary.apisWithoutTests > 0) {
      console.log(`  ⚠️  ${summary.apisWithoutTests} new APIs without tests!`);
    }

    return {
      changedFiles,
      apiChanges,
      affectedServices: Array.from(affectedServices),
      summary
    };
  }

  private getChangedFiles(): string[] {
    try {
      // Try to get staged files first
      let output = execSync('git diff --cached --name-only', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      }).trim();

      // If no staged files, check working directory
      if (!output) {
        output = execSync('git diff --name-only', {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        }).trim();
      }

      // If still nothing, compare with HEAD
      if (!output) {
        output = execSync('git diff HEAD --name-only', {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        }).trim();
      }

      return output ? output.split('\n').filter(f => f.trim()) : [];
    } catch (error) {
      console.warn('  ⚠️  Git detection failed (not a git repo?), analyzing all files');
      return [];
    }
  }

  private isServiceFile(file: string): boolean {
    const lowerFile = file.toLowerCase();
    return (
      lowerFile.includes('controller') ||
      lowerFile.includes('route') ||
      lowerFile.includes('api') ||
      lowerFile.includes('handler') ||
      lowerFile.includes('endpoint')
    ) && !lowerFile.includes('test');
  }

  private async analyzeFileChanges(file: string): Promise<APIChange[]> {
    const changes: APIChange[] = [];
    const fullPath = path.join(this.projectRoot, file);

    // Check if file exists (not deleted)
    if (!fs.existsSync(fullPath)) {
      // File was deleted - try to extract APIs from git history
      const deletedAPIs = this.extractAPIsFromDeletedFile(file);
      return deletedAPIs.map(api => ({
        type: 'removed',
        endpoint: api.endpoint,
        method: api.method,
        file,
        hasTest: false,
        hasScenario: false,
        recommendation: 'Remove corresponding tests and scenarios'
      }));
    }

    // Get the git diff for this file
    try {
      const diff = execSync(`git diff HEAD -- "${file}"`, {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      });

      // Parse diff for API changes
      const addedAPIs = this.extractAPIsFromDiff(diff, '+');
      const removedAPIs = this.extractAPIsFromDiff(diff, '-');

      // Read current file content
      const content = fs.readFileSync(fullPath, 'utf-8');

      for (const api of addedAPIs) {
        changes.push({
          type: 'added',
          endpoint: api.endpoint,
          method: api.method,
          file,
          lineNumber: api.lineNumber,
          hasTest: false, // Will be determined by caller
          hasScenario: false, // Will be determined by caller
          recommendation: 'Create unit test and add scenario to baseline'
        });
      }

      for (const api of removedAPIs) {
        changes.push({
          type: 'removed',
          endpoint: api.endpoint,
          method: api.method,
          file,
          hasTest: false,
          hasScenario: false,
          recommendation: 'Remove corresponding tests and scenarios'
        });
      }
    } catch (error) {
      // File might be new or git command failed
      const content = fs.readFileSync(fullPath, 'utf-8');
      const apis = this.extractAPIsFromContent(content);
      
      for (const api of apis) {
        changes.push({
          type: 'added',
          endpoint: api.endpoint,
          method: api.method,
          file,
          lineNumber: api.lineNumber,
          hasTest: false,
          hasScenario: false,
          recommendation: 'New file - ensure all APIs have tests and scenarios'
        });
      }
    }

    return changes;
  }

  private extractAPIsFromDiff(diff: string, prefix: '+' | '-'): Array<{endpoint: string; method: string; lineNumber: number}> {
    const apis: Array<{endpoint: string; method: string; lineNumber: number}> = [];
    const lines = diff.split('\n');
    let currentLine = 0;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // Extract line number from diff header
        const match = line.match(/@@ -\d+,?\d* \+(\d+)/);
        if (match) {
          currentLine = parseInt(match[1]);
        }
        continue;
      }

      if (line.startsWith(prefix) && !line.startsWith(prefix + prefix)) {
        const api = this.extractAPIFromLine(line.substring(1));
        if (api) {
          apis.push({ ...api, lineNumber: currentLine });
        }
      }

      if (!line.startsWith('-')) {
        currentLine++;
      }
    }

    return apis;
  }

  private extractAPIsFromContent(content: string): Array<{endpoint: string; method: string; lineNumber: number}> {
    const apis: Array<{endpoint: string; method: string; lineNumber: number}> = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const api = this.extractAPIFromLine(line);
      if (api) {
        apis.push({ ...api, lineNumber: index + 1 });
      }
    });

    return apis;
  }

  private extractAPIFromLine(line: string): {endpoint: string; method: string} | null {
    // Java Spring annotations
    const springPatterns = [
      /@GetMapping\s*\(\s*["']([^"']+)["']/,
      /@PostMapping\s*\(\s*["']([^"']+)["']/,
      /@PutMapping\s*\(\s*["']([^"']+)["']/,
      /@DeleteMapping\s*\(\s*["']([^"']+)["']/,
      /@PatchMapping\s*\(\s*["']([^"']+)["']/,
      /@RequestMapping\s*\(\s*value\s*=\s*["']([^"']+)["']/
    ];

    const methodMap: {[key: string]: string} = {
      'GetMapping': 'GET',
      'PostMapping': 'POST',
      'PutMapping': 'PUT',
      'DeleteMapping': 'DELETE',
      'PatchMapping': 'PATCH',
      'RequestMapping': 'GET'
    };

    for (const pattern of springPatterns) {
      const match = line.match(pattern);
      if (match) {
        const annotationType = pattern.source.match(/@(\w+Mapping)/)?.[1];
        const method = annotationType ? methodMap[annotationType] : 'GET';
        return {
          endpoint: match[1],
          method
        };
      }
    }

    // Express.js routes
    const expressPatterns = [
      /router\.get\s*\(\s*["']([^"']+)["']/,
      /router\.post\s*\(\s*["']([^"']+)["']/,
      /router\.put\s*\(\s*["']([^"']+)["']/,
      /router\.delete\s*\(\s*["']([^"']+)["']/,
      /router\.patch\s*\(\s*["']([^"']+)["']/,
      /app\.get\s*\(\s*["']([^"']+)["']/,
      /app\.post\s*\(\s*["']([^"']+)["']/,
      /app\.put\s*\(\s*["']([^"']+)["']/,
      /app\.delete\s*\(\s*["']([^"']+)["']/,
      /app\.patch\s*\(\s*["']([^"']+)["']/
    ];

    for (const pattern of expressPatterns) {
      const match = line.match(pattern);
      if (match) {
        const methodMatch = pattern.source.match(/\.(get|post|put|delete|patch)/);
        const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';
        return {
          endpoint: match[1],
          method
        };
      }
    }

    return null;
  }

  private extractAPIsFromDeletedFile(file: string): Array<{endpoint: string; method: string}> {
    try {
      // Get the file content from the last commit
      const content = execSync(`git show HEAD:"${file}"`, {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      });

      return this.extractAPIsFromContent(content);
    } catch (error) {
      return [];
    }
  }

  /**
   * Find unit tests that may be affected by changes to a file
   */
  findAffectedTests(changedFile: string, servicePath: string): string[] {
    const affectedTests: string[] = [];
    
    // Derive test file name from source file
    // e.g., CustomerController.java -> CustomerControllerTest.java
    const fileName = path.basename(changedFile, path.extname(changedFile));
    const testFileName = `${fileName}Test`;
    
    // Search for test files
    try {
      const testDir = path.join(this.projectRoot, servicePath, 'src/test');
      if (fs.existsSync(testDir)) {
        const testFiles = this.findFilesRecursive(testDir, testFileName);
        
        for (const testFile of testFiles) {
          const tests = this.extractTestNamesFromFile(testFile);
          affectedTests.push(...tests);
        }
      }
    } catch (error) {
      // Test directory doesn't exist or other error
    }
    
    return affectedTests;
  }

  /**
   * Recursively find files matching a pattern
   */
  private findFilesRecursive(dir: string, pattern: string): string[] {
    const results: string[] = [];
    
    if (!fs.existsSync(dir)) {
      return results;
    }
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        results.push(...this.findFilesRecursive(filePath, pattern));
      } else if (file.includes(pattern)) {
        results.push(filePath);
      }
    }
    
    return results;
  }

  /**
   * Extract test method names from a test file
   */
  private extractTestNamesFromFile(filePath: string): string[] {
    const testNames: string[] = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        // Java test methods: @Test ... public void testName()
        const javaMatch = line.match(/@Test.*?(?:public|private)\s+void\s+(\w+)\s*\(/);
        if (javaMatch) {
          testNames.push(javaMatch[1]);
          continue;
        }
        
        // TypeScript/JavaScript test methods: it('test name', ...)
        const jsMatch = line.match(/(?:it|test)\s*\(\s*['"]([^'"]+)['"]/);
        if (jsMatch) {
          testNames.push(jsMatch[1]);
          continue;
        }
      }
    } catch (error) {
      // File read error
    }
    
    return testNames;
  }

  /**
   * Get change details for a file (lines changed, old vs new code)
   */
  getChangeDetails(file: string): { linesChanged: number; oldCode?: string; newCode?: string } | null {
    try {
      const diff = execSync(`git diff HEAD -- "${file}"`, {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      });

      if (!diff) {
        return null;
      }

      const lines = diff.split('\n');
      let linesChanged = 0;
      let oldCode = '';
      let newCode = '';

      for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          linesChanged++;
          newCode += line.substring(1) + '\n';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          linesChanged++;
          oldCode += line.substring(1) + '\n';
        }
      }

      return {
        linesChanged,
        oldCode: oldCode.trim() || undefined,
        newCode: newCode.trim() || undefined
      };
    } catch (error) {
      return null;
    }
  }
}
