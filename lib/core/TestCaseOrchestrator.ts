/**
 * Test Case Orchestrator
 * 
 * Main orchestrator for AI-powered test case generation system
 * Coordinates:
 * - Swagger parsing
 * - API discovery
 * - AI test case generation
 * - Delta analysis
 * - Two-folder architecture management
 */

import { ServiceConfig } from '../types';
import { SwaggerParser, SwaggerAPI } from './SwaggerParser';
import { APIScanner, DiscoveredAPI } from './APIScanner';
import { AITestCaseGenerator, DeltaAnalysis } from './AITestCaseGenerator';
import * as fs from 'fs';
import * as path from 'path';

export interface OrchestrationResult {
  service: string;
  apisProcessed: number;
  testCasesGenerated: number;
  deltaAnalyses: DeltaAnalysis[];
  summary: string;
  errors: string[];
}

export class TestCaseOrchestrator {
  private generator: AITestCaseGenerator;
  private projectRoot: string;

  constructor(apiKey: string, projectRoot: string) {
    this.generator = new AITestCaseGenerator(apiKey, projectRoot);
    this.projectRoot = projectRoot;
  }

  /**
   * Get API path (handles both SwaggerAPI and DiscoveredAPI)
   */
  private getAPIPath(api: SwaggerAPI | DiscoveredAPI): string {
    return 'path' in api ? api.path : api.endpoint;
  }

