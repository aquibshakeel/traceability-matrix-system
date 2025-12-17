/**
 * AI Provider Types
 * 
 * Common types used across all AI providers
 */

/**
 * API Definition for scenario generation
 */
export interface APIDefinition {
  method: string;
  endpoint: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

/**
 * Generated Test Scenarios
 */
export interface Scenarios {
  happy_case?: string[];
  edge_case?: string[];
  error_case?: string[];
  security?: string[];
}

/**
 * Baseline Scenario
 */
export interface BaselineScenario {
  scenario: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  category: 'happy_case' | 'edge_case' | 'error_case' | 'security';
}


/**
 * Coverage Status
 */
export type CoverageStatus = 'FULLY_COVERED' | 'PARTIALLY_COVERED' | 'NOT_COVERED';

/**
 * Coverage Match
 */
export interface CoverageMatch {
  scenario: string;
  status: CoverageStatus;
  testNumbers: number[];
  explanation: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Coverage Analysis Result
 */
export interface CoverageAnalysis {
  matches: CoverageMatch[];
  orphanTests?: number[];
  recommendations?: string[];
}

/**
 * Test Category
 */
export type TestCategory = 'TECHNICAL' | 'BUSINESS';

/**
 * Test Categorization
 */
export interface TestCategorization {
  testNumber: number;
  category: TestCategory;
  subtype: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  action: string;
  reasoning: string;
}

/**
 * Test Categories Result
 */
export interface TestCategories {
  categorizations: TestCategorization[];
  recommendations?: string[];
}

/**
 * Provider Configuration
 */
export interface ProviderConfig {
  provider: string;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  options?: Record<string, any>;
}

/**
 * AI Configuration (from config.json)
 */
export interface AIConfig {
  provider?: string;
  apiKey?: string;
  model?: string;
  useAbstraction?: boolean;
  options?: {
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
}
