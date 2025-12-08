/**
 * Universal Unit-Test Traceability Validator - Type Definitions
 * Complete type system for language-agnostic test validation
 */

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface ValidationConfig {
  projectRoot: string;
  services: ServiceConfig[];
  matching: MatchingConfig;
  reporting: ReportingConfig;
  validation: ValidationRules;
  preCommit?: PreCommitConfig;
}

export interface ServiceConfig {
  name: string;
  enabled: boolean;
  path: string;
  language: SupportedLanguage;
  testFramework: SupportedFramework;
  testDirectory: string;
  testPattern: string;
  scenarioFile: string;
  scenarioFormat?: ScenarioFormat;
  requiresServiceRunning?: boolean;
  startCommand?: string;
  stopCommand?: string;
  healthCheckUrl?: string;
  healthCheckTimeout?: number;
}

export type SupportedLanguage = 
  | 'typescript' 
  | 'javascript' 
  | 'java' 
  | 'python' 
  | 'go' 
  | 'ruby'
  | 'csharp'
  | 'kotlin'
  | 'php'
  | 'rust';

export type SupportedFramework = 
  | 'jest' 
  | 'mocha' 
  | 'jasmine' 
  | 'junit' 
  | 'testng'
  | 'pytest' 
  | 'go-test' 
  | 'rspec'
  | 'nunit'
  | 'xunit'
  | 'phpunit'
  | 'cargo-test';

export type ScenarioFormat = 'yaml' | 'json' | 'txt' | 'markdown';

export interface PreCommitConfig {
  enabled: boolean;
  blockOnP0Gaps: boolean;
  blockOnP1Gaps: boolean;
  allowOrphanTests: boolean;
  maxOrphanTestsThreshold: number;
  validateChangedServicesOnly: boolean;
}

// ============================================================================
// MATCHING & SEMANTIC ANALYSIS TYPES
// ============================================================================

export interface MatchingConfig {
  strategies: MatchingStrategy[];
  defaultThreshold: number;
  weights: MatchingWeights;
  normalization: NormalizationConfig;
  synonyms: Record<string, string[]>;
  stopWords: string[];
  customRules?: CustomMatchingRule[];
}

export type MatchingStrategy = 
  | 'exact' 
  | 'fuzzy' 
  | 'semantic' 
  | 'keyword' 
  | 'regex'
  | 'levenshtein'
  | 'jaccard';

export interface MatchingWeights {
  exact: number;
  fuzzy: number;
  semantic: number;
  keyword: number;
  regex?: number;
  levenshtein?: number;
  jaccard?: number;
}

export interface NormalizationConfig {
  lowercase: boolean;
  removePunctuation: boolean;
  removeExtraSpaces: boolean;
  synonymExpansion: boolean;
  stemming: boolean;
  removeStopWords: boolean;
}

export interface CustomMatchingRule {
  name: string;
  pattern: string;
  weight: number;
  enabled: boolean;
}

// ============================================================================
// REPORTING TYPES
// ============================================================================

export interface ReportingConfig {
  formats: ReportFormat[];
  outputDirectory: string;
  includeOrphans: boolean;
  includeGaps: boolean;
  includeStatistics: boolean;
  includeTrends: boolean;
  htmlTemplate?: string;
  generateCharts: boolean;
  emailNotifications?: EmailConfig;
}

export type ReportFormat = 
  | 'html' 
  | 'json' 
  | 'markdown' 
  | 'xml' 
  | 'junit'
  | 'csv'
  | 'pdf';

