/**
 * E2E Business Journey Parser
 * Parses journey YAML files defining end-to-end business flows
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { BusinessJourney, JourneyBaselineFile } from '../types';
import { PathResolver } from '../utils/PathResolver';

export class E2EJourneyParser {
  private projectRoot: string;
  private pathResolver: PathResolver;

  constructor(projectRoot: string, pathResolver: PathResolver) {
    this.projectRoot = projectRoot;
    this.pathResolver = pathResolver;
  }

  /**
   * Parse journey file for a specific service
   */
  async parseJourneyFile(serviceName: string): Promise<BusinessJourney[]> {
    const journeyFilePath = this.pathResolver.resolveJourneyPath(serviceName);
    
    if (!journeyFilePath || !fs.existsSync(journeyFilePath)) {
      console.log(`  ℹ️  No journey file found for ${serviceName}`);
      return [];
    }

    try {
      const content = fs.readFileSync(journeyFilePath, 'utf-8');
      const parsed = yaml.load(content) as JourneyBaselineFile;

      if (!parsed || !parsed.business_journeys) {
        console.log(`  ⚠️  Journey file exists but has no business_journeys: ${journeyFilePath}`);
        return [];
      }

      // Validate service name matches
      if (parsed.service !== serviceName) {
        console.warn(`  ⚠️  Service name mismatch in journey file. Expected: ${serviceName}, Found: ${parsed.service}`);
      }

      console.log(`  ✓ Loaded ${parsed.business_journeys.length} business journey(s) for ${serviceName}`);
      return parsed.business_journeys;
    } catch (error) {
      console.error(`  ❌ Error parsing journey file for ${serviceName}:`, error);
      return [];
    }
  }

  /**
   * Check if journey file exists for a service
   */
  hasJourneyFile(serviceName: string): boolean {
    const journeyFilePath = this.pathResolver.resolveJourneyPath(serviceName);
    return journeyFilePath !== null && fs.existsSync(journeyFilePath);
  }

  /**
   * List all available journey files
   */
  listAvailableJourneyFiles(): string[] {
    const journeysDir = path.join(
      this.projectRoot,
      '.traceability',
      'test-cases',
      'journeys'
    );

    if (!fs.existsSync(journeysDir)) {
      return [];
    }

    return fs.readdirSync(journeysDir)
      .filter(file => file.endsWith('-journeys.yml'))
      .map(file => file.replace('-journeys.yml', ''));
  }

  /**
   * Validate journey structure
   */
  validateJourney(journey: BusinessJourney): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!journey.id) {
      errors.push('Journey missing required field: id');
    }

    if (!journey.name) {
      errors.push('Journey missing required field: name');
    }

    if (!journey.description) {
      errors.push('Journey missing required field: description');
    }

    if (!journey.priority || !['P0', 'P1', 'P2', 'P3'].includes(journey.priority)) {
      errors.push('Journey missing or invalid priority (must be P0, P1, P2, or P3)');
    }

    if (!journey.steps || journey.steps.length === 0) {
      errors.push('Journey must have at least one step');
    }

    // Validate each step
    if (journey.steps) {
      journey.steps.forEach((step, index) => {
        if (!step.api) {
          errors.push(`Step ${index + 1} missing required field: api`);
        }
        if (!step.description) {
          errors.push(`Step ${index + 1} missing required field: description`);
        }
        if (typeof step.required !== 'boolean') {
          errors.push(`Step ${index + 1} missing or invalid field: required (must be boolean)`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get journey statistics
   */
  getJourneyStats(journeys: BusinessJourney[]): {
    total: number;
    byPriority: { P0: number; P1: number; P2: number; P3: number };
    withE2ETests: number;
    withoutE2ETests: number;
    totalSteps: number;
    avgStepsPerJourney: number;
  } {
    const stats = {
      total: journeys.length,
      byPriority: { P0: 0, P1: 0, P2: 0, P3: 0 },
      withE2ETests: 0,
      withoutE2ETests: 0,
      totalSteps: 0,
      avgStepsPerJourney: 0
    };

    journeys.forEach(journey => {
      // Count by priority
      if (journey.priority in stats.byPriority) {
        stats.byPriority[journey.priority as keyof typeof stats.byPriority]++;
      }

      // Count E2E test presence
      if (journey.e2e_tests && journey.e2e_tests.length > 0) {
        stats.withE2ETests++;
      } else {
        stats.withoutE2ETests++;
      }

      // Count steps
      stats.totalSteps += journey.steps.length;
    });

    // Calculate average
    stats.avgStepsPerJourney = stats.total > 0 
      ? Math.round((stats.totalSteps / stats.total) * 10) / 10 
      : 0;

    return stats;
  }
}
