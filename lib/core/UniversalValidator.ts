/**
 * Universal Validator - Core validation engine
 * Language-agnostic validation system for scenario-to-test traceability
 * Supports API change detection, orphan analysis, and comprehensive gap reporting
 */

import { 
  ValidationConfig, 
  ValidationResult, 
  ServiceConfig,
  Scenario,
  UnitTest,
  ValidationSummary,
  ScenarioMapping,
  Gap,
  ValidationError,
  ValidationWarning,
  Recommendation,
  APIChange,
  TraceabilityMatrix
} from '../types';
import { ScenarioLoader } from './ScenarioLoader';
import { TestParserFactory } from './TestParserFactory';
import { SemanticMatcher } from './SemanticMatcher';
import { ReportGenerator } from './ReportGenerator';
import { OrphanTestCategorizer } from './OrphanTestCategorizer';
import { GitAPIChangeDetector } from './GitAPIChangeDetector';

export class UniversalValidator {
  private config: ValidationConfig;
  private scenarioLoader: ScenarioLoader;
  private testParserFactory: TestParserFactory;
  private semanticMatcher: SemanticMatcher;
  private reportGenerator: ReportGenerator;
  private gitDetector: GitAPIChangeDetector;

  constructor(config: ValidationConfig) {
    this.config = config;
    this.scenarioLoader = new ScenarioLoader(config.projectRoot);
    this.testParserFactory = new TestParserFactory();
    this.semanticMatcher = new SemanticMatcher(config.matching);
    this.reportGenerator = new ReportGenerator(config.reporting);
    this.gitDetector = new GitAPIChangeDetector(config.projectRoot);
  }

