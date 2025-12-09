/**
 * AI Test Case Generator
 * 
 * Uses Claude AI to generate comprehensive test cases from:
 * - Swagger/OpenAPI specifications
 * - Discovered APIs from code
 * - Service logic analysis
 * 
 * Manages two-folder architecture:
 * - baseline/ (QA-managed, ground truth)
 * - ai_cases/ (AI-generated, always regenerated)
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { SwaggerAPI } from './SwaggerParser';
import { DiscoveredAPI } from './APIScanner';

export interface GeneratedTestCase {
  id: string;
  description: string;
  type: 'positive' | 'negative' | 'edge-case' | 'security' | 'performance';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  category: string;
  steps: string[];
  expectedResult: string;
  testData?: any;
  validations: string[];
  tags: string[];
}

export interface TestCaseGenerationResult {
  api: string;
  method: string;
  testCases: GeneratedTestCase[];
  reasoning: string;
  coverageAreas: string[];
  suggestedNegativeCases: string[];
}

export interface DeltaAnalysis {
  api: string;
  method: string;
  added: GeneratedTestCase[];
  removed: GeneratedTestCase[];
  modified: GeneratedTestCase[];
  common: GeneratedTestCase[];
  summary: string;
  qaActions: string[];
}

export class AITestCaseGenerator {
  private client: Anthropic;
  private model: string = 'claude-3-5-sonnet-20241022';
  private baselineDir: string;
  private aiCasesDir: string;

  constructor(apiKey: string, projectRoot: string) {
    this.client = new Anthropic({ apiKey });
    this.baselineDir = path.join(projectRoot, '.traceability', 'test-cases', 'baseline');
    this.aiCasesDir = path.join(projectRoot, '.traceability', 'test-cases', 'ai_cases');

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Get API path (handles both SwaggerAPI and DiscoveredAPI)
   */
  private getAPIPath(api: SwaggerAPI | DiscoveredAPI): string {
    return 'path' in api ? api.path : api.endpoint;
  }

  /**
   * Ensure baseline and AI directories exist
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.baselineDir)) {
      fs.mkdirSync(this.baselineDir, { recursive: true });
    }
    if (!fs.existsSync(this.aiCasesDir)) {
      fs.mkdirSync(this.aiCasesDir, { recursive: true });
    }
  }

  /**
   * Generate test cases for an API using AI
   */
  async generateTestCases(
    api: SwaggerAPI | DiscoveredAPI,
    serviceCode?: string
  ): Promise<TestCaseGenerationResult> {
    const prompt = this.buildGenerationPrompt(api, serviceCode);

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      temperature: 0.4,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    return this.parseGenerationResponse(responseText, api);
  }

  /**
   * Build prompt for test case generation
   */
  private buildGenerationPrompt(
    api: SwaggerAPI | DiscoveredAPI,
    serviceCode?: string
  ): string {
    const isSwagger = 'operationId' in api;
    const apiPath = this.getAPIPath(api);
    const method = api.method;

    return `You are an expert QA engineer specializing in comprehensive test case generation. Generate a complete set of test cases for the following API.

**API DETAILS:**
Method: ${method}
Path: ${apiPath}
${isSwagger ? `Operation ID: ${(api as SwaggerAPI).operationId || 'N/A'}` : ''}
${isSwagger ? `Summary: ${(api as SwaggerAPI).summary || 'N/A'}` : ''}
${isSwagger ? `Description: ${(api as SwaggerAPI).description || 'N/A'}` : ''}

${isSwagger && (api as SwaggerAPI).parameters ? `
**PARAMETERS:**
${JSON.stringify((api as SwaggerAPI).parameters, null, 2)}
` : ''}

${isSwagger && (api as SwaggerAPI).requestBody ? `
**REQUEST BODY:**
${JSON.stringify((api as SwaggerAPI).requestBody, null, 2)}
` : ''}

${isSwagger && (api as SwaggerAPI).responses ? `
**RESPONSES:**
${JSON.stringify((api as SwaggerAPI).responses, null, 2)}
` : ''}

${serviceCode ? `
**SERVICE CODE CONTEXT:**
\`\`\`
${serviceCode.substring(0, 2000)}
\`\`\`
` : ''}