  /**
   * Process a service - discover APIs and generate test cases
   */
  async processService(service: ServiceConfig): Promise<OrchestrationResult> {
    console.log(`\n🔍 Processing service: ${service.name}`);
    console.log(`   Path: ${service.path}`);

    const errors: string[] = [];
    const deltaAnalyses: DeltaAnalysis[] = [];
    let apisProcessed = 0;
    let testCasesGenerated = 0;

    try {
      // Step 1: Try to find and parse Swagger file
      const swaggerAPIs = await this.discoverSwaggerAPIs(service);
      
      // Step 2: Discover APIs from code
      const discoveredAPIs = await this.discoverCodeAPIs(service);

      // Combine APIs (prefer Swagger as it has more metadata)
      const allAPIs = this.mergeAPIs(swaggerAPIs, discoveredAPIs);

      console.log(`   ✓ Found ${allAPIs.length} API(s)`);

      // Step 3: Generate test cases for each API
      for (const api of allAPIs) {
        try {
          const apiPath = this.getAPIPath(api);
          console.log(`\n   📝 Generating test cases for: ${api.method} ${apiPath}`);
          
          // Initialize baseline if it doesn't exist
          await this.generator.initializeBaseline(apiPath, api.method);

          // Generate test cases using AI
          const result = await this.generator.generateTestCases(api);
          testCasesGenerated += result.testCases.length;

          // Save AI-generated cases
          this.generator.saveAIGeneratedCases(result);

          // Perform delta analysis
          const delta = this.generator.performDeltaAnalysis(result);
          deltaAnalyses.push(delta);

          // Print delta summary
          console.log(`   ${delta.summary}`);
          
          apisProcessed++;
        } catch (error) {
          const apiPath = this.getAPIPath(api);
          const errorMsg = `Failed to process ${api.method} ${apiPath}: ${error}`;
          console.error(`   ✗ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      // Generate summary report
      const summary = this.generateSummary(service.name, apisProcessed, testCasesGenerated, deltaAnalyses);

      return {
        service: service.name,
        apisProcessed,
        testCasesGenerated,
        deltaAnalyses,
        summary,
        errors
      };

    } catch (error) {
      const errorMsg = `Service processing failed: ${error}`;
      console.error(`   ✗ ${errorMsg}`);
      errors.push(errorMsg);

      return {
        service: service.name,
        apisProcessed: 0,
        testCasesGenerated: 0,
        deltaAnalyses: [],
        summary: 'Processing failed',
        errors
      };
    }
  }

  /**
   * Discover APIs from Swagger/OpenAPI spec
   */
  private async discoverSwaggerAPIs(service: ServiceConfig): Promise<SwaggerAPI[]> {
    const servicePath = path.join(this.projectRoot, service.path);
    const swaggerFiles = SwaggerParser.findSwaggerFiles(servicePath);

    if (swaggerFiles.length === 0) {
      console.log(`   ℹ️  No Swagger/OpenAPI spec found`);
      return [];
    }

    console.log(`   ✓ Found Swagger spec: ${path.basename(swaggerFiles[0])}`);

    try {
      const spec = SwaggerParser.parseFile(swaggerFiles[0]);
      const apis = SwaggerParser.extractAPIs(spec);
      console.log(`   ✓ Extracted ${apis.length} API(s) from Swagger`);
      return apis;
    } catch (error) {
      console.warn(`   ⚠️  Failed to parse Swagger: ${error}`);
      return [];
    }
  }

  /**
   * Discover APIs from source code
   */
  private async discoverCodeAPIs(service: ServiceConfig): Promise<DiscoveredAPI[]> {
    const scanner = new APIScanner();
    
    try {
      const apis = await scanner.scanAPIs(service);
      console.log(`   ✓ Discovered ${apis.length} API(s) from code`);
      return apis;
    } catch (error) {
      console.warn(`   ⚠️  Failed to scan code: ${error}`);
      return [];
    }
  }

  /**
   * Merge Swagger and discovered APIs (prefer Swagger for richer metadata)
   */
  private mergeAPIs(swaggerAPIs: SwaggerAPI[], discoveredAPIs: DiscoveredAPI[]): Array<SwaggerAPI | DiscoveredAPI> {
    const merged: Array<SwaggerAPI | DiscoveredAPI> = [...swaggerAPIs];
    
    // Add discovered APIs that aren't in Swagger
    for (const discovered of discoveredAPIs) {
      const existsInSwagger = swaggerAPIs.some(swagger => 
        this.getAPIPath(swagger) === discovered.endpoint && 
        swagger.method === discovered.method
      );

      if (!existsInSwagger) {
        merged.push(discovered);
      }
    }

    return merged;
  }

  /**
   * Generate summary report
   */
  private generateSummary(
    serviceName: string,
    apisProcessed: number,
    testCasesGenerated: number,
    deltaAnalyses: DeltaAnalysis[]
  ): string {
    const totalAdded = deltaAnalyses.reduce((sum, d) => sum + d.added.length, 0);
    const totalRemoved = deltaAnalyses.reduce((sum, d) => sum + d.removed.length, 0);
    const totalModified = deltaAnalyses.reduce((sum, d) => sum + d.modified.length, 0);
    const totalCommon = deltaAnalyses.reduce((sum, d) => sum + d.common.length, 0);

    let summary = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SERVICE SUMMARY: ${serviceName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

APIs Processed: ${apisProcessed}
Test Cases Generated: ${testCasesGenerated}

DELTA ANALYSIS:
  🆕 Added:    ${totalAdded}
  🗑️  Removed:  ${totalRemoved}
  ✏️  Modified: ${totalModified}
  ✅ Common:   ${totalCommon}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    if (totalAdded > 0 || totalRemoved > 0 || totalModified > 0) {
      summary += `\n⚠️  QA ACTION REQUIRED:\n`;
      summary += `   Review AI-generated cases in: .traceability/test-cases/ai_cases/\n`;
      summary += `   Update baseline cases in: .traceability/test-cases/baseline/\n\n`;
    } else {
      summary += `\n✨ No changes detected - all test cases are up to date!\n\n`;
    }

    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    return summary;
  }

  /**
   * Generate comprehensive delta report
   */
  generateComprehensiveReport(results: OrchestrationResult[]): string {
    let report = `
╔════════════════════════════════════════════════════════════════════════╗
║                  AI TEST CASE GENERATION REPORT                        ║
║                  Two-Folder Architecture                               ║
╚════════════════════════════════════════════════════════════════════════╝

Generated: ${new Date().toISOString()}

`;

    for (const result of results) {
      report += result.summary;
      
      // Add detailed delta for each API
      if (result.deltaAnalyses.length > 0) {
        report += `\n📋 DETAILED ANALYSIS FOR ${result.service}:\n`;
        report += `${'='.repeat(75)}\n\n`;
        
        for (const delta of result.deltaAnalyses) {
          report += this.generator.generateDeltaReport(delta);
          report += `\n`;
        }
      }

      if (result.errors.length > 0) {
        report += `\n❌ ERRORS:\n`;
        result.errors.forEach(err => {
          report += `   - ${err}\n`;
        });
        report += `\n`;
      }
    }

    // Overall summary
    const totalAPIs = results.reduce((sum, r) => sum + r.apisProcessed, 0);
    const totalTestCases = results.reduce((sum, r) => sum + r.testCasesGenerated, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    report += `
╔════════════════════════════════════════════════════════════════════════╗
║                          OVERALL SUMMARY                               ║
╚════════════════════════════════════════════════════════════════════════╝

Services Processed:     ${results.length}
Total APIs:            ${totalAPIs}
Total Test Cases:      ${totalTestCases}
Errors:                ${totalErrors}

📁 FOLDER ARCHITECTURE:
   
   baseline/          - QA-managed test cases (ground truth)
                       - Edit these files to maintain your test suite
                       - Not overwritten automatically
   
   ai_cases/          - AI-generated test cases (reference only)
                       - Regenerated on every commit
                       - Use for comparison and review
                       - Shows what AI suggests

🎯 NEXT STEPS FOR QA:

1. Review ai_cases/ folder for new suggestions
2. Compare with baseline/ folder
3. Add relevant new cases to baseline/
4. Remove obsolete cases from baseline/
5. Update modified cases in baseline/

💡 TIP: Use the delta analysis above to quickly identify what needs review!

╚════════════════════════════════════════════════════════════════════════╝
`;

    return report;
  }

  /**
   * Save comprehensive report to file
   */
  saveReport(results: OrchestrationResult[]): void {
    const reportDir = path.join(this.projectRoot, '.traceability', 'test-cases', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-case-generation-${timestamp}.txt`;
    const filePath = path.join(reportDir, filename);

    const report = this.generateComprehensiveReport(results);
    fs.writeFileSync(filePath, report);

    console.log(`\n📄 Comprehensive report saved: ${filename}`);
  }
}
