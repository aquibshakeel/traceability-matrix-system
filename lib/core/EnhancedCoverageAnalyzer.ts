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
import { APIScanner } from './APIScanner';
import { BaselineValidator } from '../validation/BaselineSchema';

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
  orphanAPIs: OrphanAPIInfo[];
  orphanAPISummary?: string;
  gaps: GapAnalysis[];
  coveragePercent: number;
  summary: AnalysisSummary;
  visualAnalytics: VisualAnalytics;
}

export interface OrphanAPIInfo {
  method: string;
  endpoint: string;
  controller: string;
  lineNumber: number;
  hasScenario: boolean;
  hasTest: boolean;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface VisualAnalytics {
  coverageDistribution: {
    fullyCovered: number;
    partiallyCovered: number;
    notCovered: number;
  };
  gapPriorityBreakdown: {
    p0: number;
    p1: number;
    p2: number;
    p3: number;
  };
  orphanTestPriorityBreakdown: {
    p0: number;
    p1: number;
    p2: number;
    p3: number;
  };
  coverageTrend: Array<{
    date: string;
    coverage: number;
  }>;
}

export interface APIAnalysis {
  api: string;
  scenarios: string[];
  coveredScenarios: number;
  partiallyCoveredScenarios: number;
  uncoveredScenarios: number;
  matchedTests: Array<{
    scenario: string; 
    tests: UnitTest[]; 
    status: string;
    matchDetails?: {
      testDescription: string;
      file: string;
      lineNumber?: number;
      matchConfidence: string;
    }[];
  }>;
  gaps: GapAnalysis[];
  aiAnalysis?: {
    coverageStatus: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    message: string;
    suggestedScenarios?: string[];
    missingScenarios?: number;
  };
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
  aiSuggestions?: string[];
  context?: 'gap' | 'orphan_test' | 'orphan_api';
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
  private apiScanner: APIScanner;
  private baselineValidator: BaselineValidator;
  private fileTimestamps = new Map<string, number>();

  constructor(apiKey: string, projectRoot: string) {
    this.client = new Anthropic({ apiKey });
    this.modelDetector = new ModelDetector(apiKey);
    this.testParser = new TestParserFactory();
    this.apiScanner = new APIScanner();
    this.baselineValidator = new BaselineValidator();
    this.projectRoot = projectRoot;
  }
  
  /**
   * Check if file has changed since last access
   */
  private hasFileChanged(filePath: string): boolean {
    if (!fs.existsSync(filePath)) {
      // File was deleted
      this.fileTimestamps.delete(filePath);
      return true;
    }
    
    const stats = fs.statSync(filePath);
    const currentTime = stats.mtimeMs;
    const previousTime = this.fileTimestamps.get(filePath);
    
    if (!previousTime) {
      // First time seeing file
      this.fileTimestamps.set(filePath, currentTime);
      return true;
    }
    
    if (currentTime !== previousTime) {
      console.log(`    🔄 File changed: ${path.basename(filePath)}`);
      this.fileTimestamps.set(filePath, currentTime);
      return true;
    }
    
    return false;
  }
  