**TASK:**
Generate a comprehensive set of test cases covering:

1. **Positive Test Cases** (Happy Path)
   - Valid inputs
   - Successful operations
   - Expected responses

2. **Negative Test Cases** (Error Handling)
   - Invalid inputs
   - Missing required fields
   - Invalid data types
   - Boundary violations
   - Authorization failures
   - Business rule violations

3. **Edge Cases**
   - Boundary values
   - Empty/null values
   - Special characters
   - Large datasets
   - Concurrent requests

4. **Security Test Cases**
   - Authentication/Authorization
   - Input validation
   - SQL injection
   - XSS attacks
   - CSRF protection

5. **Performance Test Cases** (if applicable)
   - Response time
   - Load handling
   - Rate limiting

Respond in the following JSON format:
{
  "testCases": [
    {
      "id": "TEST-001",
      "description": "Clear description of what is being tested",
      "type": "positive|negative|edge-case|security|performance",
      "priority": "P0|P1|P2|P3",
      "category": "validation|authentication|business-logic|etc",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "expectedResult": "What should happen",
      "testData": { "sample": "data" },
      "validations": ["Check 1", "Check 2"],
      "tags": ["tag1", "tag2"]
    }
  ],
  "reasoning": "Explanation of test case generation strategy",
  "coverageAreas": ["Area 1", "Area 2"],
  "suggestedNegativeCases": ["Additional negative case ideas"]
}

**IMPORTANT:**
- Be comprehensive - generate AT LEAST 10-15 test cases
- Include both positive and negative scenarios
- Think about real-world usage patterns
- Consider security implications
- Include boundary value analysis
- Think about error conditions

