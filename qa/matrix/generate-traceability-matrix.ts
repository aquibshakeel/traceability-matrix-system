#!/usr/bin/env ts-node
/**
 * Consolidated Traceability Matrix Generator
 * Handles all TM generation modes:
 * - Format: Markdown or HTML
 * - Scope: Full (all scenarios) or Selective (executed only)
 * - Naming: With or without timestamp
 */

import * as fs from 'fs';
import * as path from 'path';
import { UnitTestParser } from './parse-unit-tests';
import { SCENARIOS, Scenario } from './scenario-definitions';
import { ScenarioMapper, ScenarioMapping } from './scenario-mapper';
import { generateEnhancedHTML } from './enhanced-tm-template';

// ============================================================================
// TYPES
// ============================================================================

interface ExecutedTest {
  title: string;
  state: string;
}

interface GenerationOptions {
  format: 'markdown' | 'html';
  mode: 'full' | 'selective';
  outputName?: string; // For timestamped reports
  reportJsonPath?: string; // Path to test report JSON
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

async function generateTraceabilityMatrix(options: GenerationOptions) {
  const { format, mode, outputName, reportJsonPath } = options;
  
  console.log(`🎯 Traceability Matrix Generator`);
  console.log(`================================`);
  console.log(`Format: ${format.toUpperCase()}`);
  console.log(`Mode: ${mode === 'full' ? 'Full (All Scenarios)' : 'Selective (Executed Only)'}`);
  if (outputName) console.log(`Output: ${outputName}`);
  console.log('');

  // Parse unit tests
  console.log('📖 Step 1: Parsing unit tests...');
  const parser = new UnitTestParser();
  const unitTests = await parser.parseAllTests();
  console.log(`   Found ${unitTests.length} unit tests\n`);

  // Determine scenarios based on mode
  let scenarios: Scenario[];
  let executedScenarioIds: Set<string> = new Set();
  let executedTestCount = 0;

  if (mode === 'selective') {
    // Read executed tests from report
    let reportPath = reportJsonPath;
    if (!reportPath) {
      // Try to find the latest selective test report
      const reportsDir = path.join(__dirname, '../reports/html');
      const files = fs.readdirSync(reportsDir).filter(f => f.startsWith('selective-test-report-') && f.endsWith('.json'));
      if (files.length > 0) {
        files.sort().reverse(); // Get latest
        reportPath = path.join(reportsDir, files[0]);
      } else {
        reportPath = path.join(__dirname, '../reports/html/selective-test-report.json');
      }
    }
    
    if (!fs.existsSync(reportPath)) {
      console.error(`❌ Error: No test report found at: ${reportPath}`);
      console.error('   Please run tests first.');
      process.exit(1);
    }

    console.log('📋 Step 2: Reading test execution report...');
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    const executedTests = extractExecutedTests(reportData);
    executedTestCount = executedTests.length;
    executedScenarioIds = extractScenarioIds(executedTests);
    
    console.log(`   Found ${executedScenarioIds.size} executed scenarios: ${Array.from(executedScenarioIds).join(', ')}\n`);
    
    // Filter to executed scenarios only
    scenarios = SCENARIOS.filter(s => executedScenarioIds.has(s.id));
  } else {
    // Use all scenarios (full mode)
    scenarios = SCENARIOS;
    
    // For full mode, still try to read the test report to get accurate test count
    let reportPath = reportJsonPath;
    if (!reportPath) {
      // Try to find the latest test report
      const reportsDir = path.join(__dirname, '../reports/html');
      if (fs.existsSync(reportsDir)) {
        const files = fs.readdirSync(reportsDir).filter(f => f.startsWith('test-report-') && f.endsWith('.json') && !f.includes('selective'));
        if (files.length > 0) {
          files.sort().reverse(); // Get latest
          reportPath = path.join(reportsDir, files[0]);
        }
      }
    }
    
    if (reportPath && fs.existsSync(reportPath)) {
      console.log('📋 Step 2: Reading test execution report...');
      const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      const executedTests = extractExecutedTests(reportData);
      executedTestCount = executedTests.length;
      console.log(`   Found ${executedTestCount} executed tests\n`);
    }
  }

  // Map scenarios to unit tests
  console.log(`🔍 Step ${mode === 'selective' ? '3' : '2'}: Mapping scenarios to unit tests...`);
  const mapper = new ScenarioMapper();
  const mappings = mapper.mapScenarios(scenarios, unitTests);
  console.log(`   Mapped ${mappings.length} scenarios\n`);

  // In selective mode, filter unit tests to only those related to executed scenarios
  let relevantUnitTests = unitTests;
  if (mode === 'selective' && scenarios.length > 0) {
    // Get all unit test IDs that are mapped to executed scenarios
    const mappedTestIds = new Set<string>();
    mappings.forEach(mapping => {
      mapping.matchedTests.forEach((test: any) => {
        mappedTestIds.add(test.id);
      });
    });
    
    // Filter unit tests to only include those mapped to executed scenarios
    relevantUnitTests = unitTests.filter(test => mappedTestIds.has(test.id));
    console.log(`   Filtered to ${relevantUnitTests.length} relevant unit tests for executed scenarios\n`);
  }

  // Calculate statistics
  console.log(`📊 Step ${mode === 'selective' ? '4' : '3'}: Calculating coverage statistics...`);
  const stats = mapper.calculateStatistics(mappings);
  const coveragePercent = stats.total > 0 ? Math.round((stats.fullyCovered / stats.total) * 100) : 0;
  console.log(`   Coverage: ${coveragePercent}% (${stats.fullyCovered}/${stats.total})\n`);

  // Get gaps
  const criticalGaps = mapper.getCriticalGaps(mappings);
  const highPriorityGaps = mapper.getHighPriorityGaps(mappings);
  const allGaps = mapper.getAllGaps(mappings);
  
  console.log(`   P0 Critical Gaps: ${criticalGaps.length}`);
  console.log(`   P1 High Priority Gaps: ${highPriorityGaps.length}`);
  console.log(`   Total Gaps: ${allGaps.length}\n`);

  // Get orphan tests (only from relevant unit tests)
  const orphanTests = mapper.getOrphanTests(relevantUnitTests);
  console.log(`🔍 Orphan Tests: ${orphanTests.length} unit tests not mapped to any scenario\n`);

  // Generate report based on format
  const serviceSummaries = await parser.getTestSummaryByService();
  
  // In selective mode, calculate summaries from relevant unit tests only
  let displaySummaries = serviceSummaries;
  if (mode === 'selective' && relevantUnitTests.length > 0) {
    // Group relevant tests by service
    const serviceTestMap = new Map<string, number>();
    relevantUnitTests.forEach(test => {
      const count = serviceTestMap.get(test.service) || 0;
      serviceTestMap.set(test.service, count + 1);
    });
    
    // Create filtered summaries
    displaySummaries = Array.from(serviceTestMap.entries()).map(([serviceName, testCount]) => ({
      serviceName,
      testCount,
      tests: relevantUnitTests.filter(t => t.service === serviceName)
    }));
  }
  
  if (format === 'markdown') {
    const markdown = generateMarkdown(
      mappings,
      stats,
      criticalGaps,
      highPriorityGaps,
      allGaps,
      displaySummaries,
      mode,
      executedTestCount,
      orphanTests
    );
    
    const filename = mode === 'selective' ? 'SELECTIVE_TRACEABILITY_MATRIX.md' : 'TRACEABILITY_MATRIX.md';
    const outputPath = path.join(__dirname, filename);
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`✅ Markdown TM saved: ${outputPath}\n`);
  } else {
    const tmTimestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
    
    const html = generateEnhancedHTML({
      mappings,
      stats,
      serviceSummaries: displaySummaries,
      criticalGaps,
      highPriorityGaps,
      allGaps,
      executionMode: mode === 'selective' ? 'Selective' : 'Full Suite',
      timestamp: tmTimestamp,
      coveragePercent,
      totalTests: relevantUnitTests.length,
      orphanTests
    });
    
    const filename = outputName || (mode === 'selective' ? 'selective-traceability-matrix.html' : 'traceability-matrix.html');
    const outputPath = path.join(__dirname, '../reports/html', filename);
    fs.writeFileSync(outputPath, html, 'utf-8');
    console.log(`✅ HTML TM saved: ${outputPath}\n`);
    
    // Also save JSON
    const jsonOutput = {
      metadata: {
        generatedAt: new Date().toISOString(),
        mode: mode === 'selective' ? 'Selective' : 'Full Suite',
        totalScenarios: stats.total,
        unitTests: unitTests.length
      },
      statistics: stats,
      services: serviceSummaries,
      mappings: mappings.map(m => ({
        scenarioId: m.scenario.id,
        description: m.scenario.description,
        coverageStatus: m.coverageStatus,
        matchedTestsCount: m.matchedTests.length,
        gapExplanation: m.gapExplanation
      }))
    };
    
    const jsonFilename = filename.replace('.html', '.json');
    const jsonPath = path.join(__dirname, '../reports/html', jsonFilename);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), 'utf-8');
    console.log(`✅ JSON data saved: ${jsonPath}\n`);
  }

  // Summary
  console.log('✅ Traceability Matrix generated successfully!');
  console.log(`📊 Summary: ${stats.fullyCovered}/${stats.total} covered (${coveragePercent}%)`);
  console.log(`🚨 Gaps: P0=${criticalGaps.length}, P1=${highPriorityGaps.length}`);
  console.log(`🔍 Orphan Tests: ${orphanTests.length}\n`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractExecutedTests(reportData: any): ExecutedTest[] {
  const tests: ExecutedTest[] = [];
  
  function extract(suite: any, suiteTitle: string = '') {
    const currentTitle = suite.title || suiteTitle;
    
    if (suite.tests && Array.isArray(suite.tests)) {
      for (const test of suite.tests) {
        // Only include tests that actually executed (not skipped)
        // Skipped tests have skipped: true, executed tests have skipped: false or undefined
        if (!test.skipped) {
          tests.push({
            title: `${currentTitle} ${test.title}`.trim(),
            state: test.state || 'unknown'
          });
        }
      }
    }
    
    if (suite.suites && Array.isArray(suite.suites)) {
      for (const subSuite of suite.suites) {
        extract(subSuite, currentTitle);
      }
    }
  }
  
  if (reportData.results && Array.isArray(reportData.results)) {
    for (const suite of reportData.results) {
      extract(suite);
    }
  }
  
  return tests;
}

function extractScenarioIds(tests: ExecutedTest[]): Set<string> {
  const scenarioIds = new Set<string>();
  
  // Standardized format: scenario IDs must be in parentheses
  // Examples: (HF001), (NF001), (EC001), (DB001), (KAF001)
  // This ensures consistent extraction across all E2E tests
  const pattern = /\(([A-Z]{2,3}\d{3})\)/g;
  
  for (const test of tests) {
    const matches = test.title.matchAll(pattern);
    for (const match of matches) {
      const scenarioId = match[1];
      // Filter out test suite IDs like TS001, only keep scenario IDs
      if (!scenarioId.startsWith('TS')) {
        scenarioIds.add(scenarioId);
      }
    }
  }
  
  return scenarioIds;
}

// ============================================================================
// MARKDOWN GENERATION
// ============================================================================

function generateMarkdown(
  mappings: ScenarioMapping[],
  stats: any,
  criticalGaps: ScenarioMapping[],
  highPriorityGaps: ScenarioMapping[],
  allGaps: ScenarioMapping[],
  serviceSummaries: any[],
  mode: 'full' | 'selective',
  executedTestCount: number,
  orphanTests: any[]
): string {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });

  const serviceNames = serviceSummaries.map(s => s.serviceName).join(', ');
  const totalTests = serviceSummaries.reduce((sum, s) => sum + s.testCount, 0);
  const title = mode === 'selective' ? '🎯 Selective Test Execution - Traceability Matrix' : '🕵️ Multi-Service Unit Test Traceability Matrix';

  let md = `# ${title}

**Generated:** ${timestamp}  
**Mode:** ${mode === 'selective' ? 'Selective (Executed tests only)' : 'Full (All scenarios)'}  
**Services:** ${serviceNames}  
**Total Unit Tests:** ${totalTests} across ${serviceSummaries.length} service(s)  
${mode === 'selective' ? `**E2E Tests Executed:** ${executedTestCount}  \n` : ''}**Version:** 1.0.0

---

## Traceability Matrix

| Scenario ID | Description | API Endpoint | Unit Test IDs | Coverage | Gap Source | Gap Explanation | Risk | Priority |
|-------------|-------------|--------------|---------------|----------|------------|-----------------|------|----------|
`;

  for (const mapping of mappings) {
    const scenario = mapping.scenario;
    const testIds = mapping.matchedTests.length > 0 
      ? mapping.matchedTests.map((t: any) => t.id).join(', ')
      : 'None';
    
    const coverageIcon = 
      mapping.coverageStatus === 'Fully Covered' ? '✅' :
      mapping.coverageStatus === 'Partially Covered' ? '⚠️' : '❌';

    let gapSource = '-';
    if (mapping.coverageStatus !== 'Fully Covered') {
      gapSource = mapping.matchedTests.length === 0 ? '🔴 **Unit Test Gap**' : '🟡 **E2E Coverage Gap**';
    } else {
      gapSource = '🟢 Fully Covered';
    }

    md += `| **${scenario.id}** | ${scenario.description} | ${scenario.apiEndpoint} | ${testIds} | ${coverageIcon} ${mapping.coverageStatus} | ${gapSource} | ${mapping.gapExplanation} | ${scenario.riskLevel} | ${scenario.priority} |\n`;
  }

  md += `
---

## Summary Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Scenarios** | ${stats.total} | 100% |
| **Fully Covered** | ${stats.fullyCovered} | ${Math.round((stats.fullyCovered / stats.total) * 100)}% |
| **Partially Covered** | ${stats.partiallyCovered} | ${Math.round((stats.partiallyCovered / stats.total) * 100)}% |
| **Not Covered** | ${stats.notCovered} | ${Math.round((stats.notCovered / stats.total) * 100)}% |

---

## 🔍 Orphan Unit Tests

**Definition:** Unit tests that are not mapped to any defined test scenario.

**Count:** ${orphanTests.length} orphan test(s)

${orphanTests.length === 0 ? '✅ All unit tests are mapped to scenarios. Perfect traceability!' : '⚠️ The following unit tests are not mapped to any scenario:'}

${orphanTests.length > 0 ? `| Test ID | Service | Description |
|---------|---------|-------------|
${orphanTests.map(test => `| ${test.id} | ${test.service} | ${test.description} |`).join('\n')}

