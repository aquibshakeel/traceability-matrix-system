#!/usr/bin/env ts-node

import { EnhancedCoverageAnalyzer } from '../lib/core/EnhancedCoverageAnalyzer';
import { ReportGenerator } from '../lib/core/ReportGenerator';
import { ServiceConfig } from '../lib/types';
import * as path from 'path';
import * as fs from 'fs';

async function runAnalysis() {
  const serviceName = process.argv[2] || 'customer-service';
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ERROR: CLAUDE_API_KEY environment variable required');
    console.error('Set it with: export CLAUDE_API_KEY="your-key-here"');
    process.exit(1);
  }
  
  console.log(`\n╔══════════════════════════════════════════════════════════════════════╗`);
  console.log(`║         📊 Coverage Analysis - ${serviceName.padEnd(34)}║`);
  console.log(`╚══════════════════════════════════════════════════════════════════════╝\n`);

  const projectRoot = process.cwd();
  const serviceDir = path.join(projectRoot, 'services', serviceName);
  const baselineFile = path.join(projectRoot, '.traceability', 'test-cases', 'baseline', `${serviceName}-baseline.yml`);
  const reportDir = path.join(projectRoot, '.traceability', 'reports');

  // Check if baseline exists
  if (!fs.existsSync(baselineFile)) {
    console.error(`❌ ERROR: Baseline file not found: ${baselineFile}`);
    process.exit(1);
  }

  console.log(`📁 Service Directory: ${serviceDir}`);
  console.log(`📄 Baseline File: ${baselineFile}`);
  console.log(`📊 Report Directory: ${reportDir}`);
  console.log();

  try {
    // Initialize analyzer
    console.log('🔍 Initializing coverage analyzer...');
    const analyzer = new EnhancedCoverageAnalyzer(apiKey, projectRoot);

    // Create service config
    const serviceConfig: ServiceConfig = {
      name: serviceName,
      enabled: true,
      path: serviceDir,
      language: 'java',
      testFramework: 'junit',
      testDirectory: 'src/test/java',
      testPattern: '**/*Test.java'
    };

    // Run analysis
    console.log('📈 Running coverage analysis...');
    const analysisResult = await analyzer.analyze(serviceConfig);

    // Generate report
    console.log('📝 Generating reports...');
    const reportGenerator = new ReportGenerator(projectRoot);
    
    // Create empty git changes (not using git tracking for this analysis)
    const emptyGitChanges = {
      branch: 'main',
      summary: {
        apisAdded: 0,
        apisModified: 0,
        apisRemoved: 0,
        apisWithoutTests: 0,
        testsAdded: 0,
        testsModified: 0,
        testsRemoved: 0
      },
      apiChanges: [],
      affectedServices: []
    };
    
    const reportOptions = {
      formats: ['html' as const, 'json' as const],
      outputDir: '.traceability/reports',
      serviceName: serviceName,
      openHtmlAutomatically: false
    };
    
    await reportGenerator.generateReports(analysisResult, emptyGitChanges, reportOptions);
    const reportPath = path.join(reportDir, `${serviceName}-report.html`);

    console.log();
    console.log('✅ Analysis Complete!');
    console.log(`📊 Report generated: ${reportPath}`);
    console.log();
    
    // Print summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 COVERAGE SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    
    for (const api of analysisResult.apis) {
      const total = api.scenarios.length;
      const covered = api.coveredScenarios;
      const coverage = total > 0 ? (covered / total) * 100 : 0;
      const status = coverage === 100 ? '✅' : coverage > 0 ? '⚠️' : '❌';
      console.log(`${status} ${api.api}: ${coverage.toFixed(0)}% (${covered}/${total} scenarios covered)`);
    }
    
    console.log();
    console.log(`Overall Coverage: ${analysisResult.coveragePercent.toFixed(1)}%`);
    console.log(`Total Gaps: ${analysisResult.gaps.length}`);
    console.log(`Orphan Tests: ${analysisResult.orphanTests.totalOrphans}`);
    if (analysisResult.orphanAPIs && analysisResult.orphanAPIs.length > 0) {
      console.log(`Orphan APIs: ${analysisResult.orphanAPIs.length}`);
    }
    console.log('═══════════════════════════════════════════════════════════════');
    console.log();

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runAnalysis();
