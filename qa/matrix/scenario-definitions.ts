/**
 * Scenario Definitions
 * Defines all business scenarios for traceability mapping
 */

export type ScenarioCategory = 'Positive' | 'Negative' | 'Edge' | 'DB_Failure' | 'Kafka_Failure';
export type CoverageStatus = 'Fully Covered' | 'Partially Covered' | 'Not Covered';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export interface Scenario {
  id: string;
  description: string;
  category: ScenarioCategory;
  apiEndpoint: string;
  unitTestPatterns: string[]; // Regex patterns to match unit tests
  expectedCoverage: 'full' | 'partial' | 'none';
  riskLevel: RiskLevel;
  priority: Priority;
  businessImpact: string;
}

/**
 * All business scenarios defined by QA
 */
export const SCENARIOS: Scenario[] = [
  // Positive Flow Scenarios
  {
    id: 'HF001',
    description: 'Create user with valid payload',
    category: 'Positive',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'should create.*user.*success',
      'should create a user',
      'create.*user.*valid'
    ],
    expectedCoverage: 'full',
    riskLevel: 'Low',
    priority: 'P3',
    businessImpact: 'Core functionality - must work'
  },
  {
    id: 'HF002',
    description: 'Get user with valid ID',
    category: 'Positive',
    apiEndpoint: 'GET /api/user/:id',
    unitTestPatterns: [
      'should return user.*found',
      'should return.*200',
      'get.*user.*success'
    ],
    expectedCoverage: 'full',
    riskLevel: 'Low',
    priority: 'P3',
    businessImpact: 'Core functionality - must work'
  },

  // Negative Flow Scenarios
  {
    id: 'NF001',
    description: 'Create user missing required field (email)',
    category: 'Negative',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'missing.*email',
      '400.*missing.*email',
      'should return 400.*missing email'
    ],
    expectedCoverage: 'full',
    riskLevel: 'Medium',
    priority: 'P2',
    businessImpact: 'API contract validation'
  },
  {
    id: 'NF002',
    description: 'Get user with invalid ID (404)',
    category: 'Negative',
    apiEndpoint: 'GET /api/user/:id',
    unitTestPatterns: [
      'not found',
      '404',
      'user.*not.*found',
      'should throw.*not found'
    ],
    expectedCoverage: 'full',
    riskLevel: 'Low',
    priority: 'P3',
    businessImpact: 'Proper error handling'
  },
  {
    id: 'NF003',
    description: 'Malformed JSON payload (400)',
    category: 'Negative',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'malformed.*json',
      'invalid.*json',
      'parse.*error'
    ],
    expectedCoverage: 'none',
    riskLevel: 'Medium',
    priority: 'P1',
    businessImpact: 'Security - prevents crashes from bad input'
  },
  {
    id: 'NF004',
    description: 'Duplicate email (409)',
    category: 'Negative',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'duplicate.*email',
      'already.*exists',
      '409',
      'email.*exists'
    ],
    expectedCoverage: 'full',
    riskLevel: 'Low',
    priority: 'P3',
    businessImpact: 'Data integrity'
  },
  {
    id: 'NF005',
    description: 'Invalid email format (400)',
    category: 'Negative',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'invalid.*email.*format',
      'email.*format',
      'validate.*email'
    ],
    expectedCoverage: 'full',
    riskLevel: 'Low',
    priority: 'P3',
    businessImpact: 'Data quality'
  },
  {
    id: 'NF006',
    description: 'Missing name field (400)',
    category: 'Negative',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'missing.*name',
      '400.*name',
      'should return 400.*missing name'
    ],
    expectedCoverage: 'partial',
    riskLevel: 'Medium',
    priority: 'P2',
    businessImpact: 'API contract validation'
  },
  {
    id: 'NF007',
    description: 'Empty string values (400)',
    category: 'Negative',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'empty.*string',
      'blank.*field',
      'empty.*email|name'
    ],
    expectedCoverage: 'none',
    riskLevel: 'Low',
    priority: 'P2',
    businessImpact: 'Data quality'
  },

  // Edge Case Scenarios
  {
    id: 'EC001',
    description: 'Boundary-condition input (Max string length)',
    category: 'Edge',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'max.*length',
      'boundary',
      'long.*string'
    ],
    expectedCoverage: 'partial',
    riskLevel: 'Medium',
    priority: 'P2',
    businessImpact: 'Prevents buffer overflow/DB issues'
  },
  {
    id: 'EC002',
    description: 'Very long email (>254 chars)',
    category: 'Edge',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'long.*email',
      'email.*254',
      'RFC.*5321'
    ],
    expectedCoverage: 'none',
    riskLevel: 'Low',
    priority: 'P2',
    businessImpact: 'RFC compliance'
  },
  {
    id: 'EC003',
    description: 'Special characters in name',
    category: 'Edge',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'special.*char',
      'unicode',
      'emoji'
    ],
    expectedCoverage: 'none',
    riskLevel: 'Low',
    priority: 'P2',
    businessImpact: 'Internationalization support'
  },

  // Database Failure Scenarios
  {
    id: 'DB001',
    description: 'DB timeout during user creation',
    category: 'DB_Failure',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'timeout',
      'db.*timeout',
      'database.*timeout'
    ],
    expectedCoverage: 'none',
    riskLevel: 'High',
    priority: 'P0',
    businessImpact: 'Production stability - must handle gracefully'
  },
  {
    id: 'DB002',
    description: 'DB connection failure',
    category: 'DB_Failure',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'connection.*fail',
      'db.*fail',
      'cannot.*connect'
    ],
    expectedCoverage: 'none',
    riskLevel: 'High',
    priority: 'P0',
    businessImpact: 'Service availability'
  },
  {
    id: 'DB003',
    description: 'DB duplicate key error',
    category: 'DB_Failure',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'duplicate.*key',
      'duplicate.*email',
      'already.*exists'
    ],
    expectedCoverage: 'full',
    riskLevel: 'Low',
    priority: 'P3',
    businessImpact: 'Handled via duplicate email check'
  },

  // Kafka Failure Scenarios
  {
    id: 'KAF001',
    description: 'Kafka publish failure post-DB commit',
    category: 'Kafka_Failure',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'kafka.*fail',
      'publish.*fail',
      'publish.*error'
    ],
    expectedCoverage: 'none',
    riskLevel: 'High',
    priority: 'P0',
    businessImpact: 'Data consistency across microservices'
  },
  {
    id: 'KAF002',
    description: 'Kafka connection failure',
    category: 'Kafka_Failure',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'kafka.*connect',
      'connection.*error',
      'handle.*connection.*error'
    ],
    expectedCoverage: 'partial',
    riskLevel: 'High',
    priority: 'P0',
    businessImpact: 'Business continuity'
  },
  {
    id: 'KAF003',
    description: 'Kafka timeout',
    category: 'Kafka_Failure',
    apiEndpoint: 'POST /api/user',
    unitTestPatterns: [
      'kafka.*timeout',
      'publish.*timeout'
    ],
    expectedCoverage: 'none',
    riskLevel: 'Medium',
    priority: 'P1',
    businessImpact: 'Performance degradation'
  }
];

/**
 * Get scenarios by category
 */
export function getScenariosByCategory(category: ScenarioCategory): Scenario[] {
  return SCENARIOS.filter(s => s.category === category);
}

/**
 * Get scenarios by priority
 */
export function getScenariosByPriority(priority: Priority): Scenario[] {
  return SCENARIOS.filter(s => s.priority === priority);
}

/**
 * Get scenarios by risk level
 */
export function getScenariosByRisk(risk: RiskLevel): Scenario[] {
  return SCENARIOS.filter(s => s.riskLevel === risk);
}
