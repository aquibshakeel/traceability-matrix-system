/**
 * AI-Powered Change Impact Analyzer
 * 
 * Uses AI to intelligently analyze code changes and determine:
 * - Which tests may be affected
 * - What new tests are needed
 * - Risk level of changes
 * - Smart test selection for CI/CD
 */

import Anthropic from '@anthropic-ai/sdk';
import { ModelDetector } from './ModelDetector';
import { UnitTest } from '../types';

export interface GitChange {
  file: string;
  type: 'added' | 'modified' | 'deleted';
  linesChanged: number;
  hunks?: string[];
}

export interface ImpactAnalysis {
  affectedTests: string[];
  newTestsNeeded: string[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  recommendations: string[];
  estimatedEffort: string;
  testSelectionStrategy: 'all' | 'affected' | 'smoke';
}

export class AIChangeImpactAnalyzer {
  private _client?: Anthropic;
  private model: string | null = null;
  private modelDetector: ModelDetector;

  constructor(apiKey: string) {
    this.modelDetector = new ModelDetector(apiKey);
    // Lazy loading: Don't initialize client until needed
  }

  /**
   * Lazy load Anthropic client
   */
  private get client(): Anthropic {
    if (!this._client) {
      this._client = new Anthropic({ 
        apiKey: this.modelDetector['apiKey']
      });
    }
    return this._client;
  }

  /**
   * Get the best available model
   */
  private async getModel(): Promise<string> {
    if (!this.model) {
      this.model = await this.modelDetector.detectBestModel();
    }
    return this.model;
  }