export interface EmailConfig {
  enabled: boolean;
  recipients: string[];
  smtpServer: string;
  from: string;
  subjectPrefix: string;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export interface ValidationRules {
  requireScenarioForEveryTest: boolean;
  requireTestForEveryScenario: boolean;
  requireTestForNewAPI: boolean;
  allowOrphanTests: boolean;
  maxOrphanTestsWarning: number;
  blockOnOrphanAPI: boolean;
  strictMode: boolean;
  minimumCoveragePercent: number;
  blockOnCriticalGaps: boolean;
  blockOnHighRiskGaps: boolean;
  allowPartialCoverage: boolean;
}

// ============================================================================
// SCENARIO TYPES
// ============================================================================

export interface Scenario {
  id: string;
  manualTestId?: string;
  module?: string;
  moduleName?: string;
  description: string;
  apiEndpoint?: string;
  httpMethod?: string;
  category?: string;
  priority: Priority;
  riskLevel: RiskLevel;
  matchingRules: MatchingRule[];
  estimatedEffort?: string;
  manualTestingRequired?: boolean;
  businessImpact?: string;
  tags?: string[];
  acceptanceCriteria?: string[];
  testData?: Record<string, any>;
  preconditions?: string[];
  postconditions?: string[];
  dependencies?: string[];
  createdBy?: string;
  createdDate?: string;
  lastModified?: string;
  status?: ScenarioStatus;
  notes?: string;
}

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type ScenarioStatus = 'Active' | 'Deprecated' | 'Draft' | 'UnderReview';

export interface MatchingRule {
  type: MatchingStrategy;
  pattern: string;
  threshold?: number;
  keywords?: string[];
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

// ============================================================================
// UNIT TEST TYPES
// ============================================================================

export interface UnitTest {
  id: string;
  service: string;
  file: string;
  filePath: string;
  description: string;
  suite?: string;
  tags?: string[];
  language: SupportedLanguage;
  framework: SupportedFramework;
  lineNumber?: number;
  testMethod?: string;
  assertions?: string[];
  mocksDependencies?: boolean;
  executionTime?: number;
  lastModified?: string;
  author?: string;
  coverage?: TestCoverage;
  orphanCategory?: OrphanTestCategory;
  orphanReason?: string;
}

export interface OrphanTestCategory {
  type: 'technical' | 'business';
  subtype: string;
  priority: Priority;
  actionRequired: 'none' | 'qa_add_scenario' | 'review';
  reason: string;
  suggestedScenarioId?: string;
}

export interface TestCoverage {
  lines: number;
  statements: number;
  functions: number;
  branches: number;
}

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult {
  success: boolean;
  timestamp: Date;
  duration: number;
  summary: ValidationSummary;
  mappings: ScenarioMapping[];
  gaps: Gap[];
  orphanTests: UnitTest[];
  orphanScenarios: Scenario[];
  orphanAnalysis: OrphanTestAnalysis;
  apiChanges: APIChange[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: Recommendation[];
  traceabilityMatrix: TraceabilityMatrix;
}

export interface OrphanTestAnalysis {
  totalOrphans: number;
  technicalTests: UnitTest[];
  businessTests: UnitTest[];
  technicalCount: number;
  businessCount: number;
  actionRequiredCount: number;
  categorization: OrphanCategorization[];
}

export interface OrphanCategorization {
  category: string;
  count: number;
  tests: UnitTest[];
  actionRequired: boolean;
}

export interface ValidationSummary {
  totalScenarios: number;
  fullyCovered: number;
  partiallyCovered: number;
  notCovered: number;
  totalTests: number;
  orphanTests: number;
  orphanScenarios: number;
  coveragePercent: number;
  p0Gaps: number;
  p1Gaps: number;
  p2Gaps: number;
  p3Gaps: number;
  criticalGaps: number;
  highRiskGaps: number;
  mediumRiskGaps: number;
  lowRiskGaps: number;
  servicesAnalyzed: number;
  apiChangesDetected: number;
}

export interface ScenarioMapping {
  scenario: Scenario;
  matchedTests: UnitTest[];
  coverageStatus: CoverageStatus;
  matchScore: number;
  matchDetails: MatchDetail[];
  gapExplanation: string;
  recommendations: string[];
}

export type CoverageStatus = 
  | 'Fully Covered' 
  | 'Partially Covered' 
  | 'Not Covered'
  | 'Over Covered';

export interface MatchDetail {
  test: UnitTest;
  strategy: MatchingStrategy;
  score: number;
  confidence: number;
  explanation: string;
}

// ============================================================================
// GAP ANALYSIS TYPES
// ============================================================================

export interface Gap {
  scenario: Scenario;
  reason: GapReason;
  impact: string;
  severity: Priority;
  recommendations: string[];
  actionRequired: ActionRequired;
  estimatedEffort?: string;
  assignedTo?: string;
}

export type GapReason = 
  | 'no_unit_test_found' 
  | 'test_deleted' 
  | 'api_removed' 
  | 'scenario_outdated'
  | 'insufficient_coverage'
  | 'partial_implementation'
  | 'missing_edge_cases'
  | 'deprecated_functionality';

export type ActionRequired = 
  | 'Developer - Create Test'
  | 'Developer - Update Test'
  | 'QA - Update Scenario'
  | 'QA - Remove Scenario'
  | 'Team - Review & Decide'
  | 'No Action';

// ============================================================================
// API CHANGE DETECTION
// ============================================================================

export interface APIChange {
  type: APIChangeType;
  apiEndpoint: string;
  httpMethod?: string;
  affectedScenarios: Scenario[];
  affectedTests: UnitTest[];
  detectedAt: Date;
  impact: string;
  recommendations: string[];
}

export type APIChangeType = 
  | 'API Added'
  | 'API Removed'
  | 'API Modified'
  | 'Endpoint Changed';

// ============================================================================
// ERROR & WARNING TYPES
// ============================================================================

export interface ValidationError {
  type: ErrorType;
  message: string;
  service?: string;
  file?: string;
  lineNumber?: number;
  details?: any;
  stack?: string;
}

export type ErrorType = 
  | 'config_error' 
  | 'parse_error' 
  | 'scenario_load_error' 
  | 'test_parse_error'
  | 'matching_error'
  | 'report_generation_error'
  | 'service_start_error'
  | 'file_not_found'
  | 'invalid_format';

export interface ValidationWarning {
  type: WarningType;
  message: string;
  service?: string;
  file?: string;
  severity: 'Low' | 'Medium' | 'High';
  recommendations?: string[];
}

export type WarningType =
  | 'orphan_test'
  | 'orphan_scenario'
  | 'low_match_score'
  | 'partial_coverage'
  | 'deprecated_scenario'
  | 'missing_metadata'
  | 'potential_duplicate';

export interface Recommendation {
  type: RecommendationType;
  title: string;
  description: string;
  priority: Priority;
  effort: 'Low' | 'Medium' | 'High';
  assignedTo: 'Developer' | 'QA' | 'Team';
}

export type RecommendationType =
  | 'create_test'
  | 'update_test'
  | 'update_scenario'
  | 'remove_scenario'
  | 'improve_coverage'
  | 'refactor_test'
  | 'add_edge_case';

// ============================================================================
// TRACEABILITY MATRIX
// ============================================================================

export interface TraceabilityMatrix {
  scenarios: Scenario[];
  tests: UnitTest[];
  matrix: MatrixCell[][];
  headers: string[];
  rowLabels: string[];
  statistics: MatrixStatistics;
}

export interface MatrixCell {
  scenarioId: string;
  testId: string;
  mapped: boolean;
  matchScore: number;
  status: CoverageStatus;
}

export interface MatrixStatistics {
  totalCells: number;
  mappedCells: number;
  unmappedCells: number;
  coveragePercent: number;
  fullyCoveredScenarios: number;
  partiallyCoveredScenarios: number;
  uncoveredScenarios: number;
}

// ============================================================================
// PARSER INTERFACES
// ============================================================================

export interface TestParser {
  language: SupportedLanguage;
  framework: SupportedFramework;
  parseTests(serviceConfig: ServiceConfig): Promise<UnitTest[]>;
  canParse(language: SupportedLanguage, framework: SupportedFramework): boolean;
  extractTestMetadata(filePath: string): Promise<UnitTest[]>;
}

export interface ScenarioParser {
  format: ScenarioFormat;
  parse(filePath: string): Promise<Scenario[]>;
  validate(scenarios: Scenario[]): ValidationError[];
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface Report {
  format: ReportFormat;
  filePath: string;
  content: string | Buffer;
  generatedAt: Date;
  metadata: ReportMetadata;
}

export interface ReportMetadata {
  title: string;
  project: string;
  version: string;
  author: string;
  generatedBy: string;
  totalPages?: number;
  fileSize?: number;
}

// ============================================================================
// CLI TYPES
// ============================================================================

export interface CLIOptions {
  all?: boolean;
  service?: string[];
  changed?: boolean;
  format?: ReportFormat[];
  output?: string;
  verbose?: boolean;
  strict?: boolean;
  watch?: boolean;
  config?: string;
  dryRun?: boolean;
  force?: boolean;
}

// ============================================================================
// HOOKS & INTEGRATIONS
// ============================================================================

export interface PreCommitResult {
  success: boolean;
  message: string;
  validationResult: ValidationResult;
  blockedReasons: string[];
  warnings: string[];
}

export interface GitInfo {
  branch: string;
  changedFiles: string[];
  author: string;
  commitMessage?: string;
}
