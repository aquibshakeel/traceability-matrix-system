/**
 * Scenario Mapper
 * Maps business scenarios to unit tests and detects coverage gaps
 */

import { UnitTest } from './parse-unit-tests';
import { Scenario, CoverageStatus } from './scenario-definitions';

export interface ScenarioMapping {
  scenario: Scenario;
  matchedTests: UnitTest[];
  coverageStatus: CoverageStatus;
  gapExplanation: string;
}

export class ScenarioMapper {
  private matchedTestIds: Set<string> = new Set();

  /**
   * Map all scenarios to unit tests
   */
  mapScenarios(scenarios: Scenario[], unitTests: UnitTest[]): ScenarioMapping[] {
    const mappings: ScenarioMapping[] = [];
    
    // Reset matched tests tracker
    this.matchedTestIds.clear();

    for (const scenario of scenarios) {
      const mapping = this.mapSingleScenario(scenario, unitTests);
      mappings.push(mapping);
    }

    return mappings;
  }

  /**
   * Map a single scenario to unit tests
   */
  private mapSingleScenario(scenario: Scenario, unitTests: UnitTest[]): ScenarioMapping {
    const matchedTests: UnitTest[] = [];

    // Try to match unit tests using patterns
    for (const pattern of scenario.unitTestPatterns) {
      const regex = new RegExp(pattern, 'i');
      const matches = unitTests.filter(test => regex.test(test.description));
      
      for (const match of matches) {
        // Avoid duplicates
        if (!matchedTests.find(t => t.id === match.id)) {
          matchedTests.push(match);
          // Track this test as matched
          this.matchedTestIds.add(match.id);
        }
      }
    }

    // Determine coverage status and gap explanation
    const { coverageStatus, gapExplanation } = this.determineCoverage(
      scenario,
      matchedTests
    );

    return {
      scenario,
      matchedTests,
      coverageStatus,
      gapExplanation
    };
  }

  /**
   * Determine coverage status based on matched tests and expected coverage
   */
  private determineCoverage(
    scenario: Scenario,
    matchedTests: UnitTest[]
  ): { coverageStatus: CoverageStatus; gapExplanation: string } {
    const testCount = matchedTests.length;

    if (scenario.expectedCoverage === 'none') {
      if (testCount === 0) {
        return {
          coverageStatus: 'Not Covered',
          gapExplanation: this.getGapExplanation(scenario, testCount)
        };
      } else {
        // Unexpectedly found coverage
        return {
          coverageStatus: 'Fully Covered',
          gapExplanation: 'Unexpectedly covered by unit tests'
        };
      }
    }

    if (scenario.expectedCoverage === 'partial') {
      if (testCount === 0) {
        return {
          coverageStatus: 'Not Covered',
          gapExplanation: this.getGapExplanation(scenario, testCount)
        };
      } else if (testCount === 1) {
        return {
          coverageStatus: 'Partially Covered',
          gapExplanation: 'Some aspects covered, but incomplete validation'
        };
      } else {
        return {
          coverageStatus: 'Fully Covered',
          gapExplanation: 'None. Scenario properly validated.'
        };
      }
    }

    // expectedCoverage === 'full'
    if (testCount === 0) {
      return {
        coverageStatus: 'Not Covered',
        gapExplanation: this.getGapExplanation(scenario, testCount)
      };
    } else if (testCount === 1) {
      return {
        coverageStatus: 'Fully Covered',
        gapExplanation: 'None. Happy path is properly validated.'
      };
    } else {
      return {
        coverageStatus: 'Fully Covered',
        gapExplanation: 'None. Multiple unit tests cover this scenario comprehensively.'
      };
    }
  }

  /**
   * Generate gap explanation
   */
  private getGapExplanation(scenario: Scenario, testCount: number): string {
    if (testCount > 0) {
      return 'Partial coverage detected but insufficient';
    }

    // Generate specific gap explanations based on scenario
    const gapTemplates: Record<string, string> = {
      'NF003': 'CRITICAL GAP: No unit test validates graceful handling of malformed JSON. Relies on framework behavior.',
      'NF006': 'GAP: While missing email is tested, missing name is not separately validated.',
      'NF007': 'GAP: No test for empty strings in email/name fields (as opposed to null/undefined).',
      'EC001': 'Unit test only checks name boundary. Missing boundary check for email field.',
      'EC002': 'GAP: RFC 5321 max email length (254 chars) not validated.',
      'EC003': 'GAP: No validation for special chars, emojis, or unicode in name field.',
      'DB001': 'CRITICAL GAP: No unit test verifies service rollback/retry or correct 500 status when DB times out.',
      'DB002': 'CRITICAL GAP: No test for initial DB connection failure handling.',
      'KAF001': 'CRITICAL GAP: No test verifies service handles Kafka failure gracefully (logging, DLQ, non-blocking).',
      'KAF002': 'Test exists but doesn\'t verify user creation succeeds if Kafka is unavailable.',
      'KAF003': 'GAP: No test for Kafka publish timeout scenario.'
    };

    return gapTemplates[scenario.id] || 'No unit test coverage found for this scenario.';
  }

  /**
   * Calculate coverage statistics
   */
  calculateStatistics(mappings: ScenarioMapping[]) {
    const stats = {
      total: mappings.length,
      fullyCovered: 0,
      partiallyCovered: 0,
      notCovered: 0,
      byCategory: {} as Record<string, { total: number; covered: number; partial: number; notCovered: number }>,
      byPriority: {} as Record<string, number>,
      byRisk: {} as Record<string, number>
    };

    for (const mapping of mappings) {
      // Overall counts
      if (mapping.coverageStatus === 'Fully Covered') {
        stats.fullyCovered++;
      } else if (mapping.coverageStatus === 'Partially Covered') {
        stats.partiallyCovered++;
      } else {
        stats.notCovered++;
      }

      // By category
      const category = mapping.scenario.category;
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = { total: 0, covered: 0, partial: 0, notCovered: 0 };
      }
      stats.byCategory[category].total++;
      if (mapping.coverageStatus === 'Fully Covered') {
        stats.byCategory[category].covered++;
      } else if (mapping.coverageStatus === 'Partially Covered') {
        stats.byCategory[category].partial++;
      } else {
        stats.byCategory[category].notCovered++;
      }

      // By priority (only gaps)
      if (mapping.coverageStatus !== 'Fully Covered') {
        const priority = mapping.scenario.priority;
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
      }

      // By risk (only gaps)
      if (mapping.coverageStatus !== 'Fully Covered') {
        const risk = mapping.scenario.riskLevel;
        stats.byRisk[risk] = (stats.byRisk[risk] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Get critical gaps (P0 priority)
   */
  getCriticalGaps(mappings: ScenarioMapping[]): ScenarioMapping[] {
    return mappings.filter(
      m => m.scenario.priority === 'P0' && m.coverageStatus !== 'Fully Covered'
    );
  }

  /**
   * Get high priority gaps (P1 priority)
   */
  getHighPriorityGaps(mappings: ScenarioMapping[]): ScenarioMapping[] {
    return mappings.filter(
      m => m.scenario.priority === 'P1' && m.coverageStatus !== 'Fully Covered'
    );
  }

  /**
   * Get all gaps
   */
  getAllGaps(mappings: ScenarioMapping[]): ScenarioMapping[] {
    return mappings.filter(m => m.coverageStatus !== 'Fully Covered');
  }

  /**
   * Get orphan unit tests (tests not mapped to any scenario)
   */
  getOrphanTests(allUnitTests: UnitTest[]): UnitTest[] {
    return allUnitTests.filter(test => !this.matchedTestIds.has(test.id));
  }
}