  /**
   * Analyze code changes and determine test impact
   */
  async analyzeChangeImpact(
    changes: GitChange[],
    existingTests: UnitTest[]
  ): Promise<ImpactAnalysis> {
    if (changes.length === 0) {
      return {
        affectedTests: [],
        newTestsNeeded: [],
        riskLevel: 'low',
        confidence: 1.0,
        recommendations: ['No changes detected'],
        estimatedEffort: 'None',
        testSelectionStrategy: 'smoke'
      };
    }

    // Format changes for AI
    const changesDescription = this.formatChanges(changes);
    
    // Format existing tests
    const testsDescription = this.formatTests(existingTests);

    const prompt = `Analyze these code changes and determine their test impact.

**CODE CHANGES (${changes.length} files):**
${changesDescription}

**EXISTING TESTS (${existingTests.length}):**
${testsDescription}

**ANALYSIS REQUIRED:**
1. **Affected Tests** - Which existing tests MUST be re-run? Be specific.
2. **New Tests Needed** - What new test scenarios are required?
3. **Risk Level** - critical/high/medium/low based on change scope
4. **Confidence** - 0.0-1.0 how confident are you in this analysis
5. **Test Selection Strategy** - 'all' (run all tests), 'affected' (run only affected), 'smoke' (quick validation)

**RESPOND IN JSON:**
{
  "affectedTests": ["test file or class name", ...],
  "newTestsNeeded": ["description of needed test", ...],
  "riskLevel": "critical|high|medium|low",
  "confidence": 0.95,
  "recommendations": ["specific action item", ...],
  "estimatedEffort": "X hours|days",
  "testSelectionStrategy": "all|affected|smoke",
  "reasoning": "brief explanation"
}`;

    try {
      const model = await this.getModel();
      // Note: Timeout is controlled by Anthropic SDK's default settings
      const response = await this.client.messages.create({
        model: model,
        max_tokens: 2000,
        temperature: 0.2, // Low temperature for deterministic analysis
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const analysis = this.parseJSON(content);

      return {
        affectedTests: analysis.affectedTests || [],
        newTestsNeeded: analysis.newTestsNeeded || [],
        riskLevel: analysis.riskLevel || 'medium',
        confidence: analysis.confidence || 0.7,
        recommendations: analysis.recommendations || [],
        estimatedEffort: analysis.estimatedEffort || 'Unknown',
        testSelectionStrategy: analysis.testSelectionStrategy || 'affected'
      };
    } catch (error: any) {
      console.warn(`⚠️  AI analysis failed: ${error.message}`);
      
      // Fallback to conservative strategy
      return {
        affectedTests: existingTests.map(t => t.file),
        newTestsNeeded: [],
        riskLevel: 'high',
        confidence: 0.5,
        recommendations: ['AI analysis unavailable - recommend running all tests'],
        estimatedEffort: 'Unknown',
        testSelectionStrategy: 'all'
      };
    }
  }

  /**
   * Analyze specific file change
   */
  async analyzeFileChange(
    change: GitChange,
    relatedTests: UnitTest[]
  ): Promise<{
    mustReRun: boolean;
    reason: string;
    suggestedNewTests: string[];
  }> {
    if (change.type === 'deleted') {
      return {
        mustReRun: false,
        reason: 'File deleted - tests can be removed',
        suggestedNewTests: []
      };
    }

    const prompt = `Analyze this file change:

**FILE:** ${change.file}
**TYPE:** ${change.type}
**LINES CHANGED:** ${change.linesChanged}

**RELATED TESTS:**
${relatedTests.map(t => `- ${t.description} (${t.file})`).join('\n')}

Must these tests be re-run? What new tests are needed?

RESPOND IN JSON:
{
  "mustReRun": true/false,
  "reason": "explanation",
  "suggestedNewTests": ["test description", ...]
}`;

    try {
      const model = await this.getModel();
      // Note: Timeout is controlled by Anthropic SDK's default settings
      const response = await this.client.messages.create({
        model: model,
        max_tokens: 1000,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const result = this.parseJSON(content);

      return {
        mustReRun: result.mustReRun !== false,
        reason: result.reason || 'Unknown',
        suggestedNewTests: result.suggestedNewTests || []
      };
    } catch (error) {
      return {
        mustReRun: true,
        reason: 'Analysis failed - conservative approach',
        suggestedNewTests: []
      };
    }
  }

  /**
   * Format changes for AI prompt
   */
  private formatChanges(changes: GitChange[]): string {
    return changes
      .slice(0, 20) // Limit to prevent prompt overflow
      .map(change => {
        const typeIcon = change.type === 'added' ? '➕' : 
                        change.type === 'modified' ? '📝' : '❌';
        return `${typeIcon} ${change.file} (${change.linesChanged} lines)`;
      })
      .join('\n');
  }

  /**
   * Format tests for AI prompt
   */
  private formatTests(tests: UnitTest[]): string {
    if (tests.length === 0) {
      return 'No existing tests';
    }

    return tests
      .slice(0, 50) // Limit to prevent prompt overflow
      .map(test => `- ${test.description} (${test.file})`)
      .join('\n');
  }

  /**
   * Parse JSON from AI response
   */
  private parseJSON(content: string): any {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.warn('Failed to parse AI response, returning empty object');
      return {};
    }
  }

  /**
   * Generate summary report
   */
  generateReport(analysis: ImpactAnalysis): string {
    const riskEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };

    let report = `\n${'='.repeat(70)}\n`;
    report += `📊 CHANGE IMPACT ANALYSIS\n`;
    report += `${'='.repeat(70)}\n\n`;
    
    report += `${riskEmoji[analysis.riskLevel]} Risk Level: ${analysis.riskLevel.toUpperCase()}\n`;
    report += `🎯 Confidence: ${(analysis.confidence * 100).toFixed(0)}%\n`;
    report += `⏱️  Estimated Effort: ${analysis.estimatedEffort}\n`;
    report += `🧪 Test Strategy: ${analysis.testSelectionStrategy.toUpperCase()}\n\n`;

    if (analysis.affectedTests.length > 0) {
      report += `⚠️  AFFECTED TESTS (${analysis.affectedTests.length}):\n`;
      analysis.affectedTests.slice(0, 10).forEach(test => {
        report += `   - ${test}\n`;
      });
      if (analysis.affectedTests.length > 10) {
        report += `   ... and ${analysis.affectedTests.length - 10} more\n`;
      }
      report += `\n`;
    }

    if (analysis.newTestsNeeded.length > 0) {
      report += `🆕 NEW TESTS NEEDED (${analysis.newTestsNeeded.length}):\n`;
      analysis.newTestsNeeded.forEach(test => {
        report += `   - ${test}\n`;
      });
      report += `\n`;
    }

    if (analysis.recommendations.length > 0) {
      report += `💡 RECOMMENDATIONS:\n`;
      analysis.recommendations.forEach(rec => {
        report += `   • ${rec}\n`;
      });
      report += `\n`;
    }

    report += `${'='.repeat(70)}\n`;

    return report;
  }
}