  /**
   * Clear cache - useful for forcing fresh analysis
   */
  public clearCache(): void {
    this.fileTimestamps.clear();
    console.log('🧹 Cache cleared');
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

    // Scan APIs from actual code
    const discoveredAPIs = await this.apiScanner.scanAPIs(service);
    
    // Load baseline
    const baselinePath = path.join(this.projectRoot, '.traceability/test-cases/baseline', `${service.name}-baseline.yml`);
    if (!fs.existsSync(baselinePath)) {
      throw new Error(`Baseline not found: ${baselinePath}`);
    }
    
    const baseline = this.loadYAML(baselinePath);
    
    // Extract API mapping if present (new format with unique keys)
    const apiMapping = baseline.api_mapping || {};
    
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

    // Check if baseline is empty - handle differently
    const isBaselineEmpty = scenarioCount === 0;
    
    // Log status message if both are empty
    if (isBaselineEmpty && unitTests.length === 0) {
      console.log('\n' + '='.repeat(70));
      console.log(`ℹ️  Baseline and unit tests are both empty - skipping coverage analysis`);
      console.log(`📋 Next step: QA should review AI suggestions and create baseline`);
      console.log(`📋 Next step: Developers should create unit tests`);
      
      if (discoveredAPIs.length > 0) {
        console.log(`\n📊 API Coverage Summary:`);
        console.log(`   Found ${discoveredAPIs.length} API endpoint(s) without test cases or unit tests:`);
        for (const api of discoveredAPIs) {
          console.log(`   - ${api.method} ${api.endpoint} (no baseline, no unit tests)`);
        }
      }
      
      console.log(`\n✅ No blocking issues - proceed with development`);
      // Continue to orphan detection below - don't early exit
    }

    // Analyze each API (only if baseline has scenarios)
    console.log(`\n🤖 AI analyzing coverage...`);
    const apiAnalyses: APIAnalysis[] = [];
    const gaps: GapAnalysis[] = [];
    
    for (const [apiKey, categories] of Object.entries(baseline)) {
      if (apiKey === 'service' || apiKey === 'api_mapping') continue;
      
      // Get actual API endpoint from mapping (or use key as-is for old format)
      const actualAPI = apiMapping[apiKey] || apiKey;
      
      console.log(`\n${actualAPI}:`);
      const aiSuggestions = aiCases && aiCases[actualAPI] ? aiCases[actualAPI] : null;
      const analysis = await this.analyzeAPI(actualAPI, categories as any, unitTests, aiSuggestions);
      apiAnalyses.push(analysis);
      gaps.push(...analysis.gaps);
    }

    // Categorize orphan tests
    console.log(`\n🔍 Categorizing orphan tests...`);
    const orphanAnalysis = await this.categorizeOrphanTests(unitTests, apiAnalyses);

    // Calculate summary
    const summary = this.calculateSummary(apiAnalyses, gaps);
    
    // Calculate visual analytics
    const visualAnalytics = this.calculateVisualAnalytics(apiAnalyses, gaps, orphanAnalysis);
    
    // Mark which discovered APIs have tests using the improved logic
    this.apiScanner.markAPIsWithTests(discoveredAPIs, unitTests);
    
    // Detect orphan APIs (APIs with no scenarios AND no tests)
    const orphanAPIs = this.detectOrphanAPIs(baseline, unitTests, apiAnalyses, discoveredAPIs);
    
    // Generate AI-powered summary for orphan APIs
    let orphanAPISummary: string | undefined;
    if (orphanAPIs.length > 0) {
      console.log(`\n🤖 Generating AI summary for ${orphanAPIs.length} orphan API(s)...`);
      orphanAPISummary = await this.generateOrphanAPISummary(orphanAPIs);
    }

    console.log('\n' + '='.repeat(70));
    console.log(`📈 Coverage: ${summary.coveragePercent.toFixed(1)}%`);
    console.log(`✅ Covered: ${summary.fullyCovered}/${summary.totalScenarios}`);
    console.log(`⚠️  Gaps: P0=${summary.p0Gaps}, P1=${summary.p1Gaps}, P2=${summary.p2Gaps}`);
    console.log(`🔍 Orphans: ${orphanAnalysis.totalOrphans} tests (${orphanAnalysis.businessTests.length} need scenarios)`);
    if (orphanAPIs.length > 0) {
      console.log(`⚠️  Orphan APIs: ${orphanAPIs.length} APIs with no scenarios AND no tests`);
    }

    return {
      service: service.name,
      timestamp: new Date(),
      baselineScenarios: scenarioCount,
      unitTestsFound: unitTests.length,
      apis: apiAnalyses,
      orphanTests: orphanAnalysis,
      orphanAPIs,
      orphanAPISummary,
      gaps,
      coveragePercent: summary.coveragePercent,
      summary,
      visualAnalytics
    };
  }

