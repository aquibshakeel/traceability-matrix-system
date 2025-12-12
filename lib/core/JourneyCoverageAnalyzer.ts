/**
 * Journey Coverage Analyzer
 * Analyzes E2E business journey coverage by combining:
 * - E2E test presence
 * - Unit test coverage for each journey step
 * - Baseline scenario coverage
 */

import * as path from 'path';
import { 
  BusinessJourney, 
  JourneyCoverageAnalysis, 
  JourneyAnalysis, 
  StepCoverage,
  JourneyStatus,
  E2ETestFile
} from '../types';
import { E2EJourneyParser } from './E2EJourneyParser';
import { E2ETestScanner } from './E2ETestScanner';

export class JourneyCoverageAnalyzer {
  private projectRoot: string;
  private journeyParser: E2EJourneyParser;
  private testScanner: E2ETestScanner;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.journeyParser = new E2EJourneyParser(projectRoot);
    this.testScanner = new E2ETestScanner(projectRoot);
  }

  /**
   * Analyze all journeys for a service
   */
  async analyzeServiceJourneys(
    serviceName: string,
    servicePath: string,
    apiCoverageData: any[]
  ): Promise<JourneyCoverageAnalysis | null> {
    // Load journeys from YAML
    const journeys = await this.journeyParser.parseJourneyFile(serviceName);

    if (!journeys || journeys.length === 0) {
      return null; // No journeys defined for this service
    }

    console.log(`\n🚀 Analyzing ${journeys.length} business journey(s) for ${serviceName}...`);

    const journeyAnalyses: JourneyAnalysis[] = [];

    for (const journey of journeys) {
      const analysis = await this.analyzeJourney(
        journey,
        servicePath,
        serviceName,
        apiCoverageData
      );
      journeyAnalyses.push(analysis);
    }

    // Calculate summary statistics
    const summary = this.calculateSummary(journeyAnalyses);

    return {
      service: serviceName,
      ...summary,
      journeys: journeyAnalyses,
      overallCoverage: summary.coveredJourneys > 0 
        ? Math.round((summary.coveredJourneys / summary.totalJourneys) * 100) 
        : 0
    };
  }

  /**
   * Analyze a single journey
   */
  private async analyzeJourney(
    journey: BusinessJourney,
    servicePath: string,
    serviceName: string,
    apiCoverageData: any[]
  ): Promise<JourneyAnalysis> {
    // 1. Check E2E tests
    const e2eTestDetails = await this.analyzeE2ETests(
      journey,
      servicePath,
      serviceName
    );
    const e2eTestsFound = e2eTestDetails.length > 0 && 
                          e2eTestDetails.some(t => t.exists);

    // 2. Analyze each step's unit test coverage
    const stepCoverage = this.analyzeSteps(journey, apiCoverageData);

    // 3. Calculate overall coverage
    const overallCoverage = this.calculateJourneyCoverage(stepCoverage);

    // 4. Determine journey status
    const status = this.determineJourneyStatus(
      e2eTestsFound,
      stepCoverage,
      overallCoverage
    );

    // 5. Identify weak points
    const missingSteps = stepCoverage
      .filter(s => !s.apiFound)
      .map(s => s.step.api);

    const weakSteps = journey.steps.filter((step, index) => {
      const coverage = stepCoverage[index];
      return coverage && coverage.status !== 'COVERED' && coverage.apiFound;
    });

    // 6. Generate recommendations
    const recommendations = this.generateRecommendations(
      journey,
      e2eTestsFound,
      stepCoverage,
      status
    );

    console.log(`  ${this.getStatusIcon(status)} ${journey.name}: ${status}`);

    return {
      journey,
      e2eTestsFound,
      e2eTestDetails,
      stepCoverage,
      overallCoverage,
      status,
      missingSteps,
      weakSteps,
      recommendations
    };
  }

  /**
   * Analyze E2E tests for a journey
   */
  private async analyzeE2ETests(
    journey: BusinessJourney,
    servicePath: string,
    serviceName: string
  ): Promise<E2ETestFile[]> {
    if (!journey.e2e_tests || journey.e2e_tests.length === 0) {
      return [];
    }

    return await this.testScanner.scanE2ETests(
      servicePath,
      serviceName,
      journey.e2e_tests
    );
  }

  /**
   * Analyze unit test coverage for each step
   */
  private analyzeSteps(
    journey: BusinessJourney,
    apiCoverageData: any[]
  ): StepCoverage[] {
    return journey.steps.map(step => {
      // Find matching API coverage data
      const apiData = apiCoverageData.find(api => 
        this.normalizeAPI(api.api) === this.normalizeAPI(step.api)
      );

      if (!apiData) {
        // API not found in coverage data
        return {
          step,
          apiFound: false,
          unitTestCoverage: 0,
          unitTestCount: 0,
          baselineScenarios: 0,
          coveredScenarios: 0,
          missingScenarios: 0,
          status: 'NOT_COVERED'
        };
      }

      // API found - extract coverage metrics
      const baselineScenarios = apiData.coveredScenarios + 
                                apiData.partiallyCoveredScenarios + 
                                apiData.uncoveredScenarios;
      const coveredScenarios = apiData.coveredScenarios;
      const missingScenarios = apiData.uncoveredScenarios;
      const unitTestCount = apiData.matchedTests?.length || 0;
      
      const coverage = baselineScenarios > 0
        ? Math.round((coveredScenarios / baselineScenarios) * 100)
        : 0;

      let status: 'COVERED' | 'PARTIAL' | 'NOT_COVERED' = 'NOT_COVERED';
      if (coverage >= 80) {
        status = 'COVERED';
      } else if (coverage > 0) {
        status = 'PARTIAL';
      }

      return {
        step,
        apiFound: true,
        unitTestCoverage: coverage,
        unitTestCount,
        baselineScenarios,
        coveredScenarios,
        missingScenarios,
        status
      };
    });
  }

  /**
   * Calculate overall journey coverage
   */
  private calculateJourneyCoverage(stepCoverage: StepCoverage[]): number {
    if (stepCoverage.length === 0) return 0;

    const totalCoverage = stepCoverage.reduce((sum, step) => 
      sum + step.unitTestCoverage, 0
    );

    return Math.round(totalCoverage / stepCoverage.length);
  }

  /**
   * Determine journey status based on E2E tests and step coverage
   */
  private determineJourneyStatus(
    e2eTestsFound: boolean,
    stepCoverage: StepCoverage[],
    overallCoverage: number
  ): JourneyStatus {
    const hasNotCoveredSteps = stepCoverage.some(s => s.status === 'NOT_COVERED');
    const allStepsCovered = stepCoverage.every(s => s.status === 'COVERED');

    if (!e2eTestsFound) {
      return 'NOT_COVERED';
    }

    if (e2eTestsFound && allStepsCovered && overallCoverage >= 80) {
      return 'FULLY_COVERED';
    }

    if (e2eTestsFound && hasNotCoveredSteps) {
      // Has E2E test but critical steps lack unit tests
      return 'AT_RISK';
    }

    return 'PARTIAL_COVERAGE';
  }

  /**
   * Generate recommendations for journey
   */
  private generateRecommendations(
    journey: BusinessJourney,
    e2eTestsFound: boolean,
    stepCoverage: StepCoverage[],
    status: JourneyStatus
  ): string[] {
    const recommendations: string[] = [];

    // E2E test recommendations
    if (!e2eTestsFound) {
      recommendations.push(
        `🚨 CRITICAL: Create E2E test for "${journey.name}" journey (Priority: ${journey.priority})`
      );
      recommendations.push(
        `Create test file covering all ${journey.steps.length} steps of this flow`
      );
    }

    // Step-level recommendations
    stepCoverage.forEach((step, index) => {
      if (!step.apiFound) {
        recommendations.push(
          `❌ Step ${index + 1}: API "${step.step.api}" not found - verify endpoint exists`
        );
      } else if (step.status === 'NOT_COVERED') {
        recommendations.push(
          `⚠️ Step ${index + 1}: "${step.step.api}" has NO unit tests (0/${step.baselineScenarios} scenarios covered)`
        );
      } else if (step.status === 'PARTIAL') {
        recommendations.push(
          `📝 Step ${index + 1}: "${step.step.api}" needs more unit tests (${step.coveredScenarios}/${step.baselineScenarios} scenarios covered)`
        );
      }
    });

    // Overall journey recommendations
    if (status === 'AT_RISK') {
      recommendations.push(
        `⚠️ Journey "${journey.name}" is AT RISK: Has E2E test but critical unit test gaps exist`
      );
      recommendations.push(
        `Focus on implementing unit tests for uncovered steps before relying on E2E tests`
      );
    }

    if (status === 'FULLY_COVERED') {
      recommendations.push(
        `✅ Journey "${journey.name}" is fully covered! Consider adding edge case scenarios.`
      );
    }

    return recommendations;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(journeyAnalyses: JourneyAnalysis[]): {
    totalJourneys: number;
    coveredJourneys: number;
    partialJourneys: number;
    notCoveredJourneys: number;
    atRiskJourneys: number;
  } {
    const summary = {
      totalJourneys: journeyAnalyses.length,
      coveredJourneys: 0,
      partialJourneys: 0,
      notCoveredJourneys: 0,
      atRiskJourneys: 0
    };

    journeyAnalyses.forEach(analysis => {
      switch (analysis.status) {
        case 'FULLY_COVERED':
          summary.coveredJourneys++;
          break;
        case 'PARTIAL_COVERAGE':
          summary.partialJourneys++;
          break;
        case 'NOT_COVERED':
          summary.notCoveredJourneys++;
          break;
        case 'AT_RISK':
          summary.atRiskJourneys++;
          break;
      }
    });

    return summary;
  }

  /**
   * Normalize API endpoint for comparison
   */
  private normalizeAPI(api: string): string {
    return api
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\/+/g, '/')
      .trim();
  }

  /**
   * Get status icon for display
   */
  private getStatusIcon(status: JourneyStatus): string {
    const icons: Record<JourneyStatus, string> = {
      'FULLY_COVERED': '✅',
      'PARTIAL_COVERAGE': '🟡',
      'NOT_COVERED': '❌',
      'AT_RISK': '⚠️'
    };
    return icons[status];
  }
}
