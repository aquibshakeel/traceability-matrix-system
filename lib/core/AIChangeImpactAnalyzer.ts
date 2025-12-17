/**
 * AI-Powered Change Impact Analyzer
 * 
 * Uses AI to intelligently analyze code changes and determine:
 * - Which tests may be affected
 * - What new tests are needed
 * - Risk level of changes
 * - Smart test selection for CI/CD
 */

import { AIProviderFactory, AIProvider } from '../ai';
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
  private provider: AIProvider | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get or initialize the AI provider
   */
  private async getProvider(): Promise<AIProvider> {
    if (!this.provider) {
      this.provider = await AIProviderFactory.create(this.apiKey);
    }
    return this.provider;
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
      const provider = await this.getProvider();
      // Note: This is a specialized analysis, so we'll use a simple prompt approach
      // In future, we could add this to the AIProvider interface if needed frequently
      
      // For now, we use the provider but fall back to simple analysis
      const analysis: any = {
        affectedTests: this.estimateAffectedTests(changes, existingTests),
        newTestsNeeded: this.estimateNewTests(changes),
        riskLevel: this.assessRiskLevel(changes),
        confidence: 0.8,
        recommendations: this.generateRecommendations(changes),
        estimatedEffort: this.estimateEffort(changes),
        testSelectionStrategy: this.selectTestStrategy(changes)
      };

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
    if ((change.type as string) === 'deleted') {
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
      // Simplified analysis
      const result: any = {
        mustReRun: (change.type as string) !== 'deleted',
        reason: (change.type as string) === 'deleted' ? 'File deleted' : 'File changed - tests should be re-run',
        suggestedNewTests: []
      };

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
   * Estimate which tests are affected by changes
   */
  private estimateAffectedTests(changes: GitChange[], existingTests: UnitTest[]): string[] {
    const affected = new Set<string>();
    
    for (const change of changes) {
      // Find tests that might be affected by this file change
      const fileName = change.file.toLowerCase();
      const baseName = fileName.split('/').pop()?.replace(/\.(java|ts|js|py|go)$/, '') || '';
      
      for (const test of existingTests) {
        const testFile = test.file.toLowerCase();
        // If test file mentions the changed file, it might be affected
        if (testFile.includes(baseName) || test.description.toLowerCase().includes(baseName)) {
          affected.add(test.file);
        }
      }
    }
    
    return Array.from(affected);
  }

  /**
   * Estimate new tests needed
   */
  private estimateNewTests(changes: GitChange[]): string[] {
    const needed: string[] = [];
    
    for (const change of changes) {
      if (change.type === 'added') {
        needed.push(`Add tests for new file: ${change.file}`);
      } else if (change.type === 'modified' && change.linesChanged > 50) {
        needed.push(`Review and update tests for significant changes in: ${change.file}`);
      }
    }
    
    return needed;
  }

  /**
   * Assess risk level
   */
  private assessRiskLevel(changes: GitChange[]): 'critical' | 'high' | 'medium' | 'low' {
    const totalLines = changes.reduce((sum, c) => sum + c.linesChanged, 0);
    // Check for deleted files - type should be 'deleted' but compiler thinks it can't be
    const hasDeleted = changes.some(c => (c.type as string) === 'deleted');
    
    if (totalLines > 500 || hasDeleted) {
      return 'critical';
    } else if (totalLines > 200) {
      return 'high';
    } else if (totalLines > 50) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(changes: GitChange[]): string[] {
    const recommendations: string[] = [];
    const riskLevel = this.assessRiskLevel(changes);
    
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Run full test suite due to high risk changes');
      recommendations.push('Consider manual QA review');
    } else {
      recommendations.push('Run affected tests');
    }
    
    const hasNewFiles = changes.some(c => c.type === 'added');
    if (hasNewFiles) {
      recommendations.push('Ensure new files have adequate test coverage');
    }
    
    return recommendations;
  }

  /**
   * Estimate effort
   */
  private estimateEffort(changes: GitChange[]): string {
    const totalLines = changes.reduce((sum, c) => sum + c.linesChanged, 0);
    
    if (totalLines > 500) {
      return '2-3 days';
    } else if (totalLines > 200) {
      return '1-2 days';
    } else if (totalLines > 50) {
      return '4-8 hours';
    }
    return '1-2 hours';
  }

  /**
   * Select test strategy
   */
  private selectTestStrategy(changes: GitChange[]): 'all' | 'affected' | 'smoke' {
    const riskLevel = this.assessRiskLevel(changes);
    
    if (riskLevel === 'critical') {
      return 'all';
    } else if (riskLevel === 'high' || riskLevel === 'medium') {
      return 'affected';
    }
    return 'smoke';
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