  private async analyzeAPI(api: string, categories: any, unitTests: UnitTest[], aiSuggestions: any = null): Promise<APIAnalysis> {
    // Handle null/undefined categories (empty baseline entry)
    if (!categories || categories === null) {
      console.log(`  ⚠️  0 scenarios, 0 unit tests - will be flagged as Orphan API`);
      return {
        api,
        scenarios: [],
        coveredScenarios: 0,
        partiallyCoveredScenarios: 0,
        uncoveredScenarios: 0,
        matchedTests: [],
        gaps: []
      };
    }
    
    const scenarios = this.flattenScenarios(categories);
    
    // If baseline has 0 scenarios, return empty analysis immediately
    // Do NOT analyze with AI when baseline is empty
    if (scenarios.length === 0) {
      console.log(`  ⚠️  0 scenarios, 0 unit tests - will be flagged as Orphan API`);
      return {
        api,
        scenarios: [],
        coveredScenarios: 0,
        partiallyCoveredScenarios: 0,
        uncoveredScenarios: 0,
        matchedTests: [],
        gaps: []
      };
    }
    
    // 🔧 FIX: Filter unit tests to only include tests relevant to THIS API endpoint
    // This prevents cross-endpoint matching (e.g., GET /{id} tests matching POST scenarios)
    const relevantTests = this.filterTestsByEndpoint(api, unitTests);
    console.log(`  📋 Analyzing ${scenarios.length} scenarios with ${relevantTests.length} relevant tests (filtered from ${unitTests.length} total)`);
    
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
    const aiScenariosFlat = aiSuggestions ? this.flattenScenarios(aiSuggestions) : [];
    const unscenarioedTests = this.findUnscenarioedTests(scenarios, unitTests, api);
    if (unscenarioedTests.length > 0) {
      console.log(`  ⚠️  Found ${unscenarioedTests.length} unit tests without baseline scenarios`);
      for (const test of unscenarioedTests) {
        // Try to find AI-suggested scenario that matches this test
        const suggestedScenario = this.findMatchingAIScenario(test, aiScenariosFlat);
        
        if (suggestedScenario) {
          console.log(`     - No test case for: "${test.description}"`);
          console.log(`       💡 AI Suggestion: "${suggestedScenario.substring(0, 80)}..."`);
          completenessGaps.push({
            api,
            scenario: `Unit test: ${test.description}`,
            priority: 'P2',
            reason: 'Unit test exists but NO corresponding test case in baseline',
            recommendations: [
              `⚠️ ORPHAN UNIT TEST: Test exists without baseline scenario`,
              `Test: ${test.description}`,
              `File: ${test.file}`,
              `💡 AI-Suggested Scenario: "${suggestedScenario}"`,
              `Action: QA should add this AI-suggested scenario to baseline`,
              `If not suitable, create custom scenario based on test intent`
            ]
          });
        } else {
          console.log(`     - No test case for: "${test.description}" (no AI suggestion available)`);
          completenessGaps.push({
            api,
            scenario: `Unit test: ${test.description}`,
            priority: 'P2',
            reason: 'Unit test exists but NO corresponding test case in baseline',
            recommendations: [
              `⚠️ ORPHAN UNIT TEST: Test exists without baseline scenario`,
              `Test: ${test.description}`,
              `File: ${test.file}`,
              `Action: QA should review test and create appropriate baseline scenario`,
              `Or categorize as technical test if it doesn't need a scenario`
            ]
          });
        }
      }
    }
    
    const prompt = `Analyze test coverage for API endpoint: ${api}

**CRITICAL: Only consider unit tests that are specifically for THIS API endpoint. Do NOT match tests from other endpoints.**

**Expected Scenarios (${scenarios.length}):**
${scenarios.map((s, i) => `${i+1}. ${s}`).join('\n')}

**Available Unit Tests for ${api} (${relevantTests.length}):**
${relevantTests.slice(0, 30).map((t, i) => `${i+1}. ${t.description} (${t.file})`).join('\n')}

For each scenario, determine:
1. Which unit tests cover it (list test numbers)
2. Coverage status: FULLY_COVERED / PARTIALLY_COVERED / NOT_COVERED
3. What's missing if not fully covered

**IMPORTANT: Test numbers refer to the filtered list above, NOT all unit tests.**

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
      
      // Build result with match details for traceability
      const matchedTests = analysis.matches.map((m: any) => {
        // 🔧 FIX: Use relevantTests (filtered list) instead of all unitTests
        const tests = m.testNumbers.map((n: number) => relevantTests[n - 1]).filter((t: UnitTest) => t);
        
        // Build detailed match info for each test
        const matchDetails = tests.map((test: UnitTest) => ({
          testDescription: test.description,
          file: test.file,
          lineNumber: test.lineNumber,
          matchConfidence: m.status === 'FULLY_COVERED' ? 'HIGH' : 
                          m.status === 'PARTIALLY_COVERED' ? 'MEDIUM' : 'LOW'
        }));
        
        return {
          scenario: m.scenario,
          tests,
          status: m.status,
          matchDetails
        };
      });

      let coveredCount = matchedTests.filter((m: any) => m.status === 'FULLY_COVERED').length;
      let partialCount = matchedTests.filter((m: any) => m.status === 'PARTIALLY_COVERED').length;
      let uncoveredCount = matchedTests.filter((m: any) => m.status === 'NOT_COVERED').length;

      // Baseline vs unit test gaps ONLY
      // Do NOT include AI suggestions (completeness gaps) in coverage report
      const gaps: GapAnalysis[] = analysis.matches
        .filter((m: any) => m.status === 'NOT_COVERED' || m.status === 'PARTIALLY_COVERED')
        .map((m: any) => ({
          api,
          scenario: m.scenario,
          priority: this.inferPriority(m.scenario),
          reason: m.missing || 'No unit test found',
          recommendations: [`Create/update unit test to cover: ${m.scenario}`]
        }));

      // AI suggestions are logged to console for informational purposes only
      // They are NOT added to coverage gaps

      console.log(`  ✅ Covered: ${coveredCount}/${scenarios.length}`);
      console.log(`  ⚠️  Gaps: ${uncoveredCount} not covered, ${partialCount} partial`);
      
      // Add high-level note about API completeness (if gaps found)
      if (hasUntestedSuggestions) {
        console.log(`  ℹ️  Note: API spec analysis suggests ${missingScenarios.length} additional scenario(s) not in baseline`);
      }

      // Generate AI analysis for ALL endpoints (including 100% covered)
      const aiAnalysis = this.generateAIAnalysis(
        coveredCount, 
        scenarios.length, 
        uncoveredCount, 
        partialCount,
        missingScenarios.length,
        hasUntestedSuggestions
      );

      return {
        api,
        scenarios,
        coveredScenarios: coveredCount,
        partiallyCoveredScenarios: partialCount,
        uncoveredScenarios: uncoveredCount,
        matchedTests,
        gaps,
        aiAnalysis
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

    // AI categorization with very explicit prompt
    const prompt = `Categorize these unit tests as either TECHNICAL or BUSINESS.

**CRITICAL RULE: If a test is in a ControllerTest.java file, it is BUSINESS unless it ONLY tests security validation (SQL injection/XSS).**

**TECHNICAL Tests** (NO baseline scenario needed) - VERY RARE:
- Pure DTO/Entity validation tests (in DTO/Entity test files)
- Pure Mapper/utility tests (in Mapper/Utility test files)
- ONLY these security tests: SQL injection validation, XSS payload validation
- Configuration loading tests

**BUSINESS Tests** (NEED baseline scenario) - MOST TESTS:
- ALL Controller tests (ControllerTest.java) EXCEPT pure SQL/XSS security validation
- ALL Service tests (ServiceTest.java)
- Any test checking HTTP status codes (200, 404, 400, etc.) = BUSINESS
- Any test checking authentication/authorization = BUSINESS
- Any test checking error handling (exceptions, error messages) = BUSINESS
- Any test checking valid/invalid input formats = BUSINESS
- Any test checking data validation (empty, null, format) = BUSINESS
- Any test checking business rules or edge cases = BUSINESS

**Tests to categorize (${orphans.length}):**
${orphans.slice(0, 50).map((t, i) => `${i+1}. ${t.description} (${t.file})`).join('\n')}

**DECISION TREE:**
1. Is the file ControllerTest.java or ServiceTest.java? → If YES, it's BUSINESS (unless ONLY SQL/XSS)
2. Does test check HTTP status, authentication, or business behavior? → If YES, it's BUSINESS
3. Does test ONLY validate SQL injection or XSS? → If YES and NOTHING else, it's TECHNICAL
4. Is it a pure DTO/Entity/Mapper test? → If YES, it's TECHNICAL
5. When in doubt → Mark as BUSINESS

For each test, determine:
1. Category: TECHNICAL or BUSINESS
2. Subtype: "Controller Test", "Service Test", "Security Validation", "DTO Test", etc.
3. Priority: P0 (critical business), P1 (important), P2 (normal), P3 (nice to have)
4. Action: "qa_add_scenario" for BUSINESS, "none" for TECHNICAL

Respond in JSON:
{
  "categorizations": [
    {
      "testNumber": 1,
      "category": "TECHNICAL|BUSINESS",
      "subtype": "Controller Test|Service Test|Security Validation|DTO Test|etc",
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

  /**
   * Generate AI analysis for endpoint coverage
   * CRITICAL: This runs for ALL endpoints, including 100% covered ones
   */
  private generateAIAnalysis(
    coveredCount: number,
    totalScenarios: number,
    uncoveredCount: number,
    partialCount: number,
    missingCount: number,
    hasMissingScenarios: boolean
  ): { coverageStatus: 'excellent' | 'good' | 'needs_improvement' | 'critical'; message: string; missingScenarios?: number } {
    const coveragePercent = totalScenarios > 0 ? (coveredCount / totalScenarios) * 100 : 0;
    
    // Determine coverage status
    let coverageStatus: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    let message: string;
    
    if (coveragePercent === 100 && !hasMissingScenarios) {
      coverageStatus = 'excellent';
      message = '✅ Perfect coverage! All baseline scenarios are fully tested with no gaps detected.';
    } else if (coveragePercent === 100 && hasMissingScenarios) {
      coverageStatus = 'good';
      message = `✅ All ${totalScenarios} baseline scenarios covered! However, API spec suggests ${missingCount} additional scenarios for comprehensive testing.`;
    } else if (coveragePercent >= 80) {
      coverageStatus = 'good';
      message = `Good coverage at ${coveragePercent.toFixed(1)}%. ${uncoveredCount} scenarios need tests${partialCount > 0 ? `, ${partialCount} partially covered` : ''}.`;
    } else if (coveragePercent >= 50) {
      coverageStatus = 'needs_improvement';
      message = `⚠️  Coverage needs improvement (${coveragePercent.toFixed(1)}%). ${uncoveredCount} critical scenarios missing tests.`;
    } else {
      coverageStatus = 'critical';
      message = `❌ Critical gaps! Only ${coveragePercent.toFixed(1)}% covered. Immediate action needed for ${uncoveredCount} scenarios.`;
    }
    
    return {
      coverageStatus,
      message,
      missingScenarios: hasMissingScenarios ? missingCount : undefined
    };
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
      if (key === 'service' || key === 'api_mapping') continue;
      // Skip null/undefined values
      if (!value || value === null) continue;
      count += this.flattenScenarios(value).length;
    }
    return count;
  }

  private loadYAML(filePath: string): any {
    // Check if file changed (cache invalidation)
    const changed = this.hasFileChanged(filePath);
    if (changed && this.fileTimestamps.size > 1) {
      console.log(`    🔄 Reloading baseline (file modified)`);
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = yaml.load(content);
      
      // Basic structure validation
      if (!data || typeof data !== 'object') {
        throw new Error(`Invalid YAML structure: expected object, got ${typeof data}`);
      }
      
      // Schema validation
      const validationResult = this.baselineValidator.validate(data, filePath);
      
      if (!validationResult.valid) {
        console.error(`\n❌ Baseline validation failed:`);
        for (const error of validationResult.errors) {
          console.error(`   - ${error}`);
        }
        throw new Error('Invalid baseline structure - see errors above');
      }
      
      return data;
    } catch (error: any) {
      console.error(`\n❌ ERROR: Failed to load baseline YAML`);
      console.error(`   File: ${filePath}`);
      console.error(`   Error: ${error.message}`);
      console.error(`\n📋 Troubleshooting Steps:`);
      console.error(`   1. Check YAML syntax: https://yaml-online-parser.appspot.com/`);
      console.error(`   2. Ensure proper indentation (2 spaces, no tabs)`);
      console.error(`   3. Verify all colons have spaces after them`);
      console.error(`   4. Check for missing dashes before list items`);
      console.error(`   5. Ensure no special characters without quotes`);
      
      // Enhanced error messages for common issues
      if (error.message.includes('duplicate')) {
        console.error(`\n💡 Common Issue: Duplicate API endpoints detected`);
        console.error(`   Check for multiple definitions of the same endpoint`);
      }
      
      if (error.message.includes('indent') || error.message.includes('tab')) {
        console.error(`\n💡 Common Issue: Indentation error`);
        console.error(`   Ensure consistent 2-space indentation throughout file`);
        console.error(`   Do NOT use tabs - use spaces only`);
      }
      
      if (error.message.includes('Invalid API format')) {
        console.error(`\n💡 Common Issue: API endpoint format incorrect`);
        console.error(`   Format should be: "METHOD /path" (e.g., "GET /v1/customers")`);
        console.error(`   Valid methods: GET, POST, PUT, DELETE, PATCH`);
      }
      
      console.error(`\n💡 Example valid structure:`);
      console.error(`   GET /api/endpoint:`);
      console.error(`     happy_case:`);
      console.error(`       - Scenario description here`);
      console.error(`     error_case:`);
      console.error(`       - Another scenario here`);
      console.error(`\n📖 Documentation: docs/QA_GUIDE.md#baseline-format`);
      throw error; // Re-throw to stop execution
    }
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

  /**
   * Calculate visual analytics data for charts and graphs
   */
  private calculateVisualAnalytics(
    apiAnalyses: APIAnalysis[],
    gaps: GapAnalysis[],
    orphanAnalysis: OrphanTestAnalysis
  ): VisualAnalytics {
    // Coverage distribution
    const fullyCovered = apiAnalyses.reduce((sum, a) => sum + a.coveredScenarios, 0);
    const partiallyCovered = apiAnalyses.reduce((sum, a) => sum + a.partiallyCoveredScenarios, 0);
    const notCovered = apiAnalyses.reduce((sum, a) => sum + a.uncoveredScenarios, 0);

    // Gap priority breakdown
    const p0 = gaps.filter(g => g.priority === 'P0').length;
    const p1 = gaps.filter(g => g.priority === 'P1').length;
    const p2 = gaps.filter(g => g.priority === 'P2').length;
    const p3 = gaps.filter(g => g.priority === 'P3').length;

    // Orphan test priority breakdown
    const orphanP0 = orphanAnalysis.categorization.filter(c => c.priority === 'P0').reduce((sum, c) => sum + c.count, 0);
    const orphanP1 = orphanAnalysis.categorization.filter(c => c.priority === 'P1').reduce((sum, c) => sum + c.count, 0);
    const orphanP2 = orphanAnalysis.categorization.filter(c => c.priority === 'P2').reduce((sum, c) => sum + c.count, 0);
    const orphanP3 = orphanAnalysis.categorization.filter(c => c.priority === 'P3').reduce((sum, c) => sum + c.count, 0);

    // Coverage trend (placeholder - could be extended to track history)
    const totalScenarios = fullyCovered + partiallyCovered + notCovered;
    const currentCoverage = totalScenarios > 0 ? (fullyCovered / totalScenarios) * 100 : 0;
    const coverageTrend = [
      {
        date: new Date().toISOString().split('T')[0],
        coverage: currentCoverage
      }
    ];

    return {
      coverageDistribution: {
        fullyCovered,
        partiallyCovered,
        notCovered
      },
      gapPriorityBreakdown: {
        p0,
        p1,
        p2,
        p3
      },
      orphanTestPriorityBreakdown: {
        p0: orphanP0,
        p1: orphanP1,
        p2: orphanP2,
        p3: orphanP3
      },
      coverageTrend
    };
  }


  /**
   * Generate AI-powered summary for all orphan APIs
   */
  private async generateOrphanAPISummary(orphanAPIs: OrphanAPIInfo[]): Promise<string> {
    if (orphanAPIs.length === 0) {
      return '';
    }

    const prompt = `Generate a SHORT, focused summary for these ${orphanAPIs.length} orphan API endpoints (NO test scenarios AND NO unit tests):

${orphanAPIs.map((api, i) => `${i+1}. ${api.method} ${api.endpoint}`).join('\n')}

Format (max 3-4 sentences total):
**Summary:** [1 sentence: what's missing]
**Risk:** [1 sentence: why it matters]  
**Action:** [1-2 sentences: QA and Dev next steps]

Use exact keywords: "test scenarios", "unit tests", "baseline", "coverage". Be concise and direct.`;

    try {
      const model = await this.getModel();
      const response = await this.client.messages.create({
        model: model,
        max_tokens: 300,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    } catch (error) {
      console.log(`  ⚠️ AI summary generation failed: ${error}`);
      return `These ${orphanAPIs.length} API endpoints have no baseline scenarios and no unit tests. QA should create baseline scenarios, then Dev implements tests.`;
    }
  }

  /**
   * Detect orphan APIs - APIs that have NO scenarios AND NO tests
   * Uses discovered APIs from APIScanner to catch all APIs
   * Now uses api_mapping for proper lookup with unique keys
   * Also detects commented baseline entries as orphan APIs
   */
  private detectOrphanAPIs(
    baseline: any,
    unitTests: UnitTest[],
    apiAnalyses: APIAnalysis[],
    discoveredAPIs: any[]
  ): OrphanAPIInfo[] {
    const orphanAPIs: OrphanAPIInfo[] = [];
    
    // Build reverse mapping: actual API endpoint -> unique key
    const apiMapping = baseline.api_mapping || {};
    const reverseMapping: { [key: string]: string } = {};
    for (const [uniqueKey, actualAPI] of Object.entries(apiMapping)) {
      reverseMapping[actualAPI as string] = uniqueKey;
    }

    // Check ALL discovered APIs
    for (const discoveredAPI of discoveredAPIs) {
      const actualAPIKey = `${discoveredAPI.method} ${discoveredAPI.endpoint}`;
      
      // Try to find the unique key for this API (or use actualAPIKey if no mapping)
      const uniqueKey = reverseMapping[actualAPIKey] || actualAPIKey;
      
      // Check if API has scenarios in baseline
      let scenarioCount = 0;
      let hasBaselineEntry = false;
      
      if (baseline[uniqueKey] !== undefined) {
        hasBaselineEntry = true;
        // Check if entry is truly empty (null, empty object, or no scenarios)
        const entry = baseline[uniqueKey];
        if (entry === null || entry === '' || (typeof entry === 'object' && Object.keys(entry).length === 0)) {
          // Empty entry - treat as 0 scenarios
          scenarioCount = 0;
        } else {
          scenarioCount = this.flattenScenarios(entry).length;
        }
      }

      // Use the hasTest flag that was set by APIScanner.markAPIsWithTests()
      const hasTests = discoveredAPI.hasTest;

      // If no scenarios AND no tests, it's an orphan API
      // This includes: no baseline entry, empty baseline entry, or 0 scenarios
      if (scenarioCount === 0 && !hasTests) {
        orphanAPIs.push({
          method: discoveredAPI.method,
          endpoint: discoveredAPI.endpoint,
          controller: discoveredAPI.controller,
          lineNumber: discoveredAPI.lineNumber,
          hasScenario: hasBaselineEntry && scenarioCount === 0, // true if entry exists but empty
          hasTest: false,
          riskLevel: 'Critical'
        });
      }
    }
    
    // Also detect commented APIs in baseline (APIs that exist in mapping but are commented out)
    // CRITICAL: Commented baseline entries are ALWAYS orphan, regardless of whether tests exist
    // This is because a commented baseline means incomplete documentation
    const commentedAPIs = this.detectCommentedBaseline();
    for (const commentedKey of commentedAPIs) {
      // Get actual endpoint from mapping
      const actualEndpoint = apiMapping[commentedKey];
      if (actualEndpoint) {
        // Parse method and endpoint
        const parts = actualEndpoint.split(/\s+/);
        const method = parts.length === 2 ? parts[0] : 'GET';
        const endpoint = parts.length === 2 ? parts[1] : actualEndpoint;
        
        // Check if this API was already processed in the discoveredAPIs loop
        const existingIndex = orphanAPIs.findIndex(o => o.method === method && o.endpoint === endpoint);
        
        if (existingIndex >= 0) {
          // Already in list from discoveredAPIs - update it to show it's commented
          orphanAPIs[existingIndex].controller = orphanAPIs[existingIndex].controller + ' (baseline commented)';
          orphanAPIs[existingIndex].hasScenario = false; // Commented = no scenarios
        } else {
          // Not in list yet - this means it has tests but baseline is commented
          // STILL add it as orphan because commented baseline is incomplete
          orphanAPIs.push({
            method,
            endpoint,
            controller: 'Has tests but baseline commented',
            lineNumber: 0,
            hasScenario: false,
            hasTest: true, // Has tests but baseline missing
            riskLevel: 'Critical'
          });
        }
      }
    }

    return orphanAPIs;
  }
  
  /**
   * Detect commented API keys in baseline YAML
   * Returns list of API keys that are commented out
   */
  private detectCommentedBaseline(): string[] {
    const baselinePath = path.join(this.projectRoot, '.traceability/test-cases/baseline', `customer-service-baseline.yml`);
    if (!fs.existsSync(baselinePath)) {
      return [];
    }
    
    const rawContent = fs.readFileSync(baselinePath, 'utf-8');
    const lines = rawContent.split('\n');
    const commentedKeys: string[] = [];
    
    // Look for commented lines that match API key pattern
    // Example: #PUT_UpdateCustomer:
    const apiKeyPattern = /^#\s*([A-Z_]+):\s*$/;
    
    for (const line of lines) {
      const match = line.match(apiKeyPattern);
      if (match) {
        commentedKeys.push(match[1]);
      }
    }
    
    return commentedKeys;
  }

  /**
   * Extract HTTP method from API string
   */
  private extractHttpMethod(api: string): string {
    const upper = api.toUpperCase();
    if (upper.startsWith('GET ')) return 'GET';
    if (upper.startsWith('POST ')) return 'POST';
    if (upper.startsWith('PUT ')) return 'PUT';
    if (upper.startsWith('DELETE ')) return 'DELETE';
    if (upper.startsWith('PATCH ')) return 'PATCH';
    if (upper.includes('/POST')) return 'POST';
    if (upper.includes('/GET')) return 'GET';
    if (upper.includes('/PUT')) return 'PUT';
    if (upper.includes('/DELETE')) return 'DELETE';
    return 'GET'; // Default
  }

  /**
   * Find matching AI-suggested scenario for an orphan unit test
   * Uses semantic matching to find the best AI suggestion
   */
  private findMatchingAIScenario(test: UnitTest, aiScenarios: string[]): string | null {
    if (aiScenarios.length === 0) {
      return null;
    }

    const testWords = test.description.toLowerCase().split(/\s+/);
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const aiScenario of aiScenarios) {
      // Remove markers from AI scenario
      const cleanScenario = aiScenario.replace(/\s*(✅|🆕)\s*$/, '').trim();
      const scenarioWords = cleanScenario.toLowerCase().split(/\s+/);
      
      // Calculate word overlap score
      const commonWords = testWords.filter(w => scenarioWords.includes(w)).length;
      
      // If this is the best match so far and has at least 3 common words
      if (commonWords > bestScore && commonWords >= 3) {
        bestScore = commonWords;
        bestMatch = cleanScenario;
      }
    }

    return bestMatch;
  }

  /**
   * Filter unit tests to only include tests relevant to a specific API endpoint
   * Prevents cross-endpoint matching (e.g., GET /{id} tests matching POST scenarios)
   */
  private filterTestsByEndpoint(api: string, unitTests: UnitTest[]): UnitTest[] {
    // Extract endpoint and method from API string
    // API format: "METHOD /path" or "/path" (e.g., "GET /v1/customers/{id}")
    const apiParts = api.trim().split(/\s+/);
    let method: string;
    let endpoint: string;
    
    if (apiParts.length === 2) {
      // Format: "METHOD /path"
      method = apiParts[0].toUpperCase();
      endpoint = apiParts[1];
    } else {
      // Format: "/path" (no method specified)
      method = '';
      endpoint = api;
    }
    
    // Normalize endpoint for matching
    const normalizeEndpoint = (path: string): string => {
      return path
        .replace(/\/v\d+/, '') // Remove version (e.g., /v1)
        .replace(/\{[^}]+\}/g, '') // Remove path parameters (e.g., {id})
        .replace(/\/$/, '') // Remove trailing slash
        .toLowerCase();
    };
    
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const pathSegments = normalizedEndpoint.split('/').filter(s => s.length > 0);
    
    // Define method keywords for each HTTP method
    const methodKeywords: { [key: string]: string[] } = {
      'GET': ['get', 'fetch', 'retrieve', 'find', 'list'],
      'POST': ['post', 'create', 'add', 'insert'],
      'PUT': ['put', 'update', 'modify', 'change'],
      'DELETE': ['delete', 'remove', 'destroy'],
      'PATCH': ['patch', 'update', 'modify']
    };
    
    return unitTests.filter(test => {
      const testDesc = test.description.toLowerCase();
      const testFile = test.file.toLowerCase();
      
      // RULE 1: Path segment matching (required)
      // Test MUST mention at least one path segment (singular or plural)
      const matchesPathSegment = pathSegments.some(segment => {
        if (testDesc.includes(segment) || testFile.includes(segment)) {
          return true;
        }
        const singular = segment.endsWith('s') ? segment.slice(0, -1) : segment;
        if (testDesc.includes(singular) || testFile.includes(singular)) {
          return true;
        }
        return false;
      });
      
      if (!matchesPathSegment && pathSegments.length > 0) {
        return false; // Test doesn't mention any path segments
      }
      
      // RULE 2: Method-specific keyword matching (if method is specified)
      if (method) {
        const expectedKeywords = methodKeywords[method] || [];
        const testId = test.id.toLowerCase();
        
        // Special handling for PATCH - check file name for "patch" or "email" patterns
        if (method === 'PATCH') {
          const hasPatchIndicator = 
            testFile.includes('patch') || 
            testFile.includes('email') ||
            testDesc.includes('patch') ||
            testDesc.includes('email');
          
          if (hasPatchIndicator) {
            // Strong indication this is a PATCH test - include it
            return true;
          }
        }
        
        // Check test description, file name, AND test ID (method name)
        const hasExpectedKeyword = expectedKeywords.some(kw => 
          testDesc.includes(kw) || testFile.includes(kw) || testId.includes(kw)
        );
        
        // Check if test has keywords from OTHER methods (conflicting)
        // BUT: For PATCH/PUT ambiguity, give preference to endpoint structure
        const otherMethods = Object.keys(methodKeywords).filter(m => m !== method);
        const hasConflictingKeyword = otherMethods.some(otherMethod => {
          const otherKeywords = methodKeywords[otherMethod];
          return otherKeywords.some(kw => testDesc.includes(kw) || testId.includes(kw));
        });
        
        // If test has expected keyword, include it
        if (hasExpectedKeyword) {
          // Unless it also has conflicting keywords (ambiguous)
          if (hasConflictingKeyword) {
            // For ambiguous cases, check which keyword is more prominent
            // Count occurrences of each method's keywords
            const expectedCount = expectedKeywords.filter(kw => testDesc.includes(kw)).length;
            const conflictCount = otherMethods.reduce((sum, m) => {
              return sum + methodKeywords[m].filter(kw => testDesc.includes(kw)).length;
            }, 0);
            
            // Include if expected keywords are more prominent
            if (expectedCount <= conflictCount) {
              return false;
            }
          }
          // Has expected keyword and no/fewer conflicts - include
          return true;
        }
        
        // Test doesn't have expected keyword
        // Exclude if it has conflicting keywords
        if (hasConflictingKeyword) {
          return false;
        }
        
        // No expected keyword, no conflicting keyword
        // Check for parameterized paths
        if (endpoint.includes('{id}')) {
          const hasByIdPattern = 
            testDesc.includes('by id') || 
            testDesc.includes('byid') ||
            testDesc.includes('by_id') ||
            testFile.includes('byid');
          
          if (!hasByIdPattern) {
            // Not a "by id" test - exclude unless it's a general list test
            const isGeneralTest = 
              testDesc.includes('all') || 
              testDesc.includes('list') ||
              testDesc.includes('filter');
            return isGeneralTest;
          }
          // Has "by id" pattern - could be for this endpoint
          // But since no method keyword, it's ambiguous - exclude to be safe
          return false;
        }
        
        // No {id}, no method keywords - marginal case, exclude
        return false;
      }
      
      // No method specified in API - less strict filtering
      // Just check path segments (already done above)
      return true;
    });
  }
}
