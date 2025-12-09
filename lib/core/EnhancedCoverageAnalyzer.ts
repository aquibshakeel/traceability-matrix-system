/**
 * Enhanced Coverage Analyzer
 * AI-powered coverage analysis with orphan categorization, gap detection, and reporting
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { TestParserFactory } from './TestParserFactory';
import { ServiceConfig, UnitTest, OrphanTestCategory, Priority } from '../types';

export interface APIScenario {
  api: string;
  categories: {
    happy_case?: string[];
    edge_case?: string[];
    error_case?: string[];
    security?: string[];
  };
}

export interface CoverageAnalysis {
  service: string;
  timestamp: Date;
  baselineScenarios: number;
  unitTestsFound: number;
  apis: APIAnalysis[];
  orphanTests: OrphanTestAnalysis;
  gaps: GapAnalysis[];
  coveragePercent: number;
  summary: AnalysisSummary;
}

export interface APIAnalysis {
  api: string;
  scenarios: string[];
  coveredScenarios: number;
  partiallyCoveredScenarios: number;
  uncoveredScenarios: number;
  matchedTests: Array<{scenario: string; tests: UnitTest[]; status: string}>;
  gaps: GapAnalysis[];
}

export interface OrphanTestAnalysis {
  totalOrphans: number;
  technicalTests: UnitTest[];
  businessTests: UnitTest[];
  categorization: OrphanCategorization[];
}

export interface OrphanCategorization {
  category: string;
  subtype: string;
  count: number;
  tests: UnitTest[];
  actionRequired: boolean;
  priority: Priority;
}

export interface GapAnalysis {
  api: string;
  scenario: string;
  priority: Priority;
  reason: string;
  recommendations: string[];
}

export interface AnalysisSummary {
  totalScenarios: number;
  fullyCovered: number;
  partiallyCovered: number;
  notCovered: number;
  coveragePercent: number;
  p0Gaps: number;
  p1Gaps: number;
  p2Gaps: number;
  criticalIssues: string[];
}

export class EnhancedCoverageAnalyzer {
  private client: Anthropic;
  private model = 'claude-3-5-sonnet-20241022';
  private testParser: TestParserFactory;
  private projectRoot: string;

  constructor(apiKey: string, projectRoot: string) {
    this.client = new Anthropic({ apiKey });
    this.testParser = new TestParserFactory();
    this.projectRoot = projectRoot;
  }

  async analyze(service: ServiceConfig): Promise<CoverageAnalysis> {
    console.log(`\n📊 Analyzing: ${service.name}`);
    console.log('='.repeat(70));

    // Load baseline
    const baselinePath = path.join(this.projectRoot, '.traceability/test-cases/baseline', `${service.name}-baseline.yml`);
    if (!fs.existsSync(baselinePath)) {
      throw new Error(`Baseline not found: ${baselinePath}`);
    }
    
    const baseline = this.loadYAML(baselinePath);
    
    // Get unit tests
    const parser = this.testParser.getParser(service.language as any, service.testFramework as any);
    const unitTests = await parser.parseTests(service);
    
    const scenarioCount = this.countScenarios(baseline);
    console.log(`✓ Baseline: ${scenarioCount} scenarios`);
    console.log(`✓ Unit tests: ${unitTests.length} found`);

    // Analyze each API
    console.log(`\n🤖 AI analyzing coverage...`);
    const apiAnalyses: APIAnalysis[] = [];
    const gaps: GapAnalysis[] = [];
    
    for (const [api, categories] of Object.entries(baseline)) {
      if (api === 'service') continue;
      
      console.log(`\n${api}:`);
      const analysis = await this.analyzeAPI(api, categories as any, unitTests);
      apiAnalyses.push(analysis);
      gaps.push(...analysis.gaps);
    }

    // Categorize orphan tests
    console.log(`\n🔍 Categorizing orphan tests...`);
    const orphanAnalysis = await this.categorizeOrphanTests(unitTests, apiAnalyses);

    // Calculate summary
    const summary = this.calculateSummary(apiAnalyses, gaps);

    console.log('\n' + '='.repeat(70));
    console.log(`📈 Coverage: ${summary.coveragePercent.toFixed(1)}%`);
    console.log(`✅ Covered: ${summary.fullyCovered}/${summary.totalScenarios}`);
    console.log(`⚠️  Gaps: P0=${summary.p0Gaps}, P1=${summary.p1Gaps}, P2=${summary.p2Gaps}`);
    console.log(`🔍 Orphans: ${orphanAnalysis.totalOrphans} tests (${orphanAnalysis.businessTests.length} need scenarios)`);

    return {
      service: service.name,
      timestamp: new Date(),
      baselineScenarios: scenarioCount,
      unitTestsFound: unitTests.length,
      apis: apiAnalyses,
      orphanTests: orphanAnalysis,
      gaps,
      coveragePercent: summary.coveragePercent,
      summary
    };
  }

  private async analyzeAPI(api: string, categories: any, unitTests: UnitTest[]): Promise<APIAnalysis> {
    const scenarios = this.flattenScenarios(categories);
    
    const prompt = `Analyze test coverage for API endpoint: ${api}

**Expected Scenarios (${scenarios.length}):**
${scenarios.map((s, i) => `${i+1}. ${s}`).join('\n')}

**Available Unit Tests (${unitTests.length}):**
${unitTests.slice(0, 30).map((t, i) => `${i+1}. ${t.description} (${t.file})`).join('\n')}

For each scenario, determine:
1. Which unit tests cover it (list test numbers)
2. Coverage status: FULLY_COVERED / PARTIALLY_COVERED / NOT_COVERED
3. What's missing if not fully covered

Respond in JSON format:
{
  "matches": [
    {
      "scenario": "scenario text",
      "testNumbers": [1, 5],
      "status": "FULLY_COVERED|PARTIALLY_COVERED|NOT_COVERED",
      "explanation": "brief explanation",
      "missing": "what's missing (if any)"
    }
  ]
}`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const analysis = this.parseAIResponse(content);
      
      // Build result
      const matchedTests = analysis.matches.map((m: any) => ({
        scenario: m.scenario,
        tests: m.testNumbers.map((n: number) => unitTests[n - 1]).filter((t: UnitTest) => t),
        status: m.status
      }));

      const coveredCount = matchedTests.filter((m: any) => m.status === 'FULLY_COVERED').length;
      const partialCount = matchedTests.filter((m: any) => m.status === 'PARTIALLY_COVERED').length;
      const uncoveredCount = matchedTests.filter((m: any) => m.status === 'NOT_COVERED').length;

      const gaps: GapAnalysis[] = analysis.matches
        .filter((m: any) => m.status === 'NOT_COVERED' || m.status === 'PARTIALLY_COVERED')
        .map((m: any) => ({
          api,
          scenario: m.scenario,
          priority: this.inferPriority(m.scenario),
          reason: m.missing || 'No unit test found',
          recommendations: [`Create/update unit test to cover: ${m.scenario}`]
        }));

      console.log(`  ✅ Covered: ${coveredCount}/${scenarios.length}`);
      console.log(`  ⚠️  Gaps: ${uncoveredCount} not covered, ${partialCount} partial`);

      return {
        api,
        scenarios,
        coveredScenarios: coveredCount,
        partiallyCoveredScenarios: partialCount,
        uncoveredScenarios: uncoveredCount,
        matchedTests,
        gaps
      };
    } catch (error) {
      console.log(`  ⚠️ Analysis failed: ${error}`);
      return {
        api,
        scenarios,
        coveredScenarios: 0,
        partiallyCoveredScenarios: 0,
        uncoveredScenarios: scenarios.length,
        matchedTests: [],
        gaps: scenarios.map(s => ({
          api,
          scenario: s,
          priority: 'P2' as Priority,
          reason: 'Analysis failed',
          recommendations: ['Retry analysis']
        }))
      };
    }
  }

  private async categorizeOrphanTests(
    allTests: UnitTest[],
    apiAnalyses: APIAnalysis[]
  ): Promise<OrphanTestAnalysis> {
    // Find tests that aren't matched to any scenario
    const matchedTestIds = new Set<string>();
    for (const api of apiAnalyses) {
      for (const match of api.matchedTests) {
        match.tests.forEach(t => matchedTestIds.add(t.id));
      }
    }

    const orphans = allTests.filter(t => !matchedTestIds.has(t.id));

    if (orphans.length === 0) {
      return {
        totalOrphans: 0,
        technicalTests: [],
        businessTests: [],
        categorization: []
      };
    }

    console.log(`  Found ${orphans.length} orphan tests, categorizing...`);

    // AI categorization
    const prompt = `Categorize these unit tests as either TECHNICAL (infrastructure/utility tests that don't need business scenarios) or BUSINESS (tests that should have business scenarios):

**Tests to categorize (${orphans.length}):**
${orphans.slice(0, 50).map((t, i) => `${i+1}. ${t.description} (${t.file})`).join('\n')}

For each test, determine:
1. Category: TECHNICAL or BUSINESS
2. Subtype: e.g., "Entity Test", "DTO Test", "Controller Test", "Service Test"
3. Priority: P0 (critical), P1 (high), P2 (medium), P3 (low)
4. Action: "none" or "qa_add_scenario"

Respond in JSON:
{
  "categorizations": [
    {
      "testNumber": 1,
      "category": "TECHNICAL|BUSINESS",
      "subtype": "Entity Test|DTO Test|Controller Test|etc",
      "priority": "P0|P1|P2|P3",
      "action": "none|qa_add_scenario",
      "reason": "brief explanation"
    }
  ]
}`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 3000,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const result = this.parseAIResponse(content);

      // Apply categorizations
      const categorized = result.categorizations.map((cat: any) => {
        const test = orphans[cat.testNumber - 1];
        if (test) {
          test.orphanCategory = {
            type: cat.category.toLowerCase(),
            subtype: cat.subtype,
            priority: cat.priority,
            actionRequired: cat.action === 'qa_add_scenario' ? 'qa_add_scenario' : 'none',
            reason: cat.reason
          };
        }
        return cat;
      });

      const technical = orphans.filter(t => t.orphanCategory?.type === 'technical');
      const business = orphans.filter(t => t.orphanCategory?.type === 'business');

      // Group by subtype
      const groups = new Map<string, UnitTest[]>();
      for (const test of orphans) {
        const key = `${test.orphanCategory?.type}-${test.orphanCategory?.subtype}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(test);
      }

      const categorization: OrphanCategorization[] = Array.from(groups.entries()).map(([key, tests]) => {
        const sample = tests[0].orphanCategory!;
        return {
          category: sample.type,
          subtype: sample.subtype,
          count: tests.length,
          tests,
          actionRequired: sample.actionRequired === 'qa_add_scenario',
          priority: sample.priority
        };
      });

      console.log(`  ✅ Technical: ${technical.length}, Business: ${business.length}`);

      return {
        totalOrphans: orphans.length,
        technicalTests: technical,
        businessTests: business,
        categorization
      };
    } catch (error) {
      console.log(`  ⚠️ Categorization failed: ${error}`);
      return {
        totalOrphans: orphans.length,
        technicalTests: [],
        businessTests: orphans,
        categorization: []
      };
    }
  }

  private parseAIResponse(content: string): any {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.warn('Failed to parse AI response, returning default structure');
      return { matches: [], categorizations: [] };
    }
  }

  private inferPriority(scenario: string): Priority {
    const lower = scenario.toLowerCase();
    if (lower.includes('critical') || lower.includes('security') || lower.includes('auth')) {
      return 'P0';
    }
    if (lower.includes('error') || lower.includes('invalid') || lower.includes('fail')) {
      return 'P1';
    }
    if (lower.includes('edge') || lower.includes('boundary')) {
      return 'P2';
    }
    return 'P3';
  }

  private calculateSummary(apiAnalyses: APIAnalysis[], gaps: GapAnalysis[]): AnalysisSummary {
    const totalScenarios = apiAnalyses.reduce((sum, a) => sum + a.scenarios.length, 0);
    const fullyCovered = apiAnalyses.reduce((sum, a) => sum + a.coveredScenarios, 0);
    const partiallyCovered = apiAnalyses.reduce((sum, a) => sum + a.partiallyCoveredScenarios, 0);
    const notCovered = apiAnalyses.reduce((sum, a) => sum + a.uncoveredScenarios, 0);

    const p0Gaps = gaps.filter(g => g.priority === 'P0').length;
    const p1Gaps = gaps.filter(g => g.priority === 'P1').length;
    const p2Gaps = gaps.filter(g => g.priority === 'P2').length;

    const criticalIssues: string[] = [];
    if (p0Gaps > 0) {
      criticalIssues.push(`${p0Gaps} P0 scenarios without tests`);
    }

    return {
      totalScenarios,
      fullyCovered,
      partiallyCovered,
      notCovered,
      coveragePercent: totalScenarios > 0 ? (fullyCovered / totalScenarios) * 100 : 0,
      p0Gaps,
      p1Gaps,
      p2Gaps,
      criticalIssues
    };
  }

  private flattenScenarios(categories: any): string[] {
    const all: string[] = [];
    for (const cat of ['happy_case', 'edge_case', 'error_case', 'security']) {
      if (categories[cat]) {
        all.push(...categories[cat]);
      }
    }
    return all;
  }

  private countScenarios(data: any): number {
    let count = 0;
    for (const [key, value] of Object.entries(data)) {
      if (key === 'service') continue;
      count += this.flattenScenarios(value).length;
    }
    return count;
  }

  private loadYAML(filePath: string): any {
    return yaml.load(fs.readFileSync(filePath, 'utf-8'));
  }
}
