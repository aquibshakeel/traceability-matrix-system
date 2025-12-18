/**
 * Path Resolution Utility
 * 
 * Handles path resolution with three-tier fallback system:
 * 1. Environment Variables (highest priority)
 * 2. Config File overrides (medium priority)
 * 3. Default paths (lowest priority - backward compatible)
 * 
 * This enables the traceability system to work with:
 * - Internal services (same repo)
 * - External services (different repos)
 * - Mixed setups (some internal, some external)
 */

import * as path from 'path';
import * as fs from 'fs';
import { EnvConfig } from './EnvConfig';

export interface PathResolutionResult {
  servicePath: string;
  baselinePath: string;
  source: 'env' | 'config' | 'default';
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class PathResolver {
  private projectRoot: string;
  private config: any;
  private cliOverrides: { servicePath?: string; baselinePath?: string };

  constructor(projectRoot: string, config: any, cliOverrides?: { servicePath?: string; baselinePath?: string }) {
    this.projectRoot = projectRoot;
    this.config = config;
    this.cliOverrides = cliOverrides || {};
  }

  /**
   * Resolve service path with five-tier fallback
   * Priority: CLI Override > Per-Service ENV > Shared ENV > Config > Default
   */
  resolveServicePath(serviceName: string): PathResolutionResult['servicePath'] {
    // Tier -1: CLI override (ABSOLUTE HIGHEST PRIORITY)
    if (this.cliOverrides.servicePath) {
      const cliPath = this.cliOverrides.servicePath;
      if (fs.existsSync(cliPath)) {
        return cliPath;
      }
      // If CLI path provided but doesn't exist, still try it (let downstream handle the error)
      return cliPath;
    }

    // Tier 0: Per-service environment variable (highest priority after CLI)
    // e.g., IDENTITY_SERVICE_PATH for identity-service
    const perServiceEnvKey = `${serviceName.toUpperCase().replace(/-/g, '_')}_PATH`;
    const perServicePath = process.env[perServiceEnvKey];
    if (perServicePath && fs.existsSync(perServicePath)) {
      return perServicePath;
    }

    // Tier 1: Shared SERVICE_PATH environment variable
    const envServicePath = EnvConfig.getServicePath();
    if (envServicePath) {
      // If SERVICE_PATH points to the service directly
      if (fs.existsSync(envServicePath) && this.isServiceDirectory(envServicePath)) {
        return envServicePath;
      }
      // If SERVICE_PATH points to parent directory containing service
      const serviceInEnvPath = path.join(envServicePath, serviceName);
      if (fs.existsSync(serviceInEnvPath)) {
        return serviceInEnvPath;
      }
    }

    // Tier 1b: SERVICES_ROOT environment variable
    const envServicesRoot = EnvConfig.getServicesRoot();
    if (envServicesRoot) {
      const serviceInRoot = path.join(envServicesRoot, serviceName);
      if (fs.existsSync(serviceInRoot)) {
        return serviceInRoot;
      }
    }

    // Tier 2: Config file override
    const externalRoot = this.config.externalPaths?.servicesRoot;
    if (externalRoot) {
      const service = this.config.services?.find((s: any) => s.name === serviceName);
      if (service) {
        const servicePath = path.join(externalRoot, service.path || serviceName);
        if (fs.existsSync(servicePath)) {
          return servicePath;
        }
      }
    }

    // Tier 3: Default (backward compatible)
    const service = this.config.services?.find((s: any) => s.name === serviceName);
    if (service && service.path) {
      const defaultPath = path.join(this.projectRoot, service.path);
      if (fs.existsSync(defaultPath)) {
        return defaultPath;
      }
    }

    // Final fallback: try services directory
    const fallbackPath = path.join(this.projectRoot, 'services', serviceName);
    if (fs.existsSync(fallbackPath)) {
      return fallbackPath;
    }

    throw new Error(`Service path not found: ${serviceName}. Tried ENV, config, and default locations.`);
  }

  /**
   * Resolve baseline scenario path with five-tier fallback
   * Priority: CLI Override > Per-Service ENV > Shared ENV > Config > Default
   */
  resolveBaselinePath(serviceName: string): PathResolutionResult['baselinePath'] {
    const baselineFileName = `${serviceName}-baseline.yml`;

    // Tier -1: CLI override (ABSOLUTE HIGHEST PRIORITY)
    if (this.cliOverrides.baselinePath) {
      const cliPath = this.cliOverrides.baselinePath;
      if (fs.existsSync(cliPath)) {
        return cliPath;
      }
      // If CLI path provided but doesn't exist, still try it (let downstream handle the error)
      return cliPath;
    }

    // Tier 0: Per-service baseline environment variable (highest priority after CLI)
    // e.g., IDENTITY_SERVICE_BASELINE for identity-service
    const perServiceBaselineKey = `${serviceName.toUpperCase().replace(/-/g, '_')}_BASELINE`;
    const perServiceBaseline = process.env[perServiceBaselineKey];
    if (perServiceBaseline && fs.existsSync(perServiceBaseline)) {
      return perServiceBaseline;
    }

    // Tier 1: Shared TEST_SCENARIO_PATH environment variable
    const envScenarioPath = EnvConfig.getTestScenarioPath();
    if (envScenarioPath) {
      // If TEST_SCENARIO_PATH points directly to baseline directory
      const baselineInEnv = path.join(envScenarioPath, baselineFileName);
      if (fs.existsSync(baselineInEnv)) {
        return baselineInEnv;
      }
      // If TEST_SCENARIO_PATH points to test-cases root
      const baselineInEnvSubdir = path.join(envScenarioPath, 'baseline', baselineFileName);
      if (fs.existsSync(baselineInEnvSubdir)) {
        return baselineInEnvSubdir;
      }
    }

    // Tier 1b: TEST_CASES_ROOT environment variable
    const envTestCasesRoot = EnvConfig.getTestCasesRoot();
    if (envTestCasesRoot) {
      const baselineInRoot = path.join(envTestCasesRoot, 'baseline', baselineFileName);
      if (fs.existsSync(baselineInRoot)) {
        return baselineInRoot;
      }
    }

    // Tier 2: Config file override
    const externalRoot = this.config.externalPaths?.testCasesRoot;
    if (externalRoot) {
      const baselineInConfig = path.join(externalRoot, 'baseline', baselineFileName);
      if (fs.existsSync(baselineInConfig)) {
        return baselineInConfig;
      }
    }

    // Tier 3: Default (backward compatible)
    const testCasesDir = this.config.testCases?.baselineDirectory || 
                         '.traceability/test-cases/baseline';
    const defaultPath = path.join(this.projectRoot, testCasesDir, baselineFileName);
    if (fs.existsSync(defaultPath)) {
      return defaultPath;
    }

    throw new Error(`Baseline not found: ${baselineFileName}. Tried ENV, config, and default locations.`);
  }

  /**
   * Resolve AI cases path - ALWAYS stored locally in framework
   * AI cases are generated by the framework and stored locally, not in external repos
   */
  resolveAICasesPath(serviceName: string): string {
    const aiCasesFileName = `${serviceName}-ai.yml`;
    
    // AI cases are ALWAYS stored locally in the framework
    const aiCasesDir = this.config.paths?.aiCasesDirectory || '.traceability/ai_cases';
    const localPath = path.join(this.projectRoot, aiCasesDir, aiCasesFileName);
    
    return localPath; // Return path even if file doesn't exist yet (will be created)
  }

  /**
   * Resolve journey path with four-tier fallback (same as baseline)
   * Priority: Per-Service ENV > Shared ENV > Config > Default
   * Journeys are stored in external QA repo alongside baselines
   */
  resolveJourneyPath(serviceName: string): string | null {
    const journeyFileName = `${serviceName}-journeys.yml`;

    // Tier 0: Per-service journey environment variable (highest priority)
    // e.g., IDENTITY_SERVICE_JOURNEY for identity-service
    const perServiceJourneyKey = `${serviceName.toUpperCase().replace(/-/g, '_')}_JOURNEY`;
    const perServiceJourney = process.env[perServiceJourneyKey];
    if (perServiceJourney && fs.existsSync(perServiceJourney)) {
      return perServiceJourney;
    }

    // Tier 1: Shared TEST_SCENARIO_PATH environment variable
    const envScenarioPath = EnvConfig.getTestScenarioPath();
    if (envScenarioPath) {
      // If TEST_SCENARIO_PATH points to test-cases root, check journeys subdir
      const journeyInEnvSubdir = path.join(envScenarioPath, '..', 'journeys', journeyFileName);
      if (fs.existsSync(journeyInEnvSubdir)) {
        return journeyInEnvSubdir;
      }
      // Also try journeys at same level as baseline
      const journeyInEnv = path.join(path.dirname(envScenarioPath), 'journeys', journeyFileName);
      if (fs.existsSync(journeyInEnv)) {
        return journeyInEnv;
      }
    }

    // Tier 1b: TEST_CASES_ROOT environment variable
    const envTestCasesRoot = EnvConfig.getTestCasesRoot();
    if (envTestCasesRoot) {
      const journeyInRoot = path.join(envTestCasesRoot, 'journeys', journeyFileName);
      if (fs.existsSync(journeyInRoot)) {
        return journeyInRoot;
      }
    }

    // Tier 2: Config file override
    const externalRoot = this.config.externalPaths?.testCasesRoot;
    if (externalRoot) {
      const journeyInConfig = path.join(externalRoot, 'journeys', journeyFileName);
      if (fs.existsSync(journeyInConfig)) {
        return journeyInConfig;
      }
    }

    // Tier 3: Default (backward compatible)
    const testCasesDir = this.config.testCases?.journeysDirectory || 
                         '.traceability/test-cases/journeys';
    const defaultPath = path.join(this.projectRoot, testCasesDir, journeyFileName);
    if (fs.existsSync(defaultPath)) {
      return defaultPath;
    }

    // Journey files are optional, return null if not found
    return null;
  }

  /**
   * Get path resolution source for logging
   */
  getResolutionSource(serviceName: string): {
    service: 'env' | 'config' | 'default';
    baseline: 'env' | 'config' | 'default';
  } {
    const result = {
      service: 'default' as 'env' | 'config' | 'default',
      baseline: 'default' as 'env' | 'config' | 'default'
    };

    // Check service source
    if (EnvConfig.getServicePath() || EnvConfig.getServicesRoot()) {
      result.service = 'env';
    } else if (this.config.externalPaths?.servicesRoot) {
      result.service = 'config';
    }

    // Check baseline source
    if (EnvConfig.getTestScenarioPath() || EnvConfig.getTestCasesRoot()) {
      result.baseline = 'env';
    } else if (this.config.externalPaths?.testCasesRoot) {
      result.baseline = 'config';
    }

    return result;
  }

  /**
   * Validate all required paths exist and are accessible
   */
  validatePaths(serviceNames: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const serviceName of serviceNames) {
      // Validate service path
      try {
        const servicePath = this.resolveServicePath(serviceName);
        if (!fs.existsSync(servicePath)) {
          errors.push(`Service path does not exist: ${servicePath}`);
        } else if (!this.isServiceDirectory(servicePath)) {
          warnings.push(`Service path exists but may not be a valid service: ${servicePath}`);
        }
      } catch (error: any) {
        errors.push(`Failed to resolve service path for ${serviceName}: ${error.message}`);
      }

      // Validate baseline path
      try {
        const baselinePath = this.resolveBaselinePath(serviceName);
        if (!fs.existsSync(baselinePath)) {
          errors.push(`Baseline not found: ${baselinePath}`);
        }
      } catch (error: any) {
        errors.push(`Failed to resolve baseline path for ${serviceName}: ${error.message}`);
      }

      // Check AI cases (optional, so just warnings)
      const aiCasesPath = this.resolveAICasesPath(serviceName);
      if (!aiCasesPath) {
        warnings.push(`AI cases not found for ${serviceName} (optional)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Log resolved paths for debugging
   */
  logResolvedPaths(serviceName: string): void {
    console.log(`\n📁 Resolved Paths for ${serviceName}:`);
    
    const sources = this.getResolutionSource(serviceName);
    
    try {
      const servicePath = this.resolveServicePath(serviceName);
      console.log(`   Service: ${servicePath} (${sources.service})`);
    } catch (error: any) {
      console.log(`   Service: ❌ ${error.message}`);
    }

    try {
      const baselinePath = this.resolveBaselinePath(serviceName);
      console.log(`   Baseline: ${baselinePath} (${sources.baseline})`);
    } catch (error: any) {
      console.log(`   Baseline: ❌ ${error.message}`);
    }

    const aiCasesPath = this.resolveAICasesPath(serviceName);
    if (aiCasesPath) {
      console.log(`   AI Cases: ${aiCasesPath} (optional)`);
    }

    console.log(`   Reports: ${path.join(this.projectRoot, '.traceability/reports')} (local)`);
  }

  /**
   * Check if directory looks like a service directory
   */
  private isServiceDirectory(dirPath: string): boolean {
    // Check for common service indicators
    const indicators = [
      'src',
      'build.gradle',
      'pom.xml',
      'package.json',
      'go.mod',
      'requirements.txt'
    ];

    return indicators.some(indicator => 
      fs.existsSync(path.join(dirPath, indicator))
    );
  }

  /**
   * Get human-readable path configuration summary
   */
  getPathConfigSummary(): string[] {
    const summary: string[] = [];

    const envServicePath = EnvConfig.getServicePath();
    const envServicesRoot = EnvConfig.getServicesRoot();
    const envScenarioPath = EnvConfig.getTestScenarioPath();
    const envTestCasesRoot = EnvConfig.getTestCasesRoot();
    const configServicesRoot = this.config.externalPaths?.servicesRoot;
    const configTestCasesRoot = this.config.externalPaths?.testCasesRoot;

    // Service paths
    if (envServicePath) {
      summary.push(`Services: ${envServicePath} (ENV: SERVICE_PATH)`);
    } else if (envServicesRoot) {
      summary.push(`Services: ${envServicesRoot} (ENV: SERVICES_ROOT)`);
    } else if (configServicesRoot) {
      summary.push(`Services: ${configServicesRoot} (config.json)`);
    } else {
      summary.push(`Services: ./services/ (default)`);
    }

    // Scenario paths
    if (envScenarioPath) {
      summary.push(`Scenarios: ${envScenarioPath} (ENV: TEST_SCENARIO_PATH)`);
    } else if (envTestCasesRoot) {
      summary.push(`Scenarios: ${envTestCasesRoot}/baseline (ENV: TEST_CASES_ROOT)`);
    } else if (configTestCasesRoot) {
      summary.push(`Scenarios: ${configTestCasesRoot}/baseline (config.json)`);
    } else {
      summary.push(`Scenarios: ./.traceability/test-cases/baseline/ (default)`);
    }

    summary.push(`Reports: ./.traceability/reports/ (always local)`);

    return summary;
  }
}
