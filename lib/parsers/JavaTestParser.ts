/**
 * Java Test Parser - Universal parser for Java/Kotlin unit tests
 * Supports JUnit 4, JUnit 5, TestNG
 * Extracts test metadata, descriptions, and assertions
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { TestParser, ServiceConfig, UnitTest, SupportedLanguage, SupportedFramework } from '../types';

export class JavaTestParser implements TestParser {
  language: SupportedLanguage = 'java';
  framework: SupportedFramework = 'junit';

  canParse(language: SupportedLanguage, framework: SupportedFramework): boolean {
    return language === 'java' || language === 'kotlin';
  }

  async parseTests(serviceConfig: ServiceConfig): Promise<UnitTest[]> {
    const tests: UnitTest[] = [];
    const testDir = path.join(serviceConfig.path, serviceConfig.testDirectory);
    
    if (!fs.existsSync(testDir)) {
      throw new Error(`Test directory not found: ${testDir}`);
    }

    // Find all test files
    const pattern = path.join(testDir, '**', serviceConfig.testPattern || '*Test.java');
    const testFiles = await glob(pattern.replace(/\\/g, '/'));

    console.log(`    Found ${testFiles.length} test files`);

    for (const filePath of testFiles) {
      try {
        const fileTests = await this.extractTestMetadata(filePath);
        tests.push(...fileTests.map(t => ({
          ...t,
          service: serviceConfig.name,
          language: serviceConfig.language,
          framework: serviceConfig.testFramework
        })));
      } catch (error) {
        console.warn(`    Warning: Failed to parse ${filePath}: ${error}`);
      }
    }

    return tests;
  }

  async extractTestMetadata(filePath: string): Promise<UnitTest[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const tests: UnitTest[] = [];
    const lines = content.split('\n');
    
    let currentClass = '';
    let currentTest: any = null;
    let inTestMethod = false;
    let methodBody: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Extract class name - support both public and package-private classes
      if (trimmed.match(/^(?:public\s+)?class\s+(\w+)/)) {
        const match = trimmed.match(/^(?:public\s+)?class\s+(\w+)/);
        if (match) {
          currentClass = match[1];
        }
      }

      // Detect test methods - JUnit 4/5
      if (trimmed.includes('@Test') || trimmed.includes('@ParameterizedTest') || trimmed.includes('@RepeatedTest')) {
        inTestMethod = true;
        currentTest = {
          file: path.basename(filePath),
          filePath: filePath,
          suite: currentClass,
          lineNumber: i + 1,
          tags: [],
          assertions: []
        };

        // Look for @DisplayName annotation (JUnit 5)
        for (let j = i - 5; j < i; j++) {
          if (j >= 0 && lines[j].includes('@DisplayName')) {
            const displayNameMatch = lines[j].match(/@DisplayName\s*\(\s*"([^"]*)"\s*\)/);
            if (displayNameMatch) {
              currentTest.description = displayNameMatch[1];
            }
          }
        }
      }

      // Extract method name and description - support various method signatures
      if (inTestMethod && (trimmed.match(/^public\s+void\s+(\w+)\s*\(/) || trimmed.match(/^void\s+(\w+)\s*\(/))) {
        const match = trimmed.match(/(?:public\s+)?void\s+(\w+)\s*\(/);
        if (match) {
          const methodName = match[1];
          currentTest.testMethod = methodName;
          currentTest.id = `${currentClass}.${methodName}`;
          
          // If no @DisplayName, generate description from method name
          if (!currentTest.description) {
            currentTest.description = this.methodNameToDescription(methodName);
          }
        }
      }

      // Collect method body
      if (inTestMethod) {
        methodBody.push(trimmed);
        
        // Check for end of method - look for closing brace at start of line
        if (trimmed === '}') {
          // Ensure all required fields are set
          if (currentTest && currentTest.id && currentTest.description) {
            // Extract assertions from method body
            currentTest.assertions = this.extractAssertions(methodBody.join('\n'));
            
            // Check if mocks dependencies
            const bodyStr = methodBody.join('\n');
            currentTest.mocksDependencies = bodyStr.includes('@Mock') || 
                                            bodyStr.includes('mock(') || 
                                            bodyStr.includes('Mockito.');

            tests.push(currentTest);
          }
          
          // Reset for next test
          inTestMethod = false;
          currentTest = null;
          methodBody = [];
        }
      }
    }

    return tests;
  }

  /**
   * Convert camelCase or snake_case method name to readable description
   */
  private methodNameToDescription(methodName: string): string {
    // Remove common test prefixes
    let desc = methodName
      .replace(/^test_?/i, '')
      .replace(/^should_?/i, '')
      .replace(/^when_?/i, '');

    // Convert camelCase to space-separated
    desc = desc.replace(/([A-Z])/g, ' $1').trim();
    
    // Convert snake_case to space-separated
    desc = desc.replace(/_/g, ' ');

    // Capitalize first letter
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);

    return desc;
  }

  /**
   * Extract assertion statements from test method body
   */
  private extractAssertions(methodBody: string): string[] {
    const assertions: string[] = [];
    const assertionPatterns = [
      /assert(?:True|False|Equals|NotEquals|Null|NotNull|Same|NotSame|That|Throws)\s*\([^)]*\)/g,
      /verify\s*\([^)]*\)/g,
      /assertEquals\s*\([^)]*\)/g,
      /assertTrue\s*\([^)]*\)/g,
      /assertFalse\s*\([^)]*\)/g,
      /assertNull\s*\([^)]*\)/g,
      /assertNotNull\s*\([^)]*\)/g
    ];

    for (const pattern of assertionPatterns) {
      const matches = methodBody.match(pattern);
      if (matches) {
        assertions.push(...matches);
      }
    }

    return assertions;
  }
}
