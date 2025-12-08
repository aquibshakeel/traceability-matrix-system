/**
 * Python Test Parser - Parses PyTest tests
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  TestParser, 
  ServiceConfig, 
  UnitTest, 
  SupportedLanguage, 
  SupportedFramework 
} from '../types';
import { glob } from 'glob';

export class PythonTestParser implements TestParser {
  language: SupportedLanguage = 'python';
  framework: SupportedFramework = 'pytest';

  canParse(language: SupportedLanguage, framework: SupportedFramework): boolean {
    return language === 'python' && framework === 'pytest';
  }

  async parseTests(serviceConfig: ServiceConfig): Promise<UnitTest[]> {
    const testDir = path.join(serviceConfig.path, serviceConfig.testDirectory);
    const pattern = path.join(testDir, '**/*test*.py');
    
    // Find all Python test files
    const testFiles = await glob(pattern, { absolute: true });
    
    const allTests: UnitTest[] = [];
    
    for (const file of testFiles) {
      try {
        const tests = await this.parseTestFile(file, serviceConfig);
        allTests.push(...tests);
      } catch (error) {
        console.warn(`Failed to parse ${file}:`, error);
      }
    }
    
    return allTests;
  }

  private async parseTestFile(filePath: string, serviceConfig: ServiceConfig): Promise<UnitTest[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const tests: UnitTest[] = [];
    const relativePath = path.relative(serviceConfig.path, filePath);
    
    // Parse PyTest functions: def test_something():
    const lines = content.split('\n');
    let testCounter = 1;
    let currentClass = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for test class
      const classMatch = /^class\s+(\w+)/.exec(line.trim());
      if (classMatch) {
        currentClass = classMatch[1];
      }
      
      // Match test function: def test_...
      const testMatch = /^\s*def\s+(test_\w+)\s*\(/.exec(line);
      
      if (testMatch) {
        const functionName = testMatch[1];
        const description = this.functionNameToDescription(functionName);
        const testId = `test_${serviceConfig.name}_${testCounter}`;
        
        tests.push({
          id: testId,
          service: serviceConfig.name,
          file: relativePath,
          filePath: filePath,
          description,
          suite: currentClass || undefined,
          language: serviceConfig.language,
          framework: serviceConfig.testFramework,
          lineNumber: i + 1
        });
        
        testCounter++;
      }
    }
    
    return tests;
  }

  /**
   * Convert snake_case test function name to readable description
   * e.g., test_user_creation_with_valid_data -> "user creation with valid data"
   */
  private functionNameToDescription(functionName: string): string {
    // Remove 'test_' prefix
    let name = functionName.replace(/^test_/, '');
    
    // Replace underscores with spaces
    name = name.replace(/_/g, ' ');
    
    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
    return name;
  }

  async extractTestMetadata(filePath: string): Promise<UnitTest[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const tests: UnitTest[] = [];
    const relativePath = path.basename(filePath);
    
    const lines = content.split('\n');
    let testCounter = 1;
    let currentClass = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const classMatch = /^class\s+(\w+)/.exec(line.trim());
      if (classMatch) {
        currentClass = classMatch[1];
      }
      
      const testMatch = /^\s*def\s+(test_\w+)\s*\(/.exec(line);
      
      if (testMatch) {
        const functionName = testMatch[1];
        const description = this.functionNameToDescription(functionName);
        const testId = `test_${testCounter}`;
        
        tests.push({
          id: testId,
          service: 'unknown',
          file: relativePath,
          filePath: filePath,
          description,
          suite: currentClass || undefined,
          language: this.language,
          framework: this.framework,
          lineNumber: i + 1
        });
        
        testCounter++;
      }
    }
    
    return tests;
  }
}