Provide valid JSON only, no additional text.`;
  }

  /**
   * Parse AI response into test cases
   */
  private parseGenerationResponse(
    responseText: string,
    api: SwaggerAPI | DiscoveredAPI
  ): TestCaseGenerationResult {
    try {
      let jsonText = responseText.trim();
      
      // Remove markdown code blocks
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }

      const parsed = JSON.parse(jsonText);

      const apiPath = this.getAPIPath(api);
      
      return {
        api: apiPath,
        method: api.method,
        testCases: parsed.testCases || [],
        reasoning: parsed.reasoning || 'No reasoning provided',
        coverageAreas: parsed.coverageAreas || [],
        suggestedNegativeCases: parsed.suggestedNegativeCases || []
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        api: this.getAPIPath(api),
        method: api.method,
        testCases: [],
        reasoning: 'Failed to generate test cases',
        coverageAreas: [],
        suggestedNegativeCases: []
      };
    }
  }

  /**
   * Save AI-generated test cases to file
   */
  saveAIGeneratedCases(result: TestCaseGenerationResult): void {
    const filename = this.generateFilename(result.api, result.method);
    const filePath = path.join(this.aiCasesDir, filename);

    const content = {
      api: result.api,
      method: result.method,
      generatedAt: new Date().toISOString(),
      testCases: result.testCases,
      reasoning: result.reasoning,
      coverageAreas: result.coverageAreas,
      suggestedNegativeCases: result.suggestedNegativeCases,
      metadata: {
        totalCases: result.testCases.length,
        positiveCases: result.testCases.filter(tc => tc.type === 'positive').length,
        negativeCases: result.testCases.filter(tc => tc.type === 'negative').length,
        edgeCases: result.testCases.filter(tc => tc.type === 'edge-case').length,
        securityCases: result.testCases.filter(tc => tc.type === 'security').length
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`  ✓ Saved AI cases: ${filename}`);
  }

  /**
   * Load baseline test cases
   */
  loadBaselineCases(api: string, method: string): GeneratedTestCase[] {
    const filename = this.generateFilename(api, method);
    const filePath = path.join(this.baselineDir, filename);

    if (!fs.existsSync(filePath)) {
      return [];
    }

    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return content.testCases || [];
    } catch (error) {
      console.warn(`Failed to load baseline cases: ${error}`);
      return [];
    }
  }

  /**
   * Perform delta analysis between baseline and AI-generated cases
   */
  performDeltaAnalysis(result: TestCaseGenerationResult): DeltaAnalysis {
    const baselineCases = this.loadBaselineCases(result.api, result.method);
    const aiCases = result.testCases;

    const added: GeneratedTestCase[] = [];
    const removed: GeneratedTestCase[] = [];
    const modified: GeneratedTestCase[] = [];
    const common: GeneratedTestCase[] = [];

    // Find common and modified cases
    for (const aiCase of aiCases) {
      const baselineCase = baselineCases.find(bc => 
        this.areSimilarTestCases(bc, aiCase)
      );

      if (baselineCase) {
        if (this.areIdenticalTestCases(baselineCase, aiCase)) {
          common.push(aiCase);
        } else {
          modified.push(aiCase);
        }
      } else {
        added.push(aiCase);
      }
    }

    // Find removed cases
    for (const baselineCase of baselineCases) {
      const exists = aiCases.some(ac => 
        this.areSimilarTestCases(ac, baselineCase)
      );
      if (!exists) {
        removed.push(baselineCase);
      }
    }

    // Generate QA actions
    const qaActions = this.generateQAActions(added, removed, modified, common);

    // Generate summary
    const summary = this.generateDeltaSummary(added, removed, modified, common);

    return {
      api: result.api,
      method: result.method,
      added,
      removed,
      modified,
      common,
      summary,
      qaActions
    };
  }

  /**
   * Check if two test cases are similar (same intent)
   */
  private areSimilarTestCases(tc1: GeneratedTestCase, tc2: GeneratedTestCase): boolean {
    // Compare descriptions (fuzzy match)
    const desc1 = tc1.description.toLowerCase();
    const desc2 = tc2.description.toLowerCase();
    
    if (desc1 === desc2) return true;
    
    // Check if one contains the other
    if (desc1.includes(desc2) || desc2.includes(desc1)) return true;
    
    // Check category and type match
    if (tc1.category === tc2.category && tc1.type === tc2.type) {
      // Compare key words
      const words1 = desc1.split(/\s+/);
      const words2 = desc2.split(/\s+/);
      const commonWords = words1.filter(w => words2.includes(w) && w.length > 3);
      
      if (commonWords.length >= 3) return true;
    }
    
    return false;
  }

  /**
   * Check if two test cases are identical
   */
  private areIdenticalTestCases(tc1: GeneratedTestCase, tc2: GeneratedTestCase): boolean {
    return tc1.description === tc2.description &&
           tc1.type === tc2.type &&
           tc1.priority === tc2.priority &&
           tc1.expectedResult === tc2.expectedResult;
  }

  /**
   * Generate QA action items
   */
  private generateQAActions(
    added: GeneratedTestCase[],
    removed: GeneratedTestCase[],
    modified: GeneratedTestCase[],
    common: GeneratedTestCase[]
  ): string[] {
    const actions: string[] = [];

    if (added.length > 0) {
      actions.push(`🆕 Review ${added.length} NEW test case(s) - Add to baseline if relevant`);
      const p0Added = added.filter(tc => tc.priority === 'P0');
      if (p0Added.length > 0) {
        actions.push(`   ⚠️  ${p0Added.length} P0 critical case(s) - HIGH PRIORITY REVIEW`);
      }
    }

    if (removed.length > 0) {
      actions.push(`🗑️  ${removed.length} test case(s) no longer generated - Review if still needed`);
    }

    if (modified.length > 0) {
      actions.push(`✏️  ${modified.length} test case(s) modified - Review changes and update baseline`);
    }

    if (common.length > 0) {
      actions.push(`✅ ${common.length} test case(s) unchanged - No action needed`);
    }

    if (added.length === 0 && removed.length === 0 && modified.length === 0) {
      actions.push(`✨ No changes detected - Baseline is up to date`);
    }

    return actions;
  }

  /**
   * Generate delta summary
   */
  private generateDeltaSummary(
    added: GeneratedTestCase[],
    removed: GeneratedTestCase[],
    modified: GeneratedTestCase[],
    common: GeneratedTestCase[]
  ): string {
    const total = added.length + removed.length + modified.length + common.length;
    
    return `Total: ${total} | Added: ${added.length} | Removed: ${removed.length} | Modified: ${modified.length} | Common: ${common.length}`;
  }

  /**
   * Generate filename for test cases
   */
  private generateFilename(api: string, method: string): string {
    const sanitized = api
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
      .replace(/\//g, '_')
      .replace(/[{}]/g, '')
      .replace(/:/g, '-');
    
    return `${method.toLowerCase()}_${sanitized}.json`;
  }

  /**
   * Generate delta report
   */
  generateDeltaReport(delta: DeltaAnalysis): string {
    let report = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TEST CASE DELTA ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API: ${delta.method} ${delta.api}

${delta.summary}

`;

    if (delta.added.length > 0) {
      report += `\n🆕 ADDED TEST CASES (${delta.added.length}):\n`;
      delta.added.forEach((tc, i) => {
        report += `\n${i + 1}. ${tc.id} - ${tc.description}\n`;
        report += `   Type: ${tc.type} | Priority: ${tc.priority} | Category: ${tc.category}\n`;
      });
    }

    if (delta.removed.length > 0) {
      report += `\n🗑️  REMOVED TEST CASES (${delta.removed.length}):\n`;
      delta.removed.forEach((tc, i) => {
        report += `\n${i + 1}. ${tc.id} - ${tc.description}\n`;
      });
    }

    if (delta.modified.length > 0) {
      report += `\n✏️  MODIFIED TEST CASES (${delta.modified.length}):\n`;
      delta.modified.forEach((tc, i) => {
        report += `\n${i + 1}. ${tc.id} - ${tc.description}\n`;
      });
    }

    if (delta.common.length > 0) {
      report += `\n✅ COMMON TEST CASES (${delta.common.length}):\n`;
      report += `   No changes - these test cases are up to date\n`;
    }

    report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `🎯 QA ACTION ITEMS:\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    delta.qaActions.forEach(action => {
      report += `${action}\n`;
    });

    report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    return report;
  }

  /**
   * Initialize baseline with starter cases
   */
  async initializeBaseline(api: string, method: string): Promise<void> {
    const filename = this.generateFilename(api, method);
    const filePath = path.join(this.baselineDir, filename);

    if (fs.existsSync(filePath)) {
      console.log(`  ℹ️  Baseline already exists for ${method} ${api}`);
      return;
    }

    // Create starter cases
    const starterCases: GeneratedTestCase[] = [
      {
        id: 'BASE-001',
        description: `When user hits ${method} ${api}, the status should be success`,
        type: 'positive',
        priority: 'P0',
        category: 'basic-validation',
        steps: [
          'Send request to API',
          'Verify response status'
        ],
        expectedResult: 'API returns successful response',
        validations: ['Status code should be 200 or 201', 'Response should contain success indicator'],
        tags: ['basic', 'positive', 'status-check']
      },
      {
        id: 'BASE-002',
        description: `When user hits ${method} ${api}, the status code should be 200`,
        type: 'positive',
        priority: 'P0',
        category: 'status-code-validation',
        steps: [
          'Send request to API',
          'Check HTTP status code'
        ],
        expectedResult: 'HTTP status code is 200',
        validations: ['Status code === 200'],
        tags: ['basic', 'positive', 'http-status']
      }
    ];

    const content = {
      api,
      method,
      createdAt: new Date().toISOString(),
      testCases: starterCases,
      note: 'QA-managed baseline. Edit this file to maintain test cases.',
      metadata: {
        totalCases: starterCases.length,
        positiveCases: 2,
        negativeCases: 0
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`  ✓ Initialized baseline: ${filename}`);
  }
}
