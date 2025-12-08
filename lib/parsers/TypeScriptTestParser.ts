/**
 * TypeScript Test Parser - Parses Jest, Mocha, Jasmine tests
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

export class TypeScriptTestParser implements TestParser {
  language: SupportedLanguage = 'typescript';
  framework: SupportedFramework = 'jest';

  canParse(language: SupportedLanguage, framework: SupportedFramework): boolean {
    return (language === 'typescript' || language === 'javascript') &&
           (framework === 'jest' || framework === 'mocha' || framework === 'jasmine');
  }

  async parseTests(serviceConfig: ServiceConfig): Promise<UnitTest[]> {
    const testDir = path.join(serviceConfig.path, serviceConfig.testDirectory);
    const pattern = path.join(testDir, serviceConfig.testPattern);
    
    // Find all test files
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
    
    // Parse different test syntaxes
    const patterns = [
      // Jest/Jasmine: it('description', ...)
      /it\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // Jest/Jasmine: test('description', ...)
      /test\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // Mocha: it('description', function() {...})
      /it\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s+)?function/g
    ];

    let testCounter = 1;
    const lines = content.split('\n');
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      for (const pattern of patterns) {
        pattern.lastIndex = 0; // Reset regex
        const matches = pattern.exec(line);
        
        if (matches && matches[1]) {
          const description = matches[1].trim();
          const testId = `test_${serviceConfig.name}_${testCounter}`;
          
          tests.push({
            id: testId,
            service: serviceConfig.name,
            file: relativePath,
            filePath: filePath,
            description,
            language: serviceConfig.language,
            framework: serviceConfig.testFramework,
            lineNumber: lineIndex + 1
          });
          
          testCounter++;
        }
      }
    }
    
    // Also check for describe blocks to get suite context
    const describePattern = /describe\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let currentSuite = '';
    
    for (const line of lines) {
      const match = describePattern.exec(line);
      if (match) {
        currentSuite = match[1];
      }
    }
    
    // Add suite context to tests
    if (currentSuite) {
      tests.forEach(test => {
        test.suite = currentSuite;
      });
    }
    
    return tests;
  }

  async extractTestMetadata(filePath: string): Promise<UnitTest[]> {
    // This method extracts test metadata from a single file
    // For now, it returns basic implementation
    const content = fs.readFileSync(filePath, 'utf-8');
    const tests: UnitTest[] = [];
    const relativePath = path.basename(filePath);
    
    const patterns = [
      /it\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /test\s*\(\s*['"`]([^'"`]+)['"`]/g,
    ];

    let testCounter = 1;
    const lines = content.split('\n');
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        const matches = pattern.exec(line);
        
        if (matches && matches[1]) {
          const description = matches[1].trim();
          const testId = `test_${testCounter}`;
          
          tests.push({
            id: testId,
            service: 'unknown',
            file: relativePath,
            filePath: filePath,
            description,
            language: this.language,
            framework: this.framework,
            lineNumber: lineIndex + 1
          });
          
          testCounter++;
        }
      }
    }
    
    return tests;
  }
}