  /**
   * Validate all enabled services
   */
  async validateAll(): Promise<ValidationResult> {
    const startTime = Date.now();
    const enabledServices = this.config.services.filter(s => s.enabled);
    const result = await this.validateServices(enabledServices);
    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Validate specific services by name
   */
  async validateByServiceNames(serviceNames: string[]): Promise<ValidationResult> {
    const startTime = Date.now();
    const services = this.config.services.filter(
      s => s.enabled && serviceNames.includes(s.name)
    );
    
    if (services.length === 0) {
      throw new Error(`No enabled services found matching: ${serviceNames.join(', ')}`);
    }

    const result = await this.validateServices(services);
    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Validate changed services based on git diff
   */
  async validateChangedServices(changedFiles: string[]): Promise<ValidationResult> {
    const startTime = Date.now();
    const changedServices = this.detectChangedServices(changedFiles);
    
    if (changedServices.length === 0) {
      // No services changed - return success
      const result = this.createEmptyResult();
      result.duration = Date.now() - startTime;
      return result;
    }

    const result = await this.validateByServiceNames(changedServices);
    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Main validation logic
   */
  private async validateServices(services: ServiceConfig[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const allScenarios: Scenario[] = [];
    const allTests: UnitTest[] = [];
    const allMappings: ScenarioMapping[] = [];

    // Process each service
    for (const service of services) {
      try {
        console.log(`\n📋 Processing service: ${service.name}`);
        
        // Load scenarios
        console.log(`  Loading scenarios from: ${service.scenarioFile}`);
        const scenarios = await this.scenarioLoader.loadScenarios(service.scenarioFile);
        console.log(`  ✓ Loaded ${scenarios.length} scenarios`);
        allScenarios.push(...scenarios);

        // Parse unit tests
        console.log(`  Parsing unit tests...`);
        const parser = this.testParserFactory.getParser(service.language, service.testFramework);
        const tests = await parser.parseTests(service);
        console.log(`  ✓ Found ${tests.length} unit tests`);
        allTests.push(...tests);

        // Map scenarios to tests
        console.log(`  Mapping scenarios to tests...`);
        const mappings = this.semanticMatcher.mapScenarios(scenarios, tests);
        console.log(`  ✓ Completed mapping analysis`);
        allMappings.push(...mappings);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({
          type: 'parse_error',
          message: errorMessage,
          service: service.name,
          stack: error instanceof Error ? error.stack : undefined
        });
        console.error(`  ✗ Error processing ${service.name}: ${errorMessage}`);
      }
    }

    // Calculate summary
    const summary = this.calculateSummary(allMappings, allTests, services.length);

    // Identify gaps
    const gaps = this.identifyGaps(allMappings);

    // Identify orphan tests
    const orphanTests = this.identifyOrphanTests(allTests, allMappings);

    // Analyze orphan tests
    const orphanAnalysis = this.analyzeOrphanTests(orphanTests);

    // Identify orphan scenarios
    const orphanScenarios = this.identifyOrphanScenarios(allScenarios, allMappings);

    // Detect API changes (standard detection)
    const apiChanges = this.detectAPIChanges(allScenarios, allTests, allMappings);

    // Detect API changes using Git comparison (HEAD vs HEAD-1)
    const gitAPIChanges = await this.detectGitAPIChanges(services);
    apiChanges.push(...gitAPIChanges);

    // Update summary with API changes count
    summary.apiChangesDetected = apiChanges.length;

    // Generate warnings
    warnings.push(...this.generateWarnings(allMappings, orphanTests, orphanScenarios));

    // Generate recommendations
    const recommendations = this.generateRecommendations(gaps, orphanTests, orphanScenarios);

    // Build traceability matrix
    const traceabilityMatrix = this.buildTraceabilityMatrix(allScenarios, allTests, allMappings);

    // Determine overall success
    const success = this.determineSuccess(summary, gaps, errors);

    return {
      success,
      timestamp: new Date(),
      duration: 0, // Will be set by caller
      summary,
      mappings: allMappings,
      gaps,
      orphanTests,
      orphanScenarios,
      orphanAnalysis,
      apiChanges,
      errors,
      warnings,
      recommendations,
      traceabilityMatrix
    };
  }

  /**
   * Detect which services were changed based on file paths
   */
  private detectChangedServices(changedFiles: string[]): string[] {
    const changedServices = new Set<string>();

    for (const file of changedFiles) {
      for (const service of this.config.services) {
        if (file.startsWith(service.path + '/') || file.includes(service.path)) {
          changedServices.add(service.name);
        }
      }
    }

    return Array.from(changedServices);
  }

  /**
   * Calculate validation summary statistics
   */
  private calculateSummary(
    mappings: ScenarioMapping[], 
    tests: UnitTest[],
    servicesAnalyzed: number
  ): ValidationSummary {
    const totalScenarios = mappings.length;
    const fullyCovered = mappings.filter(m => m.coverageStatus === 'Fully Covered').length;
    const partiallyCovered = mappings.filter(m => m.coverageStatus === 'Partially Covered').length;
    const notCovered = mappings.filter(m => m.coverageStatus === 'Not Covered').length;
    const totalTests = tests.length;
    
    // Count orphans
    const mappedTestIds = new Set<string>();
    mappings.forEach(m => m.matchedTests.forEach(t => mappedTestIds.add(t.id)));
    const orphanTests = tests.filter(t => !mappedTestIds.has(t.id)).length;

    // Count orphan scenarios
    const orphanScenarios = mappings.filter(m => 
      m.coverageStatus === 'Not Covered'
    ).length;

    const coveragePercent = totalScenarios > 0 
      ? Math.round((fullyCovered / totalScenarios) * 100) 
      : 0;

    // Count gaps by priority
    const p0Gaps = mappings.filter(m => 
      m.coverageStatus === 'Not Covered' && m.scenario.priority === 'P0'
    ).length;
    const p1Gaps = mappings.filter(m => 
      m.coverageStatus === 'Not Covered' && m.scenario.priority === 'P1'
    ).length;
    const p2Gaps = mappings.filter(m => 
      m.coverageStatus === 'Not Covered' && m.scenario.priority === 'P2'
    ).length;
    const p3Gaps = mappings.filter(m => 
      m.coverageStatus === 'Not Covered' && m.scenario.priority === 'P3'
    ).length;

    // Count gaps by risk level
    const criticalGaps = mappings.filter(m => 
      m.coverageStatus === 'Not Covered' && m.scenario.riskLevel === 'Critical'
    ).length;
    const highRiskGaps = mappings.filter(m => 
      m.coverageStatus === 'Not Covered' && m.scenario.riskLevel === 'High'
    ).length;
    const mediumRiskGaps = mappings.filter(m => 
      m.coverageStatus === 'Not Covered' && m.scenario.riskLevel === 'Medium'
    ).length;
    const lowRiskGaps = mappings.filter(m => 
      m.coverageStatus === 'Not Covered' && m.scenario.riskLevel === 'Low'
    ).length;

    return {
      totalScenarios,
      fullyCovered,
      partiallyCovered,
      notCovered,
      totalTests,
      orphanTests,
      orphanScenarios,
      coveragePercent,
      p0Gaps,
      p1Gaps,
      p2Gaps,
      p3Gaps,
      criticalGaps,
      highRiskGaps,
      mediumRiskGaps,
      lowRiskGaps,
      servicesAnalyzed,
      apiChangesDetected: 0 // Will be updated later
    };
  }

  /**
   * Identify gaps that need attention
   */
  private identifyGaps(mappings: ScenarioMapping[]): Gap[] {
    const gaps: Gap[] = [];

    for (const mapping of mappings) {
      if (mapping.coverageStatus === 'Not Covered') {
        gaps.push({
          scenario: mapping.scenario,
          reason: 'no_unit_test_found',
          impact: `${mapping.scenario.priority} priority scenario without coverage. Risk: ${mapping.scenario.riskLevel}`,
          severity: mapping.scenario.priority,
          recommendations: [
            `Create unit test for: ${mapping.scenario.description}`,
            `Target API: ${mapping.scenario.apiEndpoint || 'N/A'}`,
            `Risk Level: ${mapping.scenario.riskLevel}`,
            `Business Impact: ${mapping.scenario.businessImpact || 'Not specified'}`
          ],
          actionRequired: 'Developer - Create Test',
          estimatedEffort: mapping.scenario.estimatedEffort
        });
      } else if (mapping.coverageStatus === 'Partially Covered') {
        gaps.push({
          scenario: mapping.scenario,
          reason: 'insufficient_coverage',
          impact: 'Scenario has partial coverage but needs more comprehensive testing',
          severity: mapping.scenario.priority,
          recommendations: [
            'Add additional unit tests to cover edge cases',
            'Ensure all business rules are validated',
            'Review test assertions for completeness'
          ],
          actionRequired: 'Developer - Update Test',
          estimatedEffort: 'Low'
        });
      }
    }

    // Sort gaps by severity
    gaps.sort((a, b) => {
      const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
      return priorityOrder[a.severity] - priorityOrder[b.severity];
    });

    return gaps;
  }

  /**
   * Identify tests that aren't mapped to any scenario
   */
  private identifyOrphanTests(tests: UnitTest[], mappings: ScenarioMapping[]): UnitTest[] {
    const mappedTestIds = new Set<string>();
    mappings.forEach(m => m.matchedTests.forEach(t => mappedTestIds.add(t.id)));
    
    return tests.filter(t => !mappedTestIds.has(t.id));
  }

  /**
   * Analyze orphan tests to categorize them
   */
  private analyzeOrphanTests(orphanTests: UnitTest[]) {
    // Use the dedicated OrphanTestCategorizer for proper categorization
    const categorizer = new OrphanTestCategorizer();
    return categorizer.categorizeOrphanTests(orphanTests);
  }

  /**
   * Identify scenarios that don't have any test coverage
   */
  private identifyOrphanScenarios(scenarios: Scenario[], mappings: ScenarioMapping[]): Scenario[] {
    return mappings
      .filter(m => m.coverageStatus === 'Not Covered')
      .map(m => m.scenario);
  }

  /**
   * Detect API changes using Git comparison (HEAD vs HEAD-1)
   * This catches API+Test deletions that bypass normal detection
   */
  private async detectGitAPIChanges(services: ServiceConfig[]): Promise<APIChange[]> {
    const allChanges: APIChange[] = [];

    for (const service of services) {
      try {
        const changes = await this.gitDetector.detectChanges(service);
        allChanges.push(...changes);
      } catch (error) {
        console.warn(`Git detection skipped for ${service.name}: ${error}`);
      }
    }

    return allChanges;
  }

  /**
   * Detect API changes (additions, removals, modifications)
   * Standard detection based on current state
   */
  private detectAPIChanges(
    scenarios: Scenario[],
    tests: UnitTest[],
    mappings: ScenarioMapping[]
  ): APIChange[] {
    const apiChanges: APIChange[] = [];

    // Detect orphan scenarios that might indicate removed APIs
    const orphanScenarios = mappings.filter(m => m.coverageStatus === 'Not Covered');
    
    for (const mapping of orphanScenarios) {
      if (mapping.scenario.apiEndpoint) {
        // Check if no test references this API endpoint
        const endpoint = mapping.scenario.apiEndpoint.toLowerCase();
        const hasTestForAPI = tests.some(t => 
          t.description && t.description.toLowerCase().includes(endpoint)
        );

        if (!hasTestForAPI) {
          apiChanges.push({
            type: 'API Removed',
            apiEndpoint: mapping.scenario.apiEndpoint,
            httpMethod: mapping.scenario.httpMethod,
            affectedScenarios: [mapping.scenario],
            affectedTests: [],
            detectedAt: new Date(),
            impact: 'Scenario exists but no tests or API implementation found - May indicate removed feature',
            recommendations: [
              'Verify if API was intentionally removed',
              'Update or remove outdated scenario',
              'If API exists, create corresponding unit test'
            ]
          });
        }
      }
    }

    return apiChanges;
  }

  /**
   * Generate warnings for potential issues
   */
  private generateWarnings(
    mappings: ScenarioMapping[],
    orphanTests: UnitTest[],
    orphanScenarios: Scenario[]
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Warn about orphan tests
    if (orphanTests.length > 0) {
      warnings.push({
        type: 'orphan_test',
        message: `Found ${orphanTests.length} test(s) not mapped to any scenario`,
        severity: 'Medium',
        recommendations: [
          'Create scenarios for orphan tests',
          'Or verify if tests are still relevant'
        ]
      });
    }

    // Warn about orphan scenarios
    if (orphanScenarios.length > 0) {
      warnings.push({
        type: 'orphan_scenario',
        message: `Found ${orphanScenarios.length} scenario(s) without test coverage`,
        severity: 'High',
        recommendations: [
          'Create unit tests for uncovered scenarios',
          'Or mark scenarios as requiring manual testing only'
        ]
      });
    }

    // Warn about low match scores
    const lowMatchMappings = mappings.filter(m => 
      m.matchedTests.length > 0 && m.matchScore < 0.7
    );
    if (lowMatchMappings.length > 0) {
      warnings.push({
        type: 'low_match_score',
        message: `Found ${lowMatchMappings.length} scenario(s) with low confidence matches`,
        severity: 'Low',
        recommendations: [
          'Review matches manually',
          'Consider improving test descriptions',
          'Or update scenario matching rules'
        ]
      });
    }

    return warnings;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    gaps: Gap[],
    orphanTests: UnitTest[],
    orphanScenarios: Scenario[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recommendations for P0 gaps
    const p0Gaps = gaps.filter(g => g.severity === 'P0');
    if (p0Gaps.length > 0) {
      recommendations.push({
        type: 'create_test',
        title: `Critical: ${p0Gaps.length} P0 scenario(s) without tests`,
        description: 'P0 scenarios are critical and must have test coverage immediately',
        priority: 'P0',
        effort: 'High',
        assignedTo: 'Developer'
      });
    }

    // Recommendations for orphan tests
    if (orphanTests.length > 5) {
      recommendations.push({
        type: 'update_scenario',
        title: `Create scenarios for ${orphanTests.length} orphan tests`,
        description: 'Tests without scenarios make traceability difficult',
        priority: 'P2',
        effort: 'Medium',
        assignedTo: 'QA'
      });
    }

    return recommendations;
  }

  /**
   * Build traceability matrix
   */
  private buildTraceabilityMatrix(
    scenarios: Scenario[],
    tests: UnitTest[],
    mappings: ScenarioMapping[]
  ): TraceabilityMatrix {
    const matrix: any[][] = [];
    const headers = ['Scenario ID', ...tests.map(t => (t.id || 'unknown').substring(0, 20))];
    const rowLabels = scenarios.map(s => s.id);

    for (const scenario of scenarios) {
      const row: any[] = [scenario.id];
      
      for (const test of tests) {
        const mapping = mappings.find(m => m.scenario.id === scenario.id);
        const isMatched = mapping?.matchedTests.some(t => t.id === test.id);
        
        row.push({
          scenarioId: scenario.id,
          testId: test.id,
          mapped: isMatched || false,
          matchScore: isMatched ? mapping!.matchScore : 0,
          status: mapping?.coverageStatus || 'Not Covered'
        });
      }
      
      matrix.push(row);
    }

    const fullyCovered = mappings.filter(m => m.coverageStatus === 'Fully Covered').length;
    const partiallyCovered = mappings.filter(m => m.coverageStatus === 'Partially Covered').length;
    const notCovered = mappings.filter(m => m.coverageStatus === 'Not Covered').length;

    return {
      scenarios,
      tests,
      matrix,
      headers,
      rowLabels,
      statistics: {
        totalCells: scenarios.length * tests.length,
        mappedCells: matrix.flat().filter((cell: any) => cell.mapped).length,
        unmappedCells: matrix.flat().filter((cell: any) => !cell.mapped).length,
        coveragePercent: scenarios.length > 0 ? Math.round((fullyCovered / scenarios.length) * 100) : 0,
        fullyCoveredScenarios: fullyCovered,
        partiallyCoveredScenarios: partiallyCovered,
        uncoveredScenarios: notCovered
      }
    };
  }

  /**
   * Determine if validation should pass or fail
   */
  private determineSuccess(
    summary: ValidationSummary, 
    gaps: Gap[], 
    errors: ValidationError[]
  ): boolean {
    // Fail if there are errors
    if (errors.length > 0) {
      return false;
    }

    const rules = this.config.validation;

    // Strict mode: fail on any gaps
    if (rules.strictMode && gaps.length > 0) {
      return false;
    }

    // Fail on P0 gaps (critical)
    if (rules.blockOnCriticalGaps && summary.p0Gaps > 0) {
      return false;
    }

    // Fail on critical risk gaps
    if (rules.blockOnCriticalGaps && summary.criticalGaps > 0) {
      return false;
    }

    // Fail on high risk gaps if configured
    if (rules.blockOnHighRiskGaps && summary.highRiskGaps > 0) {
      return false;
    }

    // Fail on orphan tests if not allowed
    if (!rules.allowOrphanTests && summary.orphanTests > 0) {
      return false;
    }

    // Fail if orphan tests exceed warning threshold
    if (summary.orphanTests > rules.maxOrphanTestsWarning) {
      return false;
    }

    // Fail if coverage is below minimum threshold
    if (summary.coveragePercent < rules.minimumCoveragePercent) {
      return false;
    }

    return true;
  }

  /**
   * Create empty result for no changes
   */
  private createEmptyResult(): ValidationResult {
    return {
      success: true,
      timestamp: new Date(),
      duration: 0,
      summary: {
        totalScenarios: 0,
        fullyCovered: 0,
        partiallyCovered: 0,
        notCovered: 0,
        totalTests: 0,
        orphanTests: 0,
        orphanScenarios: 0,
        coveragePercent: 100,
        p0Gaps: 0,
        p1Gaps: 0,
        p2Gaps: 0,
        p3Gaps: 0,
        criticalGaps: 0,
        highRiskGaps: 0,
        mediumRiskGaps: 0,
        lowRiskGaps: 0,
        servicesAnalyzed: 0,
        apiChangesDetected: 0
      },
      mappings: [],
      gaps: [],
      orphanTests: [],
      orphanScenarios: [],
      orphanAnalysis: {
        totalOrphans: 0,
        technicalTests: [],
        businessTests: [],
        technicalCount: 0,
        businessCount: 0,
        actionRequiredCount: 0,
        categorization: []
      },
      apiChanges: [],
      errors: [],
      warnings: [],
      recommendations: [],
      traceabilityMatrix: {
        scenarios: [],
        tests: [],
        matrix: [],
        headers: [],
        rowLabels: [],
        statistics: {
          totalCells: 0,
          mappedCells: 0,
          unmappedCells: 0,
          coveragePercent: 100,
          fullyCoveredScenarios: 0,
          partiallyCoveredScenarios: 0,
          uncoveredScenarios: 0
        }
      }
    };
  }

  /**
   * Generate reports from validation result
   */
  async generateReports(result: ValidationResult): Promise<void> {
    await this.reportGenerator.generate(result);
  }

  /**
   * Convenience method: validate and generate reports
   */
  async validateAndReport(serviceNames?: string[]): Promise<ValidationResult> {
    const result = serviceNames 
      ? await this.validateByServiceNames(serviceNames)
      : await this.validateAll();
    
    await this.generateReports(result);
    
    return result;
  }
}
