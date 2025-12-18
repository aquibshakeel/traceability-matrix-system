/**
 * Enhanced Coverage Analyzer
 * AI-powered coverage analysis with orphan categorization, gap detection, and reporting
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { TestParserFactory } from './TestParserFactory';
import { ServiceConfig, UnitTest, OrphanTestCategory, Priority, JourneyCoverageAnalysis } from '../types';
import { AIProviderFactory, AIProvider } from '../ai';
import { APIScanner } from './APIScanner';
import { BaselineValidator } from '../validation/BaselineSchema';
import { HistoryTracker } from './HistoryTracker';
import { HistoryManager } from './HistoryManager';
import { PathResolver } from '../utils/PathResolver';

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
  journeyAnalysis?: JourneyCoverageAnalysis | null; // Optional - E2E business journey coverage
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
  p3Gaps: number; // CRITICAL FIX: P3 was missing!
  criticalIssues: string[];
}

export class EnhancedCoverageAnalyzer {
  private provider: AIProvider | null = null;
  private apiKey: string;
  private testParser: TestParserFactory;
  private projectRoot: string;
  private config: any;
  private pathResolver: PathResolver;
  private apiScanner: APIScanner;
  private baselineValidator: BaselineValidator;
  private historyManager: HistoryManager;
  private fileTimestamps = new Map<string, number>();

  constructor(apiKey: string, projectRoot: string, config?: any) {
    this.apiKey = apiKey;
    this.projectRoot = projectRoot;
    this.config = config || {};
    this.pathResolver = new PathResolver(projectRoot, this.config);
    this.testParser = new TestParserFactory();
    this.apiScanner = new APIScanner();
    this.baselineValidator = new BaselineValidator();
    this.historyManager = new HistoryManager(projectRoot);
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

  private async getProvider(): Promise<AIProvider> {
    if (!this.provider) {
      this.provider = await AIProviderFactory.create(this.apiKey);
    }
    return this.provider;
  }

  async analyze(service: ServiceConfig): Promise<CoverageAnalysis> {
    console.log(`\n📊 Analyzing: ${service.name}`);
    console.log('='.repeat(70));

    // Resolve service path using PathResolver if not already set
    if (!service.path) {
      service.path = this.pathResolver.resolveServicePath(service.name);
    }

    // Scan APIs from actual code
    const discoveredAPIs = await this.apiScanner.scanAPIs(service);
    
    // Load baseline using PathResolver (supports ENV, config, or default paths)
    const baselinePath = this.pathResolver.resolveBaselinePath(service.name);
    if (!fs.existsSync(baselinePath)) {
      throw new Error(`Baseline not found: ${baselinePath}`);
    }
    
    const baseline = this.loadYAML(baselinePath);
    
    // Extract API mapping if present (new format with unique keys)
    const apiMapping = baseline.api_mapping || {};
    
    // Load AI cases for completeness check (stored locally in framework)
    const aiCasesPath = this.pathResolver.resolveAICasesPath(service.name);
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
    
    // Track which APIs we've analyzed from baseline
    const analyzedAPIs = new Set<string>();
    
    for (const [apiKey, categories] of Object.entries(baseline)) {
      if (apiKey === 'service' || apiKey === 'api_mapping') continue;
      
      // Get actual API endpoint from mapping (or use key as-is for old format)
      const actualAPI = apiMapping[apiKey] || apiKey;
      
      console.log(`\n${actualAPI}:`);
      const aiSuggestions = aiCases && aiCases[actualAPI] ? aiCases[actualAPI] : null;
      const analysis = await this.analyzeAPI(actualAPI, categories as any, unitTests, aiSuggestions);
      apiAnalyses.push(analysis);
      gaps.push(...analysis.gaps);
      analyzedAPIs.add(actualAPI);
    }
    
    // CRITICAL FIX: Add any discovered APIs that are NOT in baseline
    // This ensures ALL APIs appear in the report (customer service shows all 4 APIs)
    for (const discoveredAPI of discoveredAPIs) {
      const actualAPIKey = `${discoveredAPI.method} ${discoveredAPI.endpoint}`;
      
      if (!analyzedAPIs.has(actualAPIKey)) {
        // This API was discovered but not in baseline
        console.log(`\n${actualAPIKey}:`);
        console.log(`  ℹ️  API discovered in code but not in baseline`);
        
        // Check if it has tests
        const relevantTests = this.filterTestsByEndpoint(actualAPIKey, unitTests);
        
        if (relevantTests.length > 0) {
          console.log(`  ⚠️  Found ${relevantTests.length} unit tests but NO baseline scenarios`);
          console.log(`  📋 Action: QA should add baseline scenarios for these tests`);
        } else {
          console.log(`  ⚠️  No baseline scenarios AND no unit tests - will be flagged as Orphan API`);
        }
        
        // Create analysis entry with 0 scenarios
        // CRITICAL: If tests exist, add them to matchedTests so report shows them
        const matchedTests = relevantTests.length > 0 ? relevantTests.map(test => ({
          scenario: `Orphan test: ${test.description}`,
          tests: [test],
          status: 'NOT_COVERED',
          matchDetails: [{
            testDescription: test.description,
            file: test.file,
            lineNumber: test.lineNumber,
            matchConfidence: 'HIGH' as const
          }]
        })) : [];
        
        const analysis: APIAnalysis = {
          api: actualAPIKey,
          scenarios: [],
          coveredScenarios: 0,
          partiallyCoveredScenarios: 0,
          uncoveredScenarios: 0,
          matchedTests,
          gaps: [],
          aiAnalysis: relevantTests.length > 0 ? {
            coverageStatus: 'critical',
            message: `⚠️ Found ${relevantTests.length} unit tests but NO baseline scenarios. QA must add baseline to document what these tests cover.`,
            suggestedScenarios: [],
            missingScenarios: 0
          } : {
            coverageStatus: 'critical',
            message: '❌ No baseline scenarios AND no unit tests. This API is completely untested and undocumented.',
            suggestedScenarios: [],
            missingScenarios: 0
          }
        };
        
        apiAnalyses.push(analysis);
        analyzedAPIs.add(actualAPIKey);
      }
    }

    // Categorize orphan tests
    console.log(`\n🔍 Categorizing orphan tests...`);
    const orphanAnalysis = await this.categorizeOrphanTests(unitTests, apiAnalyses);

    // Calculate summary
    const summary = this.calculateSummary(apiAnalyses, gaps);
    
    // Calculate visual analytics
    const visualAnalytics = this.calculateVisualAnalytics(apiAnalyses, gaps, orphanAnalysis, service.name);
    
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

    // Analyze E2E business journeys (optional - only if journey file exists)
    let journeyAnalysis = null;
    try {
      const { JourneyCoverageAnalyzer } = await import('./JourneyCoverageAnalyzer');
      const journeyAnalyzer = new JourneyCoverageAnalyzer(this.projectRoot, this.pathResolver);
      
      journeyAnalysis = await journeyAnalyzer.analyzeServiceJourneys(
        service.name,
        service.path,
        apiAnalyses
      );
    } catch (error) {
      // Silently skip journey analysis if it fails - feature is optional
      console.log(`  ℹ️  Journey analysis skipped (optional feature)`);
    }

    console.log('\n' + '='.repeat(70));
    console.log(`📈 Coverage: ${summary.coveragePercent.toFixed(1)}%`);
    console.log(`✅ Covered: ${summary.fullyCovered}/${summary.totalScenarios}`);
    console.log(`⚠️  Gaps: P0=${summary.p0Gaps}, P1=${summary.p1Gaps}, P2=${summary.p2Gaps}, P3=${summary.p3Gaps}`); // CRITICAL FIX: Added P3!
    console.log(`🔍 Orphans: ${orphanAnalysis.totalOrphans} tests (${orphanAnalysis.businessTests.length} need scenarios)`);
    if (orphanAPIs.length > 0) {
      console.log(`⚠️  Orphan APIs: ${orphanAPIs.length} APIs with no scenarios AND no tests`);
    }
    if (journeyAnalysis) {
      console.log(`🚀 Business Journeys: ${journeyAnalysis.coveredJourneys}/${journeyAnalysis.totalJourneys} covered`);
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
      visualAnalytics,
      journeyAnalysis
    };
  }

  private async analyzeAPI(api: string, categories: any, unitTests: UnitTest[], aiSuggestions: any = null): Promise<APIAnalysis> {
    // Handle null/undefined categories (empty baseline entry)
    if (!categories || categories === null) {
      const relevantTests = this.filterTestsByEndpoint(api, unitTests);
      
      if (relevantTests.length === 0) {
        console.log(`  ⚠️  0 scenarios, 0 unit tests - will be flagged as Orphan API`);
      } else {
        console.log(`  ⚠️  0 scenarios but ${relevantTests.length} unit tests exist - tests will be flagged as orphans`);
      }
      
      // Don't add to matchedTests - let them be detected as orphans naturally
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
    
    // If baseline has 0 scenarios, check if tests exist before returning
    if (scenarios.length === 0) {
      // Filter tests to see if any exist for this API
      const relevantTests = this.filterTestsByEndpoint(api, unitTests);
      
      if (relevantTests.length === 0) {
        console.log(`  ⚠️  0 scenarios, 0 unit tests - will be flagged as Orphan API`);
      } else {
        console.log(`  ⚠️  0 scenarios but ${relevantTests.length} unit tests exist - tests will be flagged as orphans`);
      }
      
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
      const provider = await this.getProvider();
      const coverageResult = await provider.analyzeCoverage(
        { method: this.extractHttpMethod(api), endpoint: api },
        scenarios.map(s => ({ scenario: s, priority: this.inferPriority(s), category: 'happy_case' })),
        relevantTests
      );

      // Transform to expected format
      const analysis = {
        matches: coverageResult.matches.map(m => ({
          scenario: m.scenario,
          testNumbers: m.testNumbers,
          status: m.status,
          explanation: m.explanation,
          missing: m.status !== 'FULLY_COVERED' ? 'Needs additional coverage' : undefined
        }))
      };
      
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
        missingScenarios,  // Pass the full array, not just length
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
      const provider = await this.getProvider();
      const categorizationResult = await provider.categorizeOrphans(orphans);

      // Transform to expected format
      const result = {
        categorizations: categorizationResult.categorizations.map((cat, index) => ({
          testNumber: index + 1,
          category: cat.category,
          subtype: cat.subtype,
          priority: cat.priority,
          action: cat.action,
          reason: cat.reasoning
        }))
      };

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
    missingScenarios: string[],  // Changed from number to string[]
    hasMissingScenarios: boolean
  ): { coverageStatus: 'excellent' | 'good' | 'needs_improvement' | 'critical'; message: string; missingScenarios?: number; suggestedScenarios?: string[] } {
    const coveragePercent = totalScenarios > 0 ? (coveredCount / totalScenarios) * 100 : 0;
    const missingCount = missingScenarios.length;
    
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
      missingScenarios: hasMissingScenarios ? missingCount : undefined,
      suggestedScenarios: hasMissingScenarios ? missingScenarios : undefined
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
    const p3Gaps = gaps.filter(g => g.priority === 'P3').length; // CRITICAL FIX: Added P3!

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
      p3Gaps, // CRITICAL FIX: Return P3!
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
    orphanAnalysis: OrphanTestAnalysis,
    serviceName: string
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

    // Coverage trend - load historical data
    const totalScenarios = fullyCovered + partiallyCovered + notCovered;
    const currentCoverage = totalScenarios > 0 ? (fullyCovered / totalScenarios) * 100 : 0;
    
    // Load historical coverage data from HistoryManager
    const history = this.historyManager.loadHistory(serviceName);
    const coverageTrend = history.coverageTrends
      .slice(-30) // Last 30 entries
      .map(entry => ({
        timestamp: entry.timestamp, // Keep original timestamp for chart
        date: new Date(entry.timestamp).toISOString().split('T')[0],
        coverage: entry.coveragePercent,
        coveragePercent: entry.coveragePercent // For compatibility
      }));
    
    // Add current snapshot if not already present
    const today = new Date().toISOString();
    const todayDate = today.split('T')[0];
    const hasToday = coverageTrend.some(t => t.date === todayDate);
    if (!hasToday) {
      coverageTrend.push({
        timestamp: today,
        date: todayDate,
        coverage: currentCoverage,
        coveragePercent: currentCoverage
      });
    }

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
      const provider = await this.getProvider();
      // For now, generate a simple summary since this is a specialized function
      // In future, we could add this to the AIProvider interface
      return `These ${orphanAPIs.length} API endpoints have no baseline scenarios and no unit tests. QA should create baseline scenarios, then Dev implements tests.`;
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
    const commentedAPIs = this.detectCommentedBaseline(baseline.service || 'customer-service');
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
    
    // REVERSE CHECK: Check baseline entries that have no code implementation
    // These are documented APIs (in baseline) but not found in actual code
    for (const [uniqueKey, categories] of Object.entries(baseline)) {
      if (uniqueKey === 'service' || uniqueKey === 'api_mapping') continue;
      
      const actualAPIKey = apiMapping[uniqueKey];
      if (!actualAPIKey) continue; // Skip if no mapping
      
      // Parse method and endpoint
      const parts = actualAPIKey.split(/\s+/);
      const method = parts.length === 2 ? parts[0] : 'GET';
      const endpoint = parts.length === 2 ? parts[1] : actualAPIKey;
      
      // Check if this API was already added (from discoveredAPIs or commented loop)
      const alreadyAdded = orphanAPIs.some(o => o.method === method && o.endpoint === endpoint);
      if (alreadyAdded) continue;
      
      // Count scenarios
      let scenarioCount = 0;
      if (categories && categories !== null && typeof categories === 'object') {
        scenarioCount = this.flattenScenarios(categories).length;
      }
      
      // Check if API has tests
      const hasTests = unitTests.some(test => {
        const testDesc = test.description.toLowerCase();
        const testFile = test.file.toLowerCase();
        const endpointLower = endpoint.toLowerCase();
        
        // Simple check: does test mention endpoint?
        const endpointParts = endpointLower.split('/').filter((p: string) => p && p !== 'api' && !p.includes('{'));
        return endpointParts.some((part: string) => testDesc.includes(part) || testFile.includes(part));
      });
      
      // If baseline entry has 0 scenarios AND 0 tests, it's orphan
      if (scenarioCount === 0 && !hasTests) {
        orphanAPIs.push({
          method,
          endpoint,
          controller: 'Baseline entry only',
          lineNumber: 0,
          hasScenario: false,
          hasTest: false,
          riskLevel: 'Critical'
        });
      }
    }

    return orphanAPIs;
  }
  
  /**
   * Detect commented API keys in baseline YAML
   * Returns list of API keys that are commented out
   */
  private detectCommentedBaseline(serviceName: string): string[] {
    const baselinePath = path.join(this.projectRoot, '.traceability/test-cases/baseline', `${serviceName}-baseline.yml`);
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
   * 
   * CRITICAL FIX: Path segment matching is PRIMARY, method keywords are SECONDARY
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
    
    // Extract the main resource/action from endpoint (last segment)
    // This is the MOST SPECIFIC part (e.g., "login" in "/identity/login")
    const mainResource = pathSegments[pathSegments.length - 1] || '';
    
    // Get the second-to-last segment (often the resource type)
    const parentResource = pathSegments.length > 1 ? pathSegments[pathSegments.length - 2] : '';
    
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
      const testId = test.id.toLowerCase();
      
      // RULE 1: Path segment matching (PRIMARY filter - most important)
      // CRITICAL: Prioritize the MOST SPECIFIC segment (last one) to distinguish
      // between similar endpoints like /identity/login vs /identity/register
      
      // Check if test mentions the MAIN RESOURCE (most specific - e.g., "login" or "register")
      const matchesMainResource = mainResource && (
        testDesc.includes(mainResource) || 
        testFile.includes(mainResource)
      );
      
      // Check if test mentions the parent resource (e.g., "identity")
      const matchesParentResource = parentResource && (
        testDesc.includes(parentResource) || 
        testFile.includes(parentResource)
      );
      
      // Check if test mentions ANY path segment (fallback)
      const matchesAnySegment = pathSegments.some(segment => {
        if (testDesc.includes(segment) || testFile.includes(segment)) {
          return true;
        }
        const singular = segment.endsWith('s') ? segment.slice(0, -1) : segment;
        if (testDesc.includes(singular) || testFile.includes(singular)) {
          return true;
        }
        return false;
      });
      
      // CRITICAL LOGIC:
      // 1. If MAIN resource matches (e.g., "login"), INCLUDE (most specific match)
      // 2. If ONLY parent matches (e.g., "identity") but NO main resource, EXCLUDE
      //    (test is for different endpoint under same parent)
      // 3. If neither matches, exclude
      
      if (mainResource) {
        // Main resource exists (e.g., "login" in "/identity/login")
        if (matchesMainResource) {
          // Test mentions "login" - definitely for this endpoint
          return true;
        } else if (matchesParentResource && !matchesMainResource) {
          // Test mentions "identity" but NOT "login"
          // This is likely a test for a different endpoint (e.g., /identity/register)
          return false;
        } else if (!matchesAnySegment) {
          // Test doesn't mention any segments - exclude
          return false;
        }
      } else {
        // No main resource, use generic matching
        if (!matchesAnySegment && pathSegments.length > 0) {
          return false;
        }
      }
      
      // RULE 2: Method-specific filtering (SECONDARY - only to prevent cross-method pollution)
      // This rule should ENHANCE filtering, not BLOCK valid tests
      if (method) {
        const expectedKeywords = methodKeywords[method] || [];
        
        // Special handling for PATCH - check file name for "patch" or "email" patterns
        if (method === 'PATCH') {
          const hasPatchIndicator = 
            testFile.includes('patch') || 
            testFile.includes('email') ||
            testDesc.includes('patch') ||
            testDesc.includes('email');
          
          if (hasPatchIndicator) {
            return true; // Strong indication this is a PATCH test
          }
        }
        
        // Check if test file name indicates this is for the right endpoint
        // e.g., "IdentityControllerLoginTest.java" for POST /identity/login
        const endpointFileName = mainResource ? mainResource.replace(/-/g, '') : '';
        const matchesFileName = endpointFileName && testFile.includes(endpointFileName);
        
        // If test file name matches endpoint AND main resource matches, include it
        // This handles cases like "LoginTest" for "/identity/login"
        if (matchesFileName && matchesMainResource) {
          return true; // File name indicates this is the right test file
        }
        
        // Check if test has method-specific keywords
        const hasExpectedKeyword = expectedKeywords.some(kw => 
          testDesc.includes(kw) || testFile.includes(kw) || testId.includes(kw)
        );
        
        // Check if test has keywords from OTHER methods (conflicting)
        const otherMethods = Object.keys(methodKeywords).filter(m => m !== method);
        const hasConflictingKeyword = otherMethods.some(otherMethod => {
          const otherKeywords = methodKeywords[otherMethod];
          return otherKeywords.some(kw => testDesc.includes(kw) || testId.includes(kw));
        });
        
        // CRITICAL FIX: If path segments match but no method keywords found,
        // INCLUDE the test (don't exclude it) - method keywords are optional
        if (!hasExpectedKeyword && !hasConflictingKeyword) {
          // Path matches, no conflicting keywords - INCLUDE IT
          return true;
        }
        
        // If test has expected keyword, include it (unless strong conflict)
        if (hasExpectedKeyword) {
          if (hasConflictingKeyword) {
            // Check which keyword is more prominent
            const expectedCount = expectedKeywords.filter(kw => testDesc.includes(kw)).length;
            const conflictCount = otherMethods.reduce((sum, m) => {
              return sum + methodKeywords[m].filter(kw => testDesc.includes(kw)).length;
            }, 0);
            
            // Exclude only if conflicts are MORE prominent
            if (expectedCount < conflictCount) {
              return false;
            }
          }
          return true;
        }
        
        // Test has conflicting keyword but no expected keyword
        // Only exclude if conflict is strong (not just one keyword)
        if (hasConflictingKeyword) {
          const conflictCount = otherMethods.reduce((sum, m) => {
            return sum + methodKeywords[m].filter(kw => testDesc.includes(kw) || testId.includes(kw)).length;
          }, 0);
          
          // Strong conflict (2+ conflicting keywords) - exclude
          if (conflictCount >= 2) {
            return false;
          }
          
          // Weak conflict (1 keyword) - check parameterized paths
          if (endpoint.includes('{id}')) {
            const hasByIdPattern = 
              testDesc.includes('by id') || 
              testDesc.includes('byid') ||
              testDesc.includes('by_id') ||
              testFile.includes('byid');
            
            // If this is a "by id" test and we have a {id} path param, include it
            if (hasByIdPattern) {
              return true;
            }
            
            // Not a "by id" test - exclude if conflict present
            return false;
          }
          
          // No {id} param, weak conflict - exclude to be safe
          return false;
        }
        
        // No conflicts, path matches - INCLUDE
        return true;
      }
      
      // No method specified in API - less strict filtering
      // Just check path segments (already done above)
      return true;
    });
  }
}
