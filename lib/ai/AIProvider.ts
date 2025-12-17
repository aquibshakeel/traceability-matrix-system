/**
 * AI Provider Interface
 * 
 * All AI providers (Anthropic, OpenAI, Gemini, etc.) must implement this interface.
 * This allows the system to switch between providers without changing core logic.
 */

import {
  APIDefinition,
  Scenarios,
  BaselineScenario,
  UnitTest,
  CoverageAnalysis,
  TestCategories,
  ProviderConfig
} from './types';

export interface AIProvider {
  /**
   * Provider name (e.g., "Anthropic", "OpenAI", "Gemini")
   */
  readonly name: string;

  /**
   * Current model ID being used
   */
  readonly modelId: string;

  /**
   * Initialize the provider with configuration
   * @param config Provider configuration including API key and options
   */
  initialize(config: ProviderConfig): Promise<void>;

  /**
   * Generate test scenarios for an API endpoint
   * @param api API definition including method, endpoint, and OpenAPI spec details
   * @returns Generated test scenarios organized by category
   */
  generateScenarios(api: APIDefinition): Promise<Scenarios>;

  /**
   * Analyze test coverage for baseline scenarios
   * @param api API definition
   * @param scenarios Baseline scenarios to check coverage for
   * @param tests Available unit tests
   * @returns Coverage analysis with matches and recommendations
   */
  analyzeCoverage(
    api: APIDefinition,
    scenarios: BaselineScenario[],
    tests: UnitTest[]
  ): Promise<CoverageAnalysis>;

  /**
   * Categorize orphan tests (tests without baseline scenarios)
   * @param tests Orphan unit tests to categorize
   * @returns Categorizations with priorities and actions
   */
  categorizeOrphans(tests: UnitTest[]): Promise<TestCategories>;

  /**
   * Check if the provider is available and properly configured
   * @returns true if provider can be used
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get provider metadata for logging/reporting
   */
  getMetadata(): {
    name: string;
    model: string;
    version?: string;
  };
}