**Action Required:**
- Review these tests to determine if they cover undocumented scenarios
- Add corresponding scenario definitions if needed
- Consider if these tests are redundant or need updating
` : ''}

---

**Last Generated:** ${timestamp}  
**Status:** ${criticalGaps.length === 0 && highPriorityGaps.length === 0 ? '✅ No Critical Gaps' : '⚠️ Gaps Require Attention'}
`;

  return md;
}

// ============================================================================
// HTML GENERATION
// ============================================================================

function generateHTML(
  mappings: any[],
  stats: any,
  serviceSummaries: any[],
  criticalGaps: any[],
  highPriorityGaps: any[],
  allGaps: any[],
  executionMode: string,
  executedScenarioIds: Set<string>,
  executedTestCount: number,
  orphanTests: any[],
  relevantTestCount?: number
): string {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });

  const coveragePercent = Math.round((stats.fullyCovered / stats.total) * 100);
  const serviceNames = serviceSummaries.map(s => s.serviceName).join(', ');
  const totalTests = relevantTestCount !== undefined ? relevantTestCount : serviceSummaries.reduce((sum: number, s: any) => sum + s.testCount, 0);

  // Generate orphan tests section HTML
  const orphanTestsSection = orphanTests.length > 0 ? `
        <!-- Orphan Unit Tests -->
        <div class="section">
            <h2>🔍 Orphan Unit Tests</h2>
            <div class="gap-card warning">
                <h3>⚠️ ${orphanTests.length} unit test(s) not mapped to any scenario</h3>
                <p style="color: #666; margin-top: 10px;">
                    <strong>Definition:</strong> These unit tests exist but are not linked to any documented test scenario.
                    This may indicate undocumented scenarios or tests that need review.
                </p>
                <div class="gap-details">
                    <div class="gap-detail">
                        <div class="gap-detail-label">Total Orphan Tests</div>
                        <div class="gap-detail-value">${orphanTests.length}</div>
                    </div>
                    <div class="gap-detail">
                        <div class="gap-detail-label">Action Required</div>
                        <div class="gap-detail-value">Review & Document</div>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Test ID</th>
                            <th>Service</th>
                            <th>File</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orphanTests.map(test => {
                          // Generate context-aware, unique suggestions and enhanced descriptions
                          let suggestion = '';
                          let actionTeam = 'QA Team';
                          let enhancedDescription = test.description;
                          
                          const desc = test.description.toLowerCase();
                          const testId = test.id;
                          const file = test.file.toLowerCase();
                          
                          // Infrastructure tests - No business scenario mapping needed
                          if (desc.includes('timestamp') || desc.includes('createdat') || desc.includes('updatedat')) {
                            actionTeam = 'No Action';
                            enhancedDescription = 'Database: Validates automatic timestamp generation (createdAt/updatedAt)';
                            suggestion = 'Technical test - validates data persistence timestamps';
                          } else if (desc.includes('unique index') || desc.includes('create unique index') || desc.includes('createindex')) {
                            actionTeam = 'No Action';
                            if (desc.includes('email')) {
                              enhancedDescription = 'Database Schema: Ensures unique index exists on email field';
                            } else if (desc.includes('userid')) {
                              enhancedDescription = 'Database Schema: Ensures unique index exists on userId field';
                            } else {
                              enhancedDescription = 'Database Schema: Validates unique index creation';
                            }
                            suggestion = 'Database schema test - validates DB constraints';
                          } else if (desc.includes('connect to kafka')) {
                            actionTeam = 'No Action';
                            enhancedDescription = 'Kafka Infrastructure: Validates successful connection to message broker';
                            suggestion = 'Infrastructure test - validates connection lifecycle';
                          } else if (desc.includes('disconnect from kafka')) {
                            actionTeam = 'No Action';
                            enhancedDescription = 'Kafka Infrastructure: Validates graceful disconnection from message broker';
                            suggestion = 'Infrastructure test - validates connection lifecycle';
                          } else if (desc.includes('message key')) {
                            actionTeam = 'No Action';
                            enhancedDescription = 'Kafka Message: Validates userId is used as partition key for event distribution';
                            suggestion = 'Messaging implementation test - validates Kafka protocol details';
                          } else if (desc.includes('serialize')) {
                            actionTeam = 'No Action';
                            enhancedDescription = 'Kafka Message: Validates event data is properly serialized to JSON format';
                            suggestion = 'Messaging implementation test - validates Kafka protocol details';
                          } else if (desc.includes('default topic')) {
                            actionTeam = 'No Action';
                            enhancedDescription = 'Kafka Configuration: Validates default topic is used when not specified';
                            suggestion = 'Messaging implementation test - validates Kafka protocol details';
                          } else if (desc.includes('timestamp in message')) {
                            actionTeam = 'No Action';
                            enhancedDescription = 'Kafka Message: Validates timestamp metadata is included in published events';
                            suggestion = 'Infrastructure test - validates technical implementation detail (timestamps)';
                          }
                          // Controller-level error handling
                          else if (file.includes('controller')) {
                            if (desc.includes('500') && desc.includes('unexpected')) {
                              if (file.includes('user')) {
                                if (testId === 'test_user_controller_6') {
                                  enhancedDescription = 'Create User API: Returns 500 Internal Server Error when database connection fails';
                                  suggestion = 'Map to DB002 (DB connection failure) for POST /api/user error handling';
                                } else if (testId === 'test_user_controller_10') {
                                  enhancedDescription = 'Get User API: Returns 500 Internal Server Error when database query times out';
                                  suggestion = 'Map to DB001 (DB timeout) for GET /api/user/:id error handling';
                                }
                              } else if (file.includes('profile')) {
                                enhancedDescription = 'Profile API: Returns 500 Internal Server Error when database operation fails';
                                suggestion = 'Map to DB_FAILURE scenarios for profile service database errors';
                              }
                            } else if (desc.includes('400') && desc.includes('missing id')) {
                              enhancedDescription = 'Get User API: Returns 400 Bad Request when ID parameter is missing from request';
                              suggestion = 'Map to new negative scenario: NF_GET_001 - Missing ID parameter in GET request';
                            } else if (desc.includes('201') && desc.includes('profile created')) {
                              enhancedDescription = 'Create Profile API: Returns 201 Created with profile data on successful creation';
                              suggestion = 'Create HF_PROFILE_001 scenario: Create profile with valid data (identity-service)';
                            } else if (desc.includes('400') && desc.includes('validation')) {
                              enhancedDescription = 'Profile API: Returns 400 Bad Request for validation errors (missing/invalid fields)';
                              suggestion = 'Create NF_PROFILE_001 scenario: Profile validation errors (missing/invalid fields)';
                            } else if (desc.includes('500') && desc.includes('profile')) {
                              enhancedDescription = 'Profile API: Returns 500 Internal Server Error when database operation fails';
                              suggestion = 'Map to DB_FAILURE scenarios for profile service database errors';
                            } else if (desc.includes('400') && desc.includes('invalid age')) {
                              enhancedDescription = 'Profile Validation: Returns 400 Bad Request when age is outside valid range (0-150)';
                              suggestion = 'Create EC_PROFILE_001 scenario: Age boundary validation (0-150 range)';
                            } else if (desc.includes('204') && desc.includes('profile deleted')) {
                              enhancedDescription = 'Delete Profile API: Returns 204 No Content on successful profile deletion';
                              suggestion = 'Create HF_PROFILE_004 scenario: Delete profile successfully';
                            }
                          }
                          // Service-level business logic
                          else if (file.includes('/service') && !file.includes('repository')) {
                            if (desc.includes('publish') && desc.includes('event') && file.includes('user')) {
                              enhancedDescription = 'User Creation Flow: Publishes "user.created" event to Kafka after successful user creation';
                              suggestion = 'IMPORTANT: Map to HF001 - Event publishing is core to user creation flow';
                            } else if (desc.includes('repository errors') || desc.includes('handle.*errors')) {
                              enhancedDescription = 'Error Resilience: Service handles database errors gracefully without crashing';
                              suggestion = 'Map to DB002 (DB connection failure) - service resilience test';
                            } else if (desc.includes('profile') && desc.includes('create') && desc.includes('valid')) {
                              enhancedDescription = 'Profile Creation Logic: Creates profile with valid data and returns profile object';
                              suggestion = 'Create HF_PROFILE_001 scenario: Profile creation business logic';
                            } else if (desc.includes('userid is missing') || desc.includes('userid.*missing')) {
                              enhancedDescription = 'Profile Validation: Throws error when required userId field is not provided';
                              suggestion = 'Create NF_PROFILE_002 scenario: Required field validation (userId)';
                            } else if (desc.includes('age is negative')) {
                              enhancedDescription = 'Age Validation: Throws error when age value is negative (below 0)';
                              suggestion = 'Create EC_PROFILE_001 scenario: Age boundary validation (negative/above 150)';
                            } else if (desc.includes('age is above')) {
                              enhancedDescription = 'Age Validation: Throws error when age exceeds maximum allowed value (above 150)';
                              suggestion = 'Create EC_PROFILE_001 scenario: Age boundary validation (negative/above 150)';
                            } else if (desc.includes('accept age of 0')) {
                              enhancedDescription = 'Age Boundary: Accepts minimum valid age value of 0 (newborn)';
                              suggestion = 'Map to EC_PROFILE_001 scenario: Valid age boundary acceptance (0 and 150)';
                            } else if (desc.includes('accept age of 150')) {
                              enhancedDescription = 'Age Boundary: Accepts maximum valid age value of 150 (elderly)';
                              suggestion = 'Map to EC_PROFILE_001 scenario: Valid age boundary acceptance (0 and 150)';
                            } else if (testId === 'test_profile_service_8') {
                              enhancedDescription = 'Profile Retrieval: Returns profile data when queried by profile ID';
                              suggestion = 'Create HF_PROFILE_002 scenario: Get profile by ID successfully';
                            } else if (testId === 'test_profile_service_10') {
                              enhancedDescription = 'Profile Retrieval: Returns profile data when queried by user ID';
                              suggestion = 'Create HF_PROFILE_003 scenario: Get profile by userId successfully';
                            } else if (desc.includes('update profile') && desc.includes('valid')) {
                              enhancedDescription = 'Profile Update Logic: Updates profile with new data and returns updated profile';
                              suggestion = 'Create HF_PROFILE_005 scenario: Update profile with valid data';
                            } else if (desc.includes('update age is invalid')) {
                              enhancedDescription = 'Update Validation: Throws error when update contains invalid age value';
                              suggestion = 'Create NF_PROFILE_003 scenario: Profile update validation (invalid age)';
                            } else if (desc.includes('delete profile') && desc.includes('found')) {
                              enhancedDescription = 'Profile Deletion Logic: Successfully deletes profile when it exists in database';
                              suggestion = 'Create HF_PROFILE_004 scenario: Delete profile successfully';
                            }
                          }
                          // Repository-level data access
                          else if (file.includes('/repository') || file.includes('Repository')) {
                            if (desc.includes('invalid objectid') || desc.includes('invalid id') || desc.includes('invalid profile id')) {
                              if (file.includes('user')) {
                                enhancedDescription = 'User Repository: Returns null when queried with malformed MongoDB ObjectId';
                                suggestion = 'Map to NF002 - Invalid ID format validation (applies to all repositories)';
                              } else if (file.includes('profile')) {
                                enhancedDescription = 'Profile Repository: Throws error when ID format is invalid for database query';
                                suggestion = 'Map to NF002 - Invalid ID format validation (applies to all repositories)';
                              }
                            } else if ((desc.includes('create') || desc.includes('insert')) && desc.includes('successfully')) {
                              enhancedDescription = 'Profile Data Access: Successfully inserts new profile document into MongoDB';
                              suggestion = 'Technical test supporting HF_PROFILE_001 - validates MongoDB profile insertion';
                            } else if (desc.includes('return') && (desc.includes('found') || desc.includes('profile')) && !desc.includes('not found') && !desc.includes('null')) {
                              if (testId === 'test_mongo_profile_repository_2' || desc.includes('by id')) {
                                enhancedDescription = 'Profile Data Access: Successfully retrieves profile document from MongoDB by ID';
                                suggestion = 'Technical test supporting HF_PROFILE_002 - validates profile retrieval by ID';
                              } else if (desc.includes('userid') || testId === 'test_mongo_profile_repository_5') {
                                enhancedDescription = 'Profile Data Access: Successfully retrieves profile document by userId field';
                                suggestion = 'Technical test supporting HF_PROFILE_003 - validates profile retrieval by userId';
                              }
                            } else if (desc.includes('null when') || desc.includes('no profile')) {
                              enhancedDescription = 'Profile Not Found: Returns null when userId has no associated profile in database';
                              suggestion = 'Technical test supporting NF002 - validates not found handling';
                            } else if (desc.includes('update') && desc.includes('successfully')) {
                              enhancedDescription = 'Profile Data Access: Successfully updates existing profile document in MongoDB';
                              suggestion = 'Technical test supporting HF_PROFILE_005 - validates MongoDB profile update';
                            } else if (desc.includes('delete') && desc.includes('successfully')) {
                              enhancedDescription = 'Profile Data Access: Successfully removes profile document from MongoDB';
                              suggestion = 'Technical test supporting HF_PROFILE_004 - validates MongoDB profile deletion';
                            } else if (desc.includes('throw error') && (desc.includes('invalid') || desc.includes('id'))) {
                              enhancedDescription = 'Profile Repository: Throws error when ID format is invalid for database query';
                              suggestion = 'Map to NF002 - Invalid ID format validation (applies to all repositories)';
                            }
                            // Catch-all for any remaining repository tests
                            else {
                              if (desc.includes('create')) {
                                enhancedDescription = 'Profile Data Access: Successfully inserts new profile document into MongoDB';
                                suggestion = 'Technical test supporting HF_PROFILE_001 - validates MongoDB profile insertion';
                              } else if (desc.includes('return') || desc.includes('get') || desc.includes('found')) {
                                if (desc.includes('userid')) {
                                  enhancedDescription = 'Profile Data Access: Successfully retrieves profile document by userId field';
                                  suggestion = 'Technical test supporting HF_PROFILE_003 - validates profile retrieval by userId';
                                } else {
                                  enhancedDescription = 'Profile Data Access: Successfully retrieves profile document from MongoDB by ID';
                                  suggestion = 'Technical test supporting HF_PROFILE_002 - validates profile retrieval by ID';
                                }
                              } else if (desc.includes('update')) {
                                enhancedDescription = 'Profile Data Access: Successfully updates existing profile document in MongoDB';
                                suggestion = 'Technical test supporting HF_PROFILE_005 - validates MongoDB profile update';
                              } else if (desc.includes('delete')) {
                                enhancedDescription = 'Profile Data Access: Successfully removes profile document from MongoDB';
                                suggestion = 'Technical test supporting HF_PROFILE_004 - validates MongoDB profile deletion';
                              } else if (desc.includes('null')) {
                                enhancedDescription = 'Profile Not Found: Returns null when profile does not exist in database';
                                suggestion = 'Technical test supporting NF002 - validates not found handling';
                              } else if (desc.includes('throw') || desc.includes('error')) {
                                enhancedDescription = 'Profile Repository: Throws error when ID format is invalid for database query';
                                suggestion = 'Map to NF002 - Invalid ID format validation (applies to all repositories)';
                              } else {
                                suggestion = 'Technical test - map to appropriate profile scenario based on operation';
                              }
                            }
                          }
                          // Kafka publisher tests
                          else if (file.includes('kafka')) {
                            if (desc.includes('publish event to kafka')) {
                              enhancedDescription = 'Event Publishing: Successfully publishes domain event message to Kafka topic';
                              suggestion = 'IMPORTANT: Map to HF001 - Kafka publishing is critical to user creation flow';
                            }
                          }
                          // Fallback
                          else {
                            suggestion = 'Analyze test context and create appropriate scenario definition';
                          }
                          
                          const actionBadge = actionTeam === 'No Action' 
                            ? '<span class="badge badge-success">No Action</span>'
                            : '<span class="badge" style="background: #9b59b6; color: white;">QA Team</span>';
                          
                          return `
                        <tr>
                            <td><strong>${test.id}</strong></td>
                            <td><span class="badge badge-info">${test.service}</span></td>
                            <td style="font-size: 0.85em; color: #666;">${test.file}</td>
                            <td style="font-size: 0.9em;">${enhancedDescription}</td>
                            <td>${actionBadge}</td>
                            <td style="font-size: 0.85em;">${suggestion}</td>
                        </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin-top: 20px; border-left: 5px solid #ffbb33;">
                <h4 style="color: #856404; margin-bottom: 10px;">📋 Recommended Actions:</h4>
                <ul style="color: #856404; margin-left: 20px; line-height: 1.8;">
                    <li>Review each orphan test to understand what scenario it covers</li>
                    <li>Add corresponding scenario definitions to <code>scenario-definitions.ts</code></li>
                    <li>Update scenario mapping patterns to include these tests</li>
                    <li>Consider if any tests are redundant and can be removed</li>
                    <li>Ensure bidirectional traceability (Scenarios ↔ Tests)</li>
                </ul>
            </div>
        </div>
  ` : `
        <!-- Orphan Unit Tests -->
        <div class="section">
            <h2>🔍 Orphan Unit Tests</h2>
            <div class="gap-card" style="border-left-color: #00C851;">
                <h3>✅ Perfect Traceability</h3>
                <p style="color: #666; margin-top: 10px;">
                    All unit tests are mapped to defined scenarios. No orphan tests detected!
                </p>
            </div>
        </div>
  `;

  // Generate stats cards
  const statsCards = `
    <div class="stats-grid">
        <div class="stat-card" style="border-left-color: #00C851;">
            <div class="stat-value">${coveragePercent}%</div>
            <div class="stat-label">Coverage</div>
            <div class="stat-detail">${stats.fullyCovered}/${stats.total} scenarios</div>
        </div>
        <div class="stat-card" style="border-left-color: #ff4444;">
            <div class="stat-value">${criticalGaps.length}</div>
            <div class="stat-label">P0 Critical Gaps</div>
            <div class="stat-detail">Immediate action required</div>
        </div>
        <div class="stat-card" style="border-left-color: #ffbb33;">
            <div class="stat-value">${highPriorityGaps.length}</div>
            <div class="stat-label">P1 High Priority</div>
            <div class="stat-detail">Next sprint</div>
        </div>
        <div class="stat-card" style="border-left-color: #33b5e5;">
            <div class="stat-value">${totalTests}</div>
            <div class="stat-label">Unit Tests</div>
            <div class="stat-detail">${serviceSummaries.length} service${serviceSummaries.length !== 1 ? 's' : ''}</div>
        </div>
        <div class="stat-card" style="border-left-color: #9933CC;">
            <div class="stat-value">${orphanTests.length}</div>
            <div class="stat-label">Orphan Tests</div>
            <div class="stat-detail">Need scenario mapping</div>
        </div>
        <div class="stat-card" style="border-left-color: #669900;">
            <div class="stat-value">${stats.partiallyCovered}</div>
            <div class="stat-label">Partial Coverage</div>
            <div class="stat-detail">Needs improvement</div>
        </div>
    </div>`;

  // Generate critical gaps section
  const criticalGapsSection = criticalGaps.length > 0 ? `
    <div class="section">
        <h2>🚨 Critical Gaps (P0) - Immediate Action Required</h2>
        ${criticalGaps.map(gap => `
            <div class="gap-card">
                <h3>🔴 ${gap.scenario.id}: ${gap.scenario.description}</h3>
                <p style="color: #666; margin: 10px 0;"><strong>Impact:</strong> ${gap.scenario.businessImpact}</p>
                <div class="gap-details">
                    <div class="gap-detail">
                        <div class="gap-detail-label">Gap Explanation</div>
                        <div class="gap-detail-value">${gap.gapExplanation}</div>
                    </div>
                    <div class="gap-detail">
                        <div class="gap-detail-label">Risk Level</div>
                        <div class="gap-detail-value">${gap.scenario.riskLevel}</div>
                    </div>
                    <div class="gap-detail">
                        <div class="gap-detail-label">Unit Tests Found</div>
                        <div class="gap-detail-value">${gap.matchedTests.length}</div>
                    </div>
                    <div class="gap-detail">
                        <div class="gap-detail-label">API Endpoint</div>
                        <div class="gap-detail-value">${gap.scenario.apiEndpoint}</div>
                    </div>
                </div>
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <strong>🤖 AI Test Generation Prompt:</strong>
                    <p style="margin-top: 10px; font-family: monospace; font-size: 0.9em;">
                        "Generate unit test for scenario ${gap.scenario.id}: ${gap.scenario.description}. 
                        Test should validate ${gap.scenario.apiEndpoint} endpoint behavior. 
                        Risk level: ${gap.scenario.riskLevel}."
                    </p>
                </div>
            </div>
        `).join('')}
    </div>
  ` : '';

  // Generate high priority gaps section
  const highPrioritySection = highPriorityGaps.length > 0 ? `
    <div class="section">
        <h2>⚠️ High Priority Gaps (P1) - Next Sprint</h2>
        ${highPriorityGaps.map(gap => `
            <div class="gap-card warning">
                <h3>🟡 ${gap.scenario.id}: ${gap.scenario.description}</h3>
                <p style="color: #666; margin: 10px 0;"><strong>Impact:</strong> ${gap.scenario.businessImpact}</p>
                <div class="gap-details">
                    <div class="gap-detail">
                        <div class="gap-detail-label">Gap Explanation</div>
                        <div class="gap-detail-value">${gap.gapExplanation}</div>
                    </div>
                    <div class="gap-detail">
                        <div class="gap-detail-label">Priority</div>
                        <div class="gap-detail-value">${gap.scenario.priority}</div>
                    </div>
                </div>
            </div>
        `).join('')}
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🕵️ Traceability Matrix Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            border-left: 5px solid #667eea;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }
        .stat-label {
            font-size: 0.95em;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        .stat-detail {
            font-size: 0.85em;
            color: #999;
        }
        .section { padding: 40px; }
        .section h2 {
            color: #333;
            margin-bottom: 25px;
            font-size: 1.8em;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        .table-container { overflow-x: auto; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 10px; overflow: hidden; }
        thead { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        th { padding: 15px; text-align: left; font-weight: 600; font-size: 0.95em; }
        td { padding: 15px; border-bottom: 1px solid #f0f0f0; }
        tbody tr:hover { background: #f8f9fa; }
        .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 600; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        .gap-card {
            background: white;
            border-left: 5px solid #ff4444;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .gap-card.warning { border-left-color: #ffbb33; }
        .gap-card h3 { color: #333; margin-bottom: 10px; }
        .gap-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .gap-detail { background: #f8f9fa; padding: 10px; border-radius: 5px; }
        .gap-detail-label { font-size: 0.85em; color: #666; margin-bottom: 5px; }
        .gap-detail-value { font-weight: 600; color: #333; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🕵️ Traceability Matrix Report</h1>
            <p style="font-size: 1.1em; margin-top: 10px;">Generated: ${timestamp} | Mode: ${executionMode}</p>
            <p style="margin-top: 10px; opacity: 0.9;">Comprehensive Unit Test Coverage Analysis</p>
        </div>
        
        ${statsCards}
        
        ${criticalGapsSection}
        
        ${highPrioritySection}
        
        <div class="section">
            <h2>📋 Complete Scenario-to-Unit-Test Mapping</h2>
            <p style="color: #666; margin-bottom: 20px;">Clear mapping of business scenarios to unit test cases</p>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Scenario ID</th>
                            <th>Description</th>
                            <th>Unit Tests</th>
                            <th>Service</th>
                            <th>Coverage</th>
                            <th>Priority</th>
                            <th>Gap Analysis</th>
                            <th>Action Required</th>
                            <th>Suggestion</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mappings.map(mapping => {
                          const coverageClass = 
                            mapping.coverageStatus === 'Fully Covered' ? 'badge-success' :
                            mapping.coverageStatus === 'Partially Covered' ? 'badge-warning' : 'badge-danger';
                          
                          const unitTestIds = mapping.matchedTests.length > 0 
                            ? mapping.matchedTests.map((t: any) => t.id).join(', ')
                            : 'None';
                          
                          // Get unique services for matched tests
                          const services = mapping.matchedTests.length > 0
                            ? [...new Set(mapping.matchedTests.map((t: any) => t.service))].join(', ')
                            : 'N/A';
                          
                          // Determine action required and suggestion
                          let actionRequired = 'None';
                          let suggestion = 'Scenario is adequately covered';
                          
                          if (mapping.coverageStatus === 'Not Covered') {
                            actionRequired = '<span class="badge" style="background: #ff6b6b; color: white;">Dev Team</span>';
                            suggestion = `Implement unit tests for: ${mapping.scenario.description}. Focus on ${mapping.scenario.apiEndpoint} endpoint validation.`;
                          } else if (mapping.coverageStatus === 'Partially Covered') {
                            actionRequired = '<span class="badge" style="background: #feca57; color: #333;">Dev Team</span>';
                            suggestion = 'Add more unit tests to cover edge cases and negative scenarios comprehensively.';
                          } else {
                            actionRequired = '<span class="badge badge-success">No Action</span>';
                          }
                          
                          return `
                        <tr>
                            <td><strong>${mapping.scenario.id}</strong></td>
                            <td>${mapping.scenario.description}</td>
                            <td style="font-size: 0.85em;">${unitTestIds}</td>
                            <td><span class="badge badge-info">${services}</span></td>
                            <td><span class="badge ${coverageClass}">${mapping.coverageStatus}</span></td>
                            <td><span class="badge badge-info">${mapping.scenario.priority}</span></td>
                            <td style="font-size: 0.9em;">${mapping.gapExplanation}</td>
                            <td>${actionRequired}</td>
                            <td style="font-size: 0.85em;">${suggestion}</td>
                        </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        ${orphanTestsSection}
        
        <div class="section" style="background: #f8f9fa; text-align: center;">
            <h3 style="color: #667eea; margin-bottom: 15px;">📊 Coverage Summary</h3>
            <p style="font-size: 1.2em; color: #333;">
                <strong>${coveragePercent}%</strong> of scenarios have adequate unit test coverage
            </p>
            <p style="color: #666; margin-top: 10px;">
                ${stats.fullyCovered} fully covered | ${stats.partiallyCovered} partial | ${stats.notCovered} not covered
            </p>
        </div>
    </div>
</body>
</html>`;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const mode = args.includes('--selective') ? 'selective' : 'full';
  
  // Always generate HTML with timestamp
  const format = 'html';
  
  // Check for environment variables (for Docker usage)
  let outputName = process.env.TM_OUTPUT;
  const reportJsonPath = process.env.REPORT_JSON;
  
  // If no output name provided, generate timestamped name
  if (!outputName) {
    // Use REPORT_TIMESTAMP from environment if available (to match test report timestamp)
    const envTimestamp = process.env.REPORT_TIMESTAMP;
    const timestamp = envTimestamp || new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');
    const prefix = mode === 'selective' ? 'selective-traceability-matrix' : 'traceability-matrix';
    outputName = `${prefix}-${timestamp}.html`;
  }
  
  await generateTraceabilityMatrix({
    format,
    mode,
    outputName,
    reportJsonPath
  });
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error generating matrix:', error);
    process.exit(1);
  });
}

// Export for programmatic use
export { generateTraceabilityMatrix, GenerationOptions };
