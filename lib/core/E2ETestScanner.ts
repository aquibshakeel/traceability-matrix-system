/**
 * E2E Test Scanner
 * Scans for E2E test files and methods in the service test directories
 */

import * as fs from 'fs';
import * as path from 'path';
import { E2ETestFile, E2ETestMethod, E2ETestReference, SupportedLanguage } from '../types';

export class E2ETestScanner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Scan for E2E test files in a service
   */
  async scanE2ETests(
    servicePath: string,
    serviceName: string,
    e2eTestRefs: E2ETestReference[]
  ): Promise<E2ETestFile[]> {
    if (!e2eTestRefs || e2eTestRefs.length === 0) {
      return [];
    }

    const results: E2ETestFile[] = [];

    for (const ref of e2eTestRefs) {
      const testFile = await this.findE2ETestFile(servicePath, ref.file);
      
      if (testFile) {
        // Parse the test file to verify methods exist
        const methods = await this.extractE2ETestMethods(testFile, ref.methods);
        
        results.push({
          file: ref.file,
          filePath: testFile,
          methods,
          exists: true,
          language: this.detectLanguage(testFile)
        });
      } else {
        // File not found
        results.push({
          file: ref.file,
          filePath: '',
          methods: ref.methods.map(m => ({ name: m })),
          exists: false,
          language: 'java' // default assumption
        });
      }
    }

    return results;
  }

  /**
   * Find E2E test file in service directory
   * Searches in multiple common locations
   */
  private async findE2ETestFile(servicePath: string, fileName: string): Promise<string | null> {
    const searchPaths = [
      // E2E test directories
      path.join(servicePath, 'src/test/java'),
      path.join(servicePath, 'src/test/kotlin'),
      path.join(servicePath, 'src/e2e/java'),
      path.join(servicePath, 'src/e2e/kotlin'),
      path.join(servicePath, 'e2e'),
      path.join(servicePath, 'test/e2e'),
      // Integration test directories
      path.join(servicePath, 'src/integration'),
      path.join(servicePath, 'src/test/integration'),
      // Journey test directories
      path.join(servicePath, 'src/test/journey'),
      path.join(servicePath, 'test/journey')
    ];

    for (const searchPath of searchPaths) {
      const filePath = await this.searchForFile(searchPath, fileName);
      if (filePath) {
        return filePath;
      }
    }

    return null;
  }

  /**
   * Recursively search for a file in a directory
   */
  private async searchForFile(dir: string, fileName: string): Promise<string | null> {
    if (!fs.existsSync(dir)) {
      return null;
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively search subdirectories
          const found = await this.searchForFile(fullPath, fileName);
          if (found) {
            return found;
          }
        } else if (entry.isFile() && entry.name === fileName) {
          return fullPath;
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }

    return null;
  }

  /**
   * Extract E2E test methods from a file
   */
  private async extractE2ETestMethods(
    filePath: string,
    expectedMethods: string[]
  ): Promise<E2ETestMethod[]> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const language = this.detectLanguage(filePath);

      return expectedMethods.map(methodName => {
        const method: E2ETestMethod = { name: methodName };

        // Try to find the method in the file
        if (language === 'java' || language === 'kotlin') {
          // Match Java/Kotlin test methods
          // Pattern: @Test (or other annotations) followed by method declaration
          const methodPattern = new RegExp(
            `(@\\w+\\s+)*\\s*(public|private|protected)?\\s+(void|\\w+)\\s+${methodName}\\s*\\(`,
            'gm'
          );
          const match = methodPattern.exec(content);
          
          if (match) {
            // Find line number
            const beforeMethod = content.substring(0, match.index);
            method.lineNumber = beforeMethod.split('\n').length;
            
            // Try to extract description from comment above method
            const descPattern = new RegExp(
              `\\/\\*\\*([^*]|\\*(?!\\/))*\\*\\/\\s*(@\\w+\\s+)*\\s*(public|private|protected)?\\s+(void|\\w+)\\s+${methodName}`,
              's'
            );
            const descMatch = descPattern.exec(content);
            if (descMatch) {
              const comment = descMatch[1];
              const descLine = comment.match(/^\s*\*\s*(.+)$/m);
              if (descLine) {
                method.description = descLine[1].trim();
              }
            }
          }
        } else if (language === 'typescript' || language === 'javascript') {
          // Match TypeScript/JavaScript test methods
          const methodPattern = new RegExp(
            `(it|test|describe)\\s*\\(['"](.*?)['"]\s*,\\s*(async\\s*)?\\([^)]*\\)\\s*=>\\s*{`,
            'gm'
          );
          let match;
          while ((match = methodPattern.exec(content)) !== null) {
            if (match[2].includes(methodName) || methodName.includes(match[2])) {
              const beforeMethod = content.substring(0, match.index);
              method.lineNumber = beforeMethod.split('\n').length;
              method.description = match[2];
              break;
            }
          }
        }

        return method;
      });
    } catch (error) {
      // Return methods without details if parsing fails
      return expectedMethods.map(name => ({ name }));
    }
  }

  /**
   * Detect programming language from file path
   */
  private detectLanguage(filePath: string): SupportedLanguage {
    const ext = path.extname(filePath).toLowerCase();
    
    const languageMap: Record<string, SupportedLanguage> = {
      '.java': 'java',
      '.kt': 'kotlin',
      '.ts': 'typescript',
      '.js': 'javascript',
      '.py': 'python',
      '.go': 'go',
      '.rb': 'ruby',
      '.cs': 'csharp',
      '.php': 'php',
      '.rs': 'rust'
    };

    return languageMap[ext] || 'java';
  }

  /**
   * Get E2E test statistics
   */
  getE2ETestStats(e2eTests: E2ETestFile[]): {
    totalFiles: number;
    filesFound: number;
    filesNotFound: number;
    totalMethods: number;
    methodsFound: number;
    methodsNotFound: number;
  } {
    const stats = {
      totalFiles: e2eTests.length,
      filesFound: 0,
      filesNotFound: 0,
      totalMethods: 0,
      methodsFound: 0,
      methodsNotFound: 0
    };

    e2eTests.forEach(testFile => {
      if (testFile.exists) {
        stats.filesFound++;
      } else {
        stats.filesNotFound++;
      }

      testFile.methods.forEach(method => {
        stats.totalMethods++;
        if (method.lineNumber) {
          stats.methodsFound++;
        } else {
          stats.methodsNotFound++;
        }
      });
    });

    return stats;
  }

  /**
   * List all E2E test files in a service
   * Useful for discovering E2E tests not yet documented in journeys
   */
  async discoverE2ETests(servicePath: string): Promise<string[]> {
    const e2ePatterns = [
      '*E2ETest.java',
      '*E2ETest.kt',
      '*IntegrationTest.java',
      '*IntegrationTest.kt',
      '*JourneyTest.java',
      '*JourneyTest.kt',
      '*FlowTest.java',
      '*FlowTest.kt',
      '*.e2e.ts',
      '*.e2e.js',
      '*.integration.ts',
      '*.integration.js'
    ];

    const searchPaths = [
      path.join(servicePath, 'src/test/java'),
      path.join(servicePath, 'src/test/kotlin'),
      path.join(servicePath, 'src/e2e'),
      path.join(servicePath, 'test/e2e'),
      path.join(servicePath, 'e2e')
    ];

    const discoveredFiles: string[] = [];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        const files = this.findMatchingFiles(searchPath, e2ePatterns);
        discoveredFiles.push(...files);
      }
    }

    return [...new Set(discoveredFiles)]; // Remove duplicates
  }

  /**
   * Find files matching patterns recursively
   */
  private findMatchingFiles(dir: string, patterns: string[]): string[] {
    const results: string[] = [];

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          results.push(...this.findMatchingFiles(fullPath, patterns));
        } else if (entry.isFile()) {
          // Check if file matches any pattern
          if (patterns.some(pattern => {
            const regex = new RegExp(
              '^' + pattern.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$'
            );
            return regex.test(entry.name);
          })) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }

    return results;
  }
}
