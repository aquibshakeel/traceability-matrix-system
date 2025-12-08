/**
 * Go Test Parser - Parses Go test functions
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

export class GoTestParser implements TestParser {
  language: SupportedLanguage = 'go';
  framework: SupportedFramework = 'go-test';

  canParse(language: SupportedLanguage, framework: SupportedFramework): boolean {
    return language === 'go' && framework === 'go-test';
  }

  async parseTests(serviceConfig: ServiceConfig): Promise<UnitTest[]> {
    const testDir = path.join(serviceConfig.path, serviceConfig.testDirectory);
    const pattern = path.join(testDir, '**/*_test.go');
    
    // Find all Go test files
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
    
    // Parse Go test functions: func TestSomething(t *testing.T)
    const lines = content.split('\n');
    let testCounter = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match Go test function: func Test...
      const testMatch = /^func\s+(Test\w+)\s*\(\s*t\s+\*testing\.T\s*\)/.exec(line.trim());
      
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
   * Convert PascalCase test function name to readable description
   * e.g., TestUserCreationWithValidData -> "user creation with valid data"
   */
  private functionNameToDescription(functionName: string): string {
    // Remove 'Test' prefix
    let name = functionName.replace(/^Test/, '');
    
    // Insert spaces before capital letters
    name = name.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    
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
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const testMatch = /^func\s+(Test\w+)\s*\(\s*t\s+\*testing\.T\s*\)/.exec(line.trim());
      
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
