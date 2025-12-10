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
import { ModelDetector } from './ModelDetector';

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
  private model: string | null = null;
  private modelDetector: ModelDetector;
  private testParser: TestParserFactory;
  private projectRoot: string;

  constructor(apiKey: string, projectRoot: string) {
    this.client = new Anthropic({ apiKey });
    this.modelDetector = new ModelDetector(apiKey);
    this.testParser = new TestParserFactory();
    this.projectRoot = projectRoot;
  }

  private async getModel(): Promise<string> {
    if (!this.model) {
      this.model = await this.modelDetector.detectBestModel();
    }
    return this.model;
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
    
    // Load AI cases for completeness check
    const aiCasesPath = path.join(this.projectRoot, '.traceability/test-cases/ai_cases', `${service.name}-ai.yml`);
    const aiCases = fs.existsSync(aiCasesPath) ? this.loadYAML(aiCasesPath) : null;
    
    // Get unit tests
    const parser = this.testParser.getParser(service.language as any, service.testFramework as any);
    const unitTests = await parser.parseTests(service);
    
    const scenarioCount = this.countScenarios(baseline);
    console.log(`✓ Baseline: ${scenarioCount} scenarios`);
    console.log(`✓ Unit tests: ${unitTests.length} found`);
    if (aiCases) {
      console.log(`✓ AI suggestions available for review`);
    }

    // Early exit if BOTH baseline AND unit tests are empty
    if (scenarioCount === 0 && unitTests.length === 0) {
      console.log('\n' + '='.repeat(70));
      console.log(`ℹ️  Baseline and unit tests are both empty - skipping coverage analysis`);
      console.log(`📋 Next step: QA should review AI suggestions and create baseline`);
      console.log(`📋 Next step: Developers should create unit tests`);
      
      // Extract API list from baseline structure
      const apiList: string[] = [];
      for (const key of Object.keys(baseline)) {
        if (key !== 'service') {
          apiList.push(key);
        }
      }
      
      if (apiList.length > 0) {
        console.log(`\n📊 API Coverage Summary:`);
        console.log(`   Found ${apiList.length} API endpoint(s) without test cases or unit tests:`);
        for (const api of apiList) {
          console.log(`   - ${api} (no baseline, no unit tests)`);
        }
      }
      
      console.log(`\n✅ No blocking issues - proceed with development`);
      
      return {
        service: service.name,
        timestamp: new Date(),
        baselineScenarios: 0,
        unitTestsFound: 0,
        apis: apiList.map(api => ({
          api,
          scenarios: [],
          coveredScenarios: 0,
          partiallyCoveredScenarios: 0,
          uncoveredScenarios: 0,
          matchedTests: [],
          gaps: []
        })),
        orphanTests: {
          totalOrphans: 0,
          technicalTests: [],
          businessTests: [],
          categorization: []
        },
        gaps: [],
        coveragePercent: 0,
        summary: {
          totalScenarios: 0,
          fullyCovered: 0,
          partiallyCovered: 0,
          notCovered: 0,
          coveragePercent: 0,
          p0Gaps: 0,
          p1Gaps: 0,
          p2Gaps: 0,
          criticalIssues: [`No baseline scenarios and no unit tests for ${apiList.length} API(s)`]
        }
      };
    }

    // Analyze each API (only if baseline has scenarios)
    console.log(`\n🤖 AI analyzing coverage...`);
    const apiAnalyses: APIAnalysis[] = [];
    const gaps: GapAnalysis[] = [];
    
    for (const [api, categories] of Object.entries(baseline)) {
      if (api === 'service') continue;
      
      console.log(`\n${api}:`);
      const aiSuggestions = aiCases && aiCases[api] ? aiCases[api] : null;
      const analysis = await this.analyzeAPI(api, categories as any, unitTests, aiSuggestions);
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

  private async analyzeAPI(api: string, categories: any, unitTests: UnitTest[], aiSuggestions: any = null): Promise<APIAnalysis> {
    const scenarios = this.flattenScenarios(categories);
    
    // Step 1: Analyze API spec completeness FIRST
    const completenessGaps: GapAnalysis[] = [];
    let hasUntestedSuggestions = false;
    let missingScenarios: string[] = [];
    
    if (aiSuggestions) {
      const aiScenarios = this.flattenScenarios(aiSuggestions);
      missingScenarios = this.findMissingScenarios(scenarios, aiScenarios);
      
      if (missingScenarios.length > 0) {
        console.log(`  ⚠️  API Completeness: ${missingScenarios.length} additional scenarios suggested by API spec`);
        
        // For each missing scenario, check if unit test exists
        for (const missingScenario of missingScenarios) {
          const hasUnitTest = this.checkIfUnitTestExists(missingScenario, unitTests);
          
          if (hasUnitTest) {
            console.log(`     - Unit test exists for: "${missingScenario.substring(0, 60)}..."`);
            completenessGaps.push({
              api,
              scenario: missingScenario,
              priority: this.inferPriority(missingScenario),
              reason: 'Unit test exists but scenario NOT in baseline (baseline incomplete)',
              recommendations: [
                `⚠️ CRITICAL: Unit test exists but scenario missing from baseline`,
                `Action: QA must add this scenario to baseline`,
                `Suggested scenario: "${missingScenario}"`,
                `This makes baseline incomplete despite having test coverage`
              ]
            });
          } else {
            hasUntestedSuggestions = true;
            console.log(`     - No unit test for: "${missingScenario.substring(0, 60)}..."`);
            completenessGaps.push({
              api,
              scenario: missingScenario,
              priority: this.inferPriority(missingScenario),
              reason: 'API spec suggests scenario, but NO baseline AND NO unit test',
              recommendations: [
                `QA Action: Review API spec and add scenario if relevant`,
                `Dev Action: Create unit test if scenario is added`,
                `Suggested scenario: "${missingScenario}"`,
                `Based on API spec analysis`
              ]
            });
          }
        }
      }
    }
    
    // Step 1b: Reverse check - Find unit tests without test cases
    console.log(`  🔍 Checking for unit tests without test cases...`);
    const unscenarioedTests = this.findUnscenarioedTests(scenarios, unitTests, api);
    if (unscenarioedTests.length > 0) {
      console.log(`  ⚠️  Found ${unscenarioedTests.length} unit tests without baseline scenarios`);
      for (const test of unscenarioedTests) {
        console.log(`     - No test case for: "${test.description}"`);
        completenessGaps.push({
          api,
          scenario: `Unit test: ${test.description}`,
          priority: 'P2',
          reason: 'Unit test exists but NO corresponding test case in baseline',
          recommendations: [
            `⚠️ Unit test without baseline scenario detected`,
            `Test: ${test.description}`,
            `Action: QA should review and add scenario to baseline if this is a business test`,
            `Or categorize as technical test if it doesn't need a scenario`
          ]
        });
      }
    }
    
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
      const model = await this.getModel();
      const response = await this.client.messages.create({
        model: model,
        max_tokens: 2000,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const analysis = this.parseAIResponse(content);
      
      // Build result with initial status from baseline matching
      const matchedTests = analysis.matches.map((m: any) => {
        let finalStatus = m.status;
        
        // CRITICAL: Adjust status based on API completeness
        // If baseline scenario is covered BUT API suggests untested scenarios, mark as PARTIALLY_COVERED
        if (m.status === 'FULLY_COVERED' && hasUntestedSuggestions) {
          finalStatus = 'PARTIALLY_COVERED';
          console.log(`  📊 Status adjusted: "${m.scenario.substring(0, 50)}..." → PARTIALLY_COVERED (API incomplete)`);
        }
        
        return {
          scenario: m.scenario,
          tests: m.testNumbers.map((n: number) => unitTests[n - 1]).filter((t: UnitTest) => t),
          status: finalStatus,
          originalStatus: m.status,
          adjustedDueToCompleteness: finalStatus !== m.status
        };
      });

      let coveredCount = matchedTests.filter((m: any) => m.status === 'FULLY_COVERED').length;
      let partialCount = matchedTests.filter((m: any) => m.status === 'PARTIALLY_COVERED').length;
      let uncoveredCount = matchedTests.filter((m: any) => m.status === 'NOT_COVERED').length;

      const gaps: GapAnalysis[] = analysis.matches
        .filter((m: any) => m.status === 'NOT_COVERED' || m.status === 'PARTIALLY_COVERED')
        .map((m: any) => ({
          api,
          scenario: m.scenario,
          priority: this.inferPriority(m.scenario),
          reason: m.missing || 'No unit test found',
          recommendations: [`Create/update unit test to cover: ${m.scenario}`]
        }));

      // Merge completeness gaps
      gaps.push(...completenessGaps);

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
      const model = await this.getModel();
      const response = await this.client.messages.create({
        model: model,
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

  /**
   * Find scenarios in AI suggestions that are missing from baseline
   * Uses semantic similarity to avoid false positives
   */
  private findMissingScenarios(baselineScenarios: string[], aiScenarios: string[]): string[] {
    const missing: string[] = [];
    
    for (const aiScenario of aiScenarios) {
      // Remove markers (✅ or 🆕) from AI scenario
      const cleanAiScenario = aiScenario.replace(/\s*(✅|🆕)\s*$/, '').trim();
      
      // Check if this AI scenario is already in baseline
      const existsInBaseline = baselineScenarios.some(baselineScenario => {
        const cleanBaseline = baselineScenario.replace(/\s*(✅|🆕)\s*$/, '').trim();
        return this.similar(cleanAiScenario, cleanBaseline);
      });
      
      if (!existsInBaseline) {
        missing.push(cleanAiScenario);
      }
    }
    
    return missing;
  }

  /**
   * Check if two scenarios are similar (semantic match)
   */
  private similar(a: string, b: string): boolean {
    const wordsA = a.toLowerCase().split(/\s+/);
    const wordsB = b.toLowerCase().split(/\s+/);
    const common = wordsA.filter(w => wordsB.includes(w)).length;
    return common >= 4; // At least 4 common words
  }

  /**
   * Check if unit test exists for a given scenario
   * Uses semantic matching to find potential test coverage
   */
  private checkIfUnitTestExists(scenario: string, unitTests: UnitTest[]): boolean {
    const scenarioWords = scenario.toLowerCase().split(/\s+/);
    
    for (const test of unitTests) {
      const testWords = test.description.toLowerCase().split(/\s+/);
      const commonWords = scenarioWords.filter(w => testWords.includes(w)).length;
      
      // If significant word overlap, consider test exists
      if (commonWords >= 4) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Find unit tests that don't have corresponding scenarios in baseline
   * Reverse of checkIfUnitTestExists - finds orphaned tests for a specific API
   */
  private findUnscenarioedTests(baselineScenarios: string[], allUnitTests: UnitTest[], api: string): UnitTest[] {
    const unscenarioed: UnitTest[] = [];
    
    // Filter tests that are relevant to this API
    const relevantTests = allUnitTests.filter(test => {
      const testLower = test.description.toLowerCase();
      const apiLower = api.toLowerCase();
      
      // Check if test is related to this API endpoint
      // Extract endpoint parts (e.g., "customers" from "/api/customers")
      const endpointParts = apiLower.split('/').filter(p => p && p !== 'api');
      
      for (const part of endpointParts) {
        if (testLower.includes(part)) {
          return true;
        }
      }
      
      return false;
    });
    
    // For each relevant test, check if it has a matching scenario
    for (const test of relevantTests) {
      const testWords = test.description.toLowerCase().split(/\s+/);
      
      let hasMatchingScenario = false;
      for (const scenario of baselineScenarios) {
        const scenarioWords = scenario.toLowerCase().split(/\s+/);
        const commonWords = testWords.filter(w => scenarioWords.includes(w)).length;
        
        // If significant overlap, consider scenario exists for this test
        if (commonWords >= 4) {
          hasMatchingScenario = true;
          break;
        }
      }
      
      if (!hasMatchingScenario) {
        unscenarioed.push(test);
      }
    }
    
    return unscenarioed;
  }
}
