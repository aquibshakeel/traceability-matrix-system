/**
 * Multi-Format Report Generator  
 * Generates comprehensive coverage reports in HTML, JSON, CSV, and Markdown formats
 */

import * as fs from 'fs';
import * as path from 'path';
import { CoverageAnalysis } from './EnhancedCoverageAnalyzer';
import { GitChangeAnalysis } from './GitChangeDetector';

export interface ReportOptions {
  formats: Array<'html' | 'json' | 'csv' | 'markdown'>;
  outputDir: string;
  serviceName: string;
  openHtmlAutomatically?: boolean;
}

export interface GeneratedReport {
  format: string;
  filePath: string;
  fileSize: number;
}

export class ReportGenerator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async generateReports(
    analysis: CoverageAnalysis,
    gitChanges: GitChangeAnalysis,
    options: ReportOptions
  ): Promise<GeneratedReport[]> {
    console.log(`\n📄 Generating reports...`);

    // Ensure output directory exists
    const outputDir = path.join(this.projectRoot, options.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const reports: GeneratedReport[] = [];

    for (const format of options.formats) {
      let filePath: string;
      let content: string;

      switch (format) {
        case 'html':
          filePath = path.join(outputDir, `${options.serviceName}-report.html`);
          content = this.generateHTML(analysis, gitChanges, options.serviceName);
          break;
        case 'json':
          filePath = path.join(outputDir, `${options.serviceName}-report.json`);
          content = this.generateJSON(analysis, gitChanges);
          break;
        case 'csv':
          filePath = path.join(outputDir, `${options.serviceName}-report.csv`);
          content = this.generateCSV(analysis);
          break;
        case 'markdown':
          filePath = path.join(outputDir, `${options.serviceName}-report.md`);
          content = this.generateMarkdown(analysis, gitChanges, options.serviceName);
          break;
        default:
          continue;
      }

      fs.writeFileSync(filePath, content, 'utf-8');
      const stats = fs.statSync(filePath);
      
      reports.push({
        format,
        filePath,
        fileSize: stats.size
      });

      console.log(`  ✅ ${format.toUpperCase()}: ${filePath} (${(stats.size / 1024).toFixed(1)} KB)`);
    }

    // Open HTML report if requested
    if (options.openHtmlAutomatically && options.formats.includes('html')) {
      const htmlReport = reports.find(r => r.format === 'html');
      if (htmlReport) {
        console.log(`\n🌐 Opening HTML report...`);
        this.openInBrowser(htmlReport.filePath);
      }
    }

    return reports;
  }

  private generateHTML(analysis: CoverageAnalysis, gitChanges: GitChangeAnalysis, serviceName: string): string {
    // Load the enhanced template
    const templatePath = path.join(__dirname, '../templates/enhanced-report.html');
    let template = fs.readFileSync(templatePath, 'utf-8');
    
    const { summary, apis, orphanTests, orphanAPIs, gaps, visualAnalytics } = analysis;
    
    // Build dynamic sections - REORDERED: Gaps first!
    const gapsSection = this.buildGapsSection(gaps);
    const apiCoverageSection = this.buildAPICoverageSection(apis);
    const traceabilitySection = this.buildTraceabilitySection(apis);
    const orphanAPIsSection = this.buildOrphanAPIsSection(orphanAPIs, analysis.orphanAPISummary);
    const orphanTestsSection = this.buildOrphanTestsSection(orphanTests, serviceName);
    const gitChangesSection = this.buildGitChangesSection(gitChanges);
    
    // Replace placeholders (using global regex for multiple occurrences)
    template = template
      .replace(/{{TIMESTAMP}}/g, analysis.timestamp.toLocaleString())
      .replace(/{{DURATION}}/g, '0')
      .replace(/{{STATUS_CLASS}}/g, summary.p0Gaps > 0 ? 'failure' : 'success')
      .replace(/{{STATUS_TEXT}}/g, summary.p0Gaps > 0 ? '❌ P0 Gaps Detected' : '✅ All Tests Passing')
      .replace(/{{COVERAGE_PERCENT}}/g, summary.coveragePercent.toFixed(1))
      .replace(/{{FULLY_COVERED}}/g, summary.fullyCovered.toString())
      .replace(/{{TOTAL_SCENARIOS}}/g, summary.totalScenarios.toString())
      .replace(/{{SERVICES_ANALYZED}}/g, '1')
      .replace(/{{TOTAL_TESTS}}/g, analysis.unitTestsFound.toString())
      .replace(/{{ORPHAN_TESTS}}/g, orphanTests.totalOrphans.toString())
      .replace(/{{P0_GAPS}}/g, summary.p0Gaps.toString())
      .replace(/{{PARTIALLY_COVERED}}/g, summary.partiallyCovered.toString())
      .replace(/{{NOT_COVERED}}/g, summary.notCovered.toString())
      .replace(/{{COVERAGE_TREND_CLASS}}/g, 'up')
      .replace(/{{COVERAGE_TREND_ICON}}/g, '📈')
      .replace(/{{COVERAGE_TREND_TEXT}}/g, 'Baseline')
      .replace(/{{P0_TREND_CLASS}}/g, summary.p0Gaps > 0 ? 'up' : 'down')
      .replace(/{{P0_TREND_ICON}}/g, summary.p0Gaps > 0 ? '⬆️' : '⬇️')
      .replace(/{{P0_TREND_TEXT}}/g, summary.p0Gaps > 0 ? `${summary.p0Gaps} critical` : '0 critical')
      .replace('{{REPORT_DATA_JSON}}', JSON.stringify({
        summary,
        apis,
        orphanTests: orphanTests.businessTests.concat(orphanTests.technicalTests)
      }))
      .replace('{{TREND_DATA_JSON}}', JSON.stringify({
        snapshots: visualAnalytics?.coverageTrend || []
      }))
      .replace('{{GAPS_SECTION}}', gapsSection)
      .replace('{{ORPHAN_APIS_SECTION}}', orphanAPIsSection)
      .replace('{{ORPHAN_TESTS_SECTION}}', orphanTestsSection)
      .replace('{{RECOMMENDATIONS_SECTION}}', '')
      .replace('{{ERRORS_SECTION}}', '')
      .replace('{{API_COVERAGE_SECTION}}', apiCoverageSection)
      .replace('{{TRACEABILITY_SECTION}}', traceabilitySection)
      .replace('{{GIT_CHANGES_SECTION}}', gitChangesSection)
      .replace('{{GENERATION_DATE}}', new Date().toLocaleDateString());
    
    return template;
  }

  private buildAPICoverageSection(apis: any[], orphanAPIs?: any[]): string {
    if (apis.length === 0 && (!orphanAPIs || orphanAPIs.length === 0)) return '';
    
    // CRITICAL FIX: Include ALL APIs in report (with baseline AND without baseline)
    // All APIs from baseline analysis (includes those with 0 scenarios)
    const allAPIsToShow = apis;
    
    if (allAPIsToShow.length === 0) return '';
    
    return `
<div class="section">
  <h2>
    🎯 API Coverage Analysis (Unit Tests vs Baseline)
    <span class="section-toggle" onclick="toggleSection('api-coverage')">▼</span>
  </h2>
  <div class="section-content" id="api-coverage-content">
    ${allAPIsToShow.map(api => {
      const hasMissing = api.uncoveredScenarios > 0;
      const aiAnalysis = api.aiAnalysis || {};
      const hasAIAnalysis = aiAnalysis.suggestedScenarios && aiAnalysis.suggestedScenarios.length > 0;
      
      return `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
      <h4 style="color: #667eea; margin-bottom: 15px;">${api.api}</h4>
      
      <!-- Actual Coverage Results (Baseline vs Unit Tests) -->
      <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 3px solid #28a745;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <span style="font-size: 1.2em;">✅</span>
          <strong style="color: #333;">Actual Coverage (Baseline vs Unit Tests)</strong>
        </div>
        <div style="margin-bottom: 15px; display: flex; gap: 10px;">
          <span style="background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 0.95em;">${api.coveredScenarios} Fully covered</span>
          <span style="background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 0.95em;">${api.partiallyCoveredScenarios} Partially covered</span>
          <span style="background: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 0.95em;">${api.uncoveredScenarios} Missing unit tests</span>
        </div>
        ${api.matchedTests.map((match: any) => {
          const testCount = match.tests ? match.tests.length : 0;
          const hasTests = testCount > 0;
          
          return `
        <div style="padding: 15px; margin: 5px 0; background: #f8f9fa; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="flex: 1;">${match.scenario}</span>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="color: ${match.status === 'FULLY_COVERED' ? '#28a745' : match.status === 'PARTIALLY_COVERED' ? '#ffc107' : '#dc3545'}; font-weight: bold;">
                ${match.status.replace('_', ' ')}
              </span>
              ${hasTests ? `
              <details style="display: inline-block;">
                <summary style="cursor: pointer; color: #667eea; font-weight: 600; user-select: none; list-style: none;">
                  (${testCount} test${testCount !== 1 ? 's' : ''}) ▼
                </summary>
                <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e5e7eb;">
                  ${(match.matchDetails || []).map((detail: any) => `
                  <div style="padding: 8px; margin: 5px 0; background: #f8f9fa; border-radius: 3px;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${detail.testDescription}</div>
                    <div style="font-size: 0.85em; color: #666;">
                      <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${detail.file}</code>
                      ${detail.lineNumber ? `<span style="margin-left: 8px;">Line: ${detail.lineNumber}</span>` : ''}
                      <span style="margin-left: 8px; color: ${detail.matchConfidence === 'HIGH' ? '#28a745' : detail.matchConfidence === 'MEDIUM' ? '#ffc107' : '#dc3545'};">
                        ${detail.matchConfidence} Confidence
                      </span>
                    </div>
                  </div>
                  `).join('')}
                </div>
              </details>
              ` : `<span style="color: #999;">(0 tests)</span>`}
            </div>
          </div>
        </div>
        `;
        }).join('')}
      </div>
      
      ${hasAIAnalysis || aiAnalysis.message ? `
      <!-- AI-Powered Analysis & Recommendations -->
      <div style="background: linear-gradient(135deg, #e7f3ff 0%, #f0f7ff 100%); padding: 15px; border-radius: 8px; border-left: 3px solid #667eea; margin-top: 15px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <span style="font-size: 1.2em;">🤖</span>
          <strong style="color: #667eea;">AI-Powered Analysis (from API Spec)</strong>
          <span class="badge badge-info" style="font-size: 0.75em; background: #667eea; color: white; padding: 4px 8px; border-radius: 12px;">AI SUGGESTION</span>
        </div>
        
        ${aiAnalysis.message ? `
        <div style="padding: 12px; background: rgba(102, 126, 234, 0.1); border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #667eea;">
          <strong style="color: #667eea;">📊 Coverage Assessment:</strong>
          <div style="margin-top: 6px; color: #333; line-height: 1.6;">${aiAnalysis.message}</div>
        </div>
        ` : ''}
        
        ${hasAIAnalysis ? `
        <details open style="background: white; padding: 12px; border-radius: 6px; margin-top: 10px;">
          <summary style="cursor: pointer; font-weight: 600; color: #333; user-select: none; list-style: none; display: flex; justify-content: space-between; align-items: center;">
            <span>📋 Additional Scenarios Suggested by AI (${aiAnalysis.suggestedScenarios.length})</span>
            <span style="color: #667eea; font-size: 0.9em;">▼</span>
          </summary>
          <p style="margin: 10px 0; color: #666; font-size: 0.85em; font-style: italic;">
            ⚠️ These are AI-generated suggestions based on API specification analysis to achieve comprehensive coverage.
          </p>
          <ul style="margin: 8px 0 0 20px; padding: 0; color: #555; line-height: 1.8;">
            ${aiAnalysis.suggestedScenarios.map((suggestion: string) => `
            <li style="margin-bottom: 5px;"><span style="color: #667eea; font-weight: 600;">🆕</span> ${suggestion}</li>
            `).join('')}
          </ul>
        </details>
        ` : ''}
        
        <!-- Intelligent Action Items -->
        <details open style="background: rgba(102, 126, 234, 0.1); padding: 15px; border-radius: 8px; margin-top: 12px; border-left: 3px solid #667eea;">
          <summary style="cursor: pointer; user-select: none; list-style: none; display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #667eea; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> Recommended Actions:
            </strong>
            <span style="color: #667eea; font-size: 0.9em;">▼</span>
          </summary>
          <div style="margin-top: 12px; display: grid; gap: 12px;">
            ${api.uncoveredScenarios > 0 ? `
            <details style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #dc3545;">
              <summary style="cursor: pointer; user-select: none; list-style: none; display: flex; align-items: center; gap: 8px; font-weight: 600; color: #dc3545;">
                <span>🚨 URGENT:</span>
                <span>${api.uncoveredScenarios} baseline scenarios have NO unit tests</span>
                <span style="margin-left: auto; font-size: 0.9em;">▼</span>
              </summary>
              <div style="margin-top: 12px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <strong style="display: block; margin-bottom: 8px; color: #333;">Missing Tests for These Scenarios:</strong>
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8; color: #555;">
                  ${api.matchedTests.filter((m: any) => m.status === 'NOT_COVERED').map((m: any) => `
                  <li><span style="color: #dc3545;">❌</span> ${m.scenario}</li>
                  `).join('')}
                </ul>
                <div style="margin-top: 12px; padding: 10px; background: #fff3cd; border-radius: 4px; border-left: 3px solid #ffc107;">
                  <strong style="color: #856404;">👨‍💻 DEV Action:</strong>
                  <p style="margin: 5px 0 0 0; color: #555;">Implement unit tests for all ${api.uncoveredScenarios} scenarios listed above. Focus on P0 (auth, security) and P1 (error handling) cases first.</p>
                </div>
              </div>
            </details>
            ` : ''}
            ${hasAIAnalysis && aiAnalysis.missingScenarios && aiAnalysis.missingScenarios > 0 ? `
            <details style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #667eea;">
              <summary style="cursor: pointer; user-select: none; list-style: none; display: flex; align-items: center; gap: 8px; font-weight: 600; color: #667eea;">
                <span>💡 RECOMMENDED:</span>
                <span>${aiAnalysis.missingScenarios} AI-suggested scenarios for comprehensive coverage</span>
                <span style="margin-left: auto; font-size: 0.9em;">▼</span>
              </summary>
              <div style="margin-top: 12px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <div style="margin-bottom: 12px; padding: 10px; background: #e7f3ff; border-radius: 4px; border-left: 3px solid #667eea;">
                  <strong style="color: #667eea;">👥 QA Action:</strong>
                  <p style="margin: 5px 0 0 0; color: #555;">Review the ${aiAnalysis.missingScenarios} AI-suggested scenarios in the "Additional Scenarios" section above. Add approximately ${Math.ceil(aiAnalysis.missingScenarios / 2)} high-priority ones to baseline (focus on security, edge cases, and error handling).</p>
                </div>
                <div style="padding: 10px; background: #fff3cd; border-radius: 4px; border-left: 3px solid #ffc107;">
                  <strong style="color: #856404;">👨‍💻 DEV Action:</strong>
                  <p style="margin: 5px 0 0 0; color: #555;">After QA adds scenarios to baseline, implement unit tests prioritizing:
                    <br>1. Authentication & authorization checks
                    <br>2. SQL injection & XSS validation
                    <br>3. Error handling & edge cases
                  </p>
                </div>
              </div>
            </details>
            ` : api.uncoveredScenarios === 0 && api.coveredScenarios > 0 ? `
            <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #10b981; display: flex; align-items: start; gap: 8px;">
              <span style="color: #10b981; font-weight: bold; min-width: 80px;">✅ Status:</span>
              <span style="color: #555;">Baseline fully covered! ${hasAIAnalysis ? `Consider adding ${Math.min(5, aiAnalysis.suggestedScenarios.length)} AI-suggested edge cases for production readiness` : 'Consider adding edge case scenarios for production readiness'}</span>
            </div>
            ` : ''}
          </div>
        </details>
      </div>
      ` : ''}
      
      ${hasMissing && !hasAIAnalysis ? `
      <!-- Action Items for Missing Coverage -->
      <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin-top: 15px;">
        <div style="color: #7f1d1d; background: white; padding: 15px; border-radius: 6px; text-align: center;">
          <strong style="color: #991b1b; font-size: 1.2em;">⚠️ Action Required</strong>
          <div style="margin-top: 10px; font-size: 1.05em;">
            <strong>👨‍💻 DEV Team:</strong> Implement unit tests for the <strong>${api.uncoveredScenarios} missing baseline scenarios</strong> listed above
          </div>
        </div>
      </div>
      ` : ''}
    </div>
    `;
    }).join('')}
  </div>
</div>`;
  }

  private buildTraceabilitySection(apis: any[]): string {
    const hasTraceability = apis.some((api: any) => 
      api.matchedTests.some((m: any) => m.matchDetails && m.matchDetails.length > 0)
    );
    
    if (!hasTraceability) return '';
    
    return `
<div class="section">
  <h2>
    🔗 Traceability Matrix (Unit Tests vs Baseline Scenarios)
    <span class="section-toggle" onclick="toggleSection('traceability')">▼</span>
  </h2>
  <div class="section-content" id="traceability-content">
    <div style="background: linear-gradient(135deg, #f0f7ff 0%, #e7f3ff 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
      <p style="margin: 0; color: #333;"><strong>📋 Traceability Confidence:</strong> This section shows exact mapping between baseline scenarios and unit tests, including file locations and match confidence levels for verification.</p>
    </div>
    ${apis.map(api => {
      const matches = api.matchedTests.filter((m: any) => m.matchDetails && m.matchDetails.length > 0);
      if (matches.length === 0) return '';
      
      return `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
        <h4 style="color: #667eea; margin-bottom: 15px;">${api.api}</h4>
        ${matches.map((match: any) => `
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${match.status === 'FULLY_COVERED' ? '#28a745' : match.status === 'PARTIALLY_COVERED' ? '#ffc107' : '#dc3545'};">
          <div style="margin-bottom: 15px;">
            <strong style="color: #333; font-size: 1.05em;">📝 Scenario:</strong>
            <div style="padding: 10px; background: #f8f9fa; border-radius: 4px; margin-top: 8px;">
              ${match.scenario}
            </div>
          </div>
          <div>
            <strong style="color: #333;">✅ Matched Unit Tests (${match.matchDetails?.length || 0}):</strong>
            <div style="margin-top: 10px;">
              ${(match.matchDetails || []).map((detail: any) => `
              <div style="padding: 12px; background: #f8f9fa; border-radius: 4px; margin-top: 8px; border-left: 3px solid #667eea;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-weight: 600; color: #333;">${detail.testDescription}</span>
                  <span class="badge badge-${detail.matchConfidence === 'HIGH' ? 'success' : detail.matchConfidence === 'MEDIUM' ? 'warning' : 'danger'}">${detail.matchConfidence} Confidence</span>
                </div>
                <div style="font-size: 0.9em; color: #666;">
                  <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${detail.file}</code>
                  ${detail.lineNumber ? `<span style="margin-left: 10px;">Line: ${detail.lineNumber}</span>` : ''}
                </div>
              </div>
              `).join('')}
            </div>
          </div>
        </div>
        `).join('')}
      </div>
      `;
    }).join('')}
  </div>
</div>`;
  }

  private buildGitChangesSection(gitChanges: GitChangeAnalysis): string {
    if (gitChanges.summary.apisAdded === 0 && 
        gitChanges.summary.apisModified === 0 && 
        gitChanges.summary.apisRemoved === 0) {
      return '';
    }
    
    return `
<div class="section">
  <h2>
    🔄 Git Changes Detected
    <span class="section-toggle" onclick="toggleSection('git-changes')">▼</span>
  </h2>
  <div class="section-content" id="git-changes-content">
    <div style="background: #e7f3ff; padding: 20px; border-radius: 8px;">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
        <div>
          <strong style="color: #28a745;">+${gitChanges.summary.apisAdded}</strong> APIs Added
        </div>
        <div>
          <strong style="color: #fd7e14;">~${gitChanges.summary.apisModified}</strong> APIs Modified
        </div>
        <div>
          <strong style="color: #dc3545;">-${gitChanges.summary.apisRemoved}</strong> APIs Removed
        </div>
      </div>
      ${gitChanges.summary.apisWithoutTests > 0 ? `
      <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">
        <strong>⚠️ Action Required:</strong> ${gitChanges.summary.apisWithoutTests} new API(s) without tests detected!
      </div>
      ` : ''}
    </div>
  </div>
</div>`;
  }

  private buildGapsSection(gaps: any[]): string {
    if (gaps.length === 0) return '';
    
    // Sort gaps by priority: P0 → P1 → P2 → P3
    const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
    const sortedGaps = [...gaps].sort((a, b) => {
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 999;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 999;
      return priorityA - priorityB;
    });
    
    return `
<div class="section">
  <h2>
    ⚠️ Coverage Gaps (${gaps.length})
    <span class="section-toggle" onclick="toggleSection('gaps')">▼</span>
  </h2>
  <div class="section-content" id="gaps-content">
    ${sortedGaps.map(gap => `
    <div class="gap-item ${gap.priority.toLowerCase()}" data-priority="${gap.priority.toLowerCase()}" data-status="not-covered">
      <div class="gap-header">
        <span class="gap-id">${gap.api}</span>
        <span class="priority-badge priority-${gap.priority.toLowerCase()}">${gap.priority}</span>
      </div>
      <div class="gap-description">${gap.scenario}</div>
      <div class="gap-recommendations">
        <h4>📋 Recommendations:</h4>
        <ul>
          ${gap.recommendations.map((r: string) => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    </div>
    `).join('')}
  </div>
</div>`;
  }

  private buildOrphanAPIsSection(orphanAPIs: any[], aiSummary?: string): string {
    if (!orphanAPIs || orphanAPIs.length === 0) return '';
    
    return `
<div class="section">
  <h2>
    ⚠️ Orphan APIs (${orphanAPIs.length})
    <span class="section-toggle" onclick="toggleSection('orphan-apis')">▼</span>
  </h2>
  <div class="section-content" id="orphan-apis-content">
    <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin-bottom: 20px;">
      <strong style="color: #991b1b; font-size: 1.1em;">⚠️ Critical:</strong> These APIs were discovered in code but have <strong>NO baseline scenarios AND NO unit tests</strong>. They are completely untracked and represent critical gaps in test coverage.
    </div>
    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th>Endpoint</th>
          <th>Controller</th>
          <th>Line</th>
          <th>Scenario</th>
          <th>Test</th>
        </tr>
      </thead>
      <tbody>
        ${orphanAPIs.map(api => `
        <tr>
          <td><span class="badge badge-info">${api.method}</span></td>
          <td><code>${api.endpoint}</code></td>
          <td>${api.controller}</td>
          <td>${api.lineNumber || 'N/A'}</td>
          <td><span style="color: #dc3545;">❌</span></td>
          <td><span style="color: #dc3545;">❌</span></td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    ${aiSummary ? `
    <div style="background: linear-gradient(135deg, #e7f3ff 0%, #f0f7ff 100%); padding: 25px; border-radius: 10px; border-left: 5px solid #667eea; margin-top: 30px; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
        <span style="font-size: 1.5em;">🤖</span>
        <h4 style="margin: 0; color: #667eea; font-size: 1.2em;">AI Analysis</h4>
      </div>
      <div style="color: #333; line-height: 1.8; font-size: 0.95em;">
        ${aiSummary.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #667eea;">$1</strong>')
          .replace(/\n/g, '<br>')}
      </div>
    </div>
    ` : ''}
  </div>
</div>`;
  }

  private buildOrphanTestsSection(orphanTests: any, serviceName: string): string {
    if (orphanTests.totalOrphans === 0) return '';
    
    const allTests = [...orphanTests.businessTests, ...orphanTests.technicalTests];
    
    // Generate copy-ready YAML format grouped by API endpoint
    const generateYAMLFormat = () => {
      const businessTests = orphanTests.businessTests;
      if (businessTests.length === 0) return '';
      
      // Convert test name to baseline "When X, then Y" format
      const convertToBaselineFormat = (testDesc: string): string => {
        // Remove test framework artifacts
        let scenario = testDesc
          .replace(/^test/i, '')
          .replace(/Test$/i, '')
          .trim();
        
        // Convert from camelCase/PascalCase to sentence, remove extra spaces
        scenario = scenario
          .replace(/([A-Z])/g, ' $1')
          .toLowerCase()
          .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
          .trim();
        
        // Try to format as "When X, then Y"
        if (scenario.includes('with') && scenario.includes('return')) {
          const parts = scenario.split('return');
          const condition = parts[0].replace(/^get |^post |^put |^delete /, '').trim();
          const result = parts[1] ? parts[1].trim() : '';
          return `When ${condition}, return ${result}`;
        } else if (scenario.includes('with') && scenario.includes('throw')) {
          const parts = scenario.split('throw');
          const condition = parts[0].replace(/^get |^post |^put |^delete /, '').trim();
          return `When ${condition}, throw exception`;
        } else if (scenario.includes('with')) {
          const condition = scenario.replace(/^get |^post |^put |^delete /, '').trim();
          return `When ${condition}, process successfully`;
        } else {
          // Fallback: just capitalize first letter
          return scenario.charAt(0).toUpperCase() + scenario.slice(1);
        }
      };
      
      // Group tests by inferred API and category
      interface GroupedTests {
        [api: string]: {
          happy_case: string[];
          edge_case: string[];
          error_case: string[];
          security: string[];
        };
      }
      
      const grouped: GroupedTests = {};
      
      businessTests.forEach((test: any) => {
        // Extract API from test description
        let api = 'GET /v1/customers/{id}'; // Default based on your tests
        const desc = test.description.toLowerCase();
        
        if (desc.includes('post') || desc.includes('create customer')) api = 'POST /v1/customers';
        else if (desc.includes('put') || desc.includes('update')) api = 'PUT /v1/customers/{id}';
        else if (desc.includes('delete')) api = 'DELETE /v1/customers/{id}';
        else if (desc.includes('get') && !desc.includes('{id}')) api = 'GET /v1/customers';
        
        if (!grouped[api]) {
          grouped[api] = { happy_case: [], edge_case: [], error_case: [], security: [] };
        }
        
        // Categorize by test type
        const scenario = convertToBaselineFormat(test.description);
        
        if (desc.includes('error') || desc.includes('exception') || desc.includes('invalid') || desc.includes('non existent')) {
          grouped[api].error_case.push(scenario);
        } else if (desc.includes('edge') || desc.includes('minimum') || desc.includes('maximum') || desc.includes('uuid') || desc.includes('empty')) {
          grouped[api].edge_case.push(scenario);
        } else if (desc.includes('sql') || desc.includes('xss') || desc.includes('injection') || desc.includes('security')) {
          grouped[api].security.push(scenario);
        } else {
          grouped[api].happy_case.push(scenario);
        }
      });
      
      let yaml = `service: ${serviceName}\n\n`;
      
      Object.keys(grouped).forEach(api => {
        yaml += `${api}:\n`;
        
        // Add categories in order: happy_case, edge_case, error_case, security
        if (grouped[api].happy_case.length > 0) {
          yaml += '  happy_case:\n';
          grouped[api].happy_case.forEach(scenario => {
            yaml += `    - ${scenario}\n`;
          });
          yaml += '\n';
        }
        
        if (grouped[api].edge_case.length > 0) {
          yaml += '  edge_case:\n';
          grouped[api].edge_case.forEach(scenario => {
            yaml += `    - ${scenario}\n`;
          });
          yaml += '\n';
        }
        
        if (grouped[api].error_case.length > 0) {
          yaml += '  error_case:\n';
          grouped[api].error_case.forEach(scenario => {
            yaml += `    - ${scenario}\n`;
          });
          yaml += '\n';
        }
        
        if (grouped[api].security.length > 0) {
          yaml += '  security:\n';
          grouped[api].security.forEach(scenario => {
            yaml += `    - ${scenario}\n`;
          });
          yaml += '\n';
        }
      });
      
      return yaml;
    };
    
    const yamlFormat = generateYAMLFormat();
    
    return `
<div class="section">
  <h2>
    🔍 Orphan Unit Tests (${orphanTests.totalOrphans})
    <span class="section-toggle" onclick="toggleSection('orphans')">▼</span>
  </h2>
  <div class="section-content" id="orphans-content">
    <div style="background: #fff8dc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0;"><strong>Orphan Unit Tests:</strong> ${orphanTests.totalOrphans} unit tests exist in the codebase but are not linked to baseline test scenarios.</p>
      <ul style="margin: 0; padding-left: 20px;">
        <li><strong>${orphanTests.businessTests.length} Business Tests:</strong> Cover business logic and require QA to add corresponding baseline scenarios for traceability</li>
        <li><strong>${orphanTests.technicalTests.length} Technical Tests:</strong> Infrastructure/utility tests that don't require baseline scenarios (no action needed)</li>
      </ul>
    </div>
    
    ${orphanTests.businessTests.length > 0 && yamlFormat ? `
    <div style="background: linear-gradient(135deg, #e7f3ff 0%, #f0f7ff 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div>
          <strong style="color: #667eea; font-size: 1.1em;">📋 Copy-Ready YAML Format for QA</strong>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9em;">Add these scenarios to your baseline YAML file</p>
        </div>
        <button onclick="copyYAMLToClipboard()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
          📋 Copy YAML
        </button>
      </div>
      <pre id="yaml-content" style="background: white; padding: 15px; border-radius: 6px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 0.9em; line-height: 1.6; color: #333; max-height: 400px; overflow-y: auto;">${yamlFormat}</pre>
    </div>
    <script>
    function copyYAMLToClipboard() {
      const yaml = document.getElementById('yaml-content').textContent;
      navigator.clipboard.writeText(yaml).then(() => {
        const btn = event.target;
        btn.textContent = '✓ Copied!';
        btn.style.background = '#10b981';
        setTimeout(() => {
          btn.textContent = '📋 Copy YAML';
          btn.style.background = '#667eea';
        }, 2000);
      });
    }
    </script>
    ` : ''}
    
    ${allTests.length > 0 ? `
    <table id="orphans-table" style="border-collapse: separate; border-spacing: 0 8px;">
      <thead>
        <tr>
          <th style="background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Service</th>
          <th style="background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Test Description</th>
          <th style="background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Category</th>
          <th style="background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Priority</th>
          <th style="background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Action</th>
        </tr>
      </thead>
      <tbody>
        ${allTests
          .sort((a: any, b: any) => {
            // Sort by priority: P0 → P1 → P2 → P3
            const priorityOrder: { [key: string]: number } = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
            const prioA = priorityOrder[a.orphanCategory?.priority || 'P3'] ?? 999;
            const prioB = priorityOrder[b.orphanCategory?.priority || 'P3'] ?? 999;
            return prioA - prioB;
          })
          .map((test: any, index: number) => `
        <tr data-priority="${(test.orphanCategory?.priority || 'p3').toLowerCase()}" style="background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: all 0.2s;">
          <td style="padding: 15px; border-left: 4px solid ${test.orphanCategory?.priority === 'P0' ? '#dc2626' : test.orphanCategory?.priority === 'P1' ? '#f59e0b' : test.orphanCategory?.priority === 'P2' ? '#3b82f6' : '#6b7280'}; vertical-align: top;">
            <strong style="color: #667eea;">${serviceName}</strong>
          </td>
          <td style="padding: 15px; vertical-align: top;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #333; font-size: 1.05em;">${test.description}</strong>
            </div>
            <details style="margin-top: 8px;">
              <summary style="cursor: pointer; color: #667eea; font-size: 0.9em; user-select: none;">
                📄 Show details
              </summary>
              <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 0.9em;">
                <div><strong>File:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${test.file}</code></div>
                ${test.orphanCategory?.actionRequired === 'qa_add_scenario' ? `
                <div style="margin-top: 8px; padding: 10px; background: #fff3cd; border-radius: 4px; border-left: 3px solid #f59e0b;">
                  <strong style="color: #856404;">QA Action:</strong> Add this scenario to baseline YAML:
                  <pre style="margin-top: 5px; padding: 8px; background: white; border-radius: 3px; overflow-x: auto; font-size: 0.85em;">  happy_case:
    - ${test.description}</pre>
                </div>
                ` : ''}
              </div>
            </details>
          </td>
          <td style="padding: 15px; vertical-align: top;">
            <span class="badge badge-${test.orphanCategory?.type === 'technical' ? 'info' : 'warning'}" style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600; background: ${test.orphanCategory?.type === 'technical' ? '#d1ecf1' : '#fff3cd'}; color: ${test.orphanCategory?.type === 'technical' ? '#0c5460' : '#856404'};">
              ${(test.orphanCategory?.type || 'unknown').toUpperCase()}
            </span>
          </td>
          <td style="padding: 15px; vertical-align: top;">
            <span class="badge badge-${(test.orphanCategory?.priority || 'p3').toLowerCase()}" style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600; ${test.orphanCategory?.priority === 'P0' ? 'background: #dc2626; color: white;' : test.orphanCategory?.priority === 'P1' ? 'background: #f59e0b; color: white;' : test.orphanCategory?.priority === 'P2' ? 'background: #3b82f6; color: white;' : 'background: #6b7280; color: white;'}">
              ${test.orphanCategory?.priority || 'P3'}
            </span>
          </td>
          <td style="padding: 15px; font-size: 0.9em; vertical-align: top;">
            ${test.orphanCategory?.actionRequired === 'qa_add_scenario' 
              ? `<span style="color: #dc3545; font-weight: 600;">Required</span><br><span style="color: #666;">Add to baseline</span>`
              : '<span style="color: #10b981;">✓ No action needed</span>'}
          </td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}
    
    ${orphanTests.businessTests.filter((t: any) => t.orphanCategory?.priority === 'P0').length > 0 ? `
    <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 25px; border-radius: 10px; margin-top: 30px; box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
        <span style="font-size: 1.8em;">🚨</span>
        <h3 style="margin: 0; font-size: 1.3em;">Critical P0 Orphan Tests - Immediate Action Required</h3>
      </div>
      <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; margin-bottom: 15px;">
        <p style="margin: 0 0 15px 0; font-size: 1.05em; line-height: 1.7;">
          <strong>${orphanTests.businessTests.filter((t: any) => t.orphanCategory?.priority === 'P0').length} critical test(s)</strong> cover essential business logic but lack baseline scenarios. 
          This creates a <strong>traceability gap</strong> where core functionality is tested but not documented.
        </p>
      </div>
    </div>
    ` : ''}
  </div>
</div>`;
  }

  private generateJSON(analysis: CoverageAnalysis, gitChanges: GitChangeAnalysis): string {
    return JSON.stringify({
      service: analysis.service,
      timestamp: analysis.timestamp,
      summary: analysis.summary,
      coverage: {
        percent: analysis.coveragePercent,
        scenarios: {
          total: analysis.baselineScenarios,
          covered: analysis.summary.fullyCovered,
          partial: analysis.summary.partiallyCovered,
          missing: analysis.summary.notCovered
        }
      },
      gaps: {
        total: analysis.gaps.length,
        byPriority: {
          p0: analysis.summary.p0Gaps,
          p1: analysis.summary.p1Gaps,
          p2: analysis.summary.p2Gaps
        },
        details: analysis.gaps
      },
      orphanTests: {
        total: analysis.orphanTests.totalOrphans,
        technical: analysis.orphanTests.technicalTests.length,
        business: analysis.orphanTests.businessTests.length,
        categorization: analysis.orphanTests.categorization
      },
      gitChanges: {
        summary: gitChanges.summary,
        changes: gitChanges.apiChanges,
        affectedServices: gitChanges.affectedServices
      },
      apis: analysis.apis
    }, null, 2);
  }

  private generateCSV(analysis: CoverageAnalysis): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Type,API,Scenario,Status,Priority,Tests Count,Reason,Recommendation');
    
    // API coverage data
    for (const api of analysis.apis) {
      for (const match of api.matchedTests) {
        lines.push([
          'Coverage',
          api.api,
          this.escapeCSV(match.scenario),
          match.status,
          '',
          match.tests.length.toString(),
          '',
          ''
        ].join(','));
      }
    }
    
    // Gaps
    for (const gap of analysis.gaps) {
      lines.push([
        'Gap',
        gap.api,
        this.escapeCSV(gap.scenario),
        'NOT_COVERED',
        gap.priority,
        '0',
        this.escapeCSV(gap.reason),
        this.escapeCSV(gap.recommendations[0] || '')
      ].join(','));
    }
    
    return lines.join('\n');
  }

  private generateMarkdown(analysis: CoverageAnalysis, gitChanges: GitChangeAnalysis, serviceName: string): string {
    const { summary, apis, orphanTests, gaps } = analysis;
    
    let md = `# Coverage Report: ${serviceName}\n\n`;
    md += `**Generated:** ${analysis.timestamp.toLocaleString()}\n\n`;
    
    md += `## 📊 Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| **Coverage** | ${summary.coveragePercent.toFixed(1)}% |\n`;
    md += `| **Scenarios** | ${summary.fullyCovered}/${summary.totalScenarios} covered |\n`;
    md += `| **P0 Gaps** | ${summary.p0Gaps} |\n`;
    md += `| **P1 Gaps** | ${summary.p1Gaps} |\n`;
    md += `| **P2 Gaps** | ${summary.p2Gaps} |\n`;
    md += `| **Orphan Tests** | ${orphanTests.totalOrphans} (${orphanTests.businessTests.length} need scenarios) |\n\n`;
    
    if (gitChanges.summary.apisAdded > 0 || gitChanges.summary.apisModified > 0) {
      md += `## 🔄 Git Changes\n\n`;
      md += `- ✅ **Added:** ${gitChanges.summary.apisAdded} APIs\n`;
      md += `- 🔄 **Modified:** ${gitChanges.summary.apisModified} APIs\n`;
      md += `- ❌ **Removed:** ${gitChanges.summary.apisRemoved} APIs\n`;
      if (gitChanges.summary.apisWithoutTests > 0) {
        md += `- ⚠️ **Without Tests:** ${gitChanges.summary.apisWithoutTests} APIs\n`;
      }
      md += `\n`;
    }
    
    md += `## 🎯 API Coverage\n\n`;
    for (const api of apis) {
      md += `### ${api.api}\n\n`;
      md += `- ✅ Covered: ${api.coveredScenarios}\n`;
      md += `- ⚠️ Partial: ${api.partiallyCoveredScenarios}\n`;
      md += `- ❌ Missing: ${api.uncoveredScenarios}\n\n`;
    }
    
    if (gaps.length > 0) {
      md += `## ⚠️ Coverage Gaps (${gaps.length})\n\n`;
      md += `| Priority | API | Scenario | Reason |\n`;
      md += `|----------|-----|----------|--------|\n`;
      for (const gap of gaps.slice(0, 20)) {
        md += `| ${gap.priority} | \`${gap.api}\` | ${this.escapeMarkdown(gap.scenario)} | ${this.escapeMarkdown(gap.reason)} |\n`;
      }
      if (gaps.length > 20) {
        md += `\n*... and ${gaps.length - 20} more gaps*\n`;
      }
      md += `\n`;
    }
    
    if (orphanTests.totalOrphans > 0) {
      md += `## 🔍 Orphan Tests\n\n`;
      md += `- **Technical Tests:** ${orphanTests.technicalTests.length} (no action needed)\n`;
      md += `- **Business Tests:** ${orphanTests.businessTests.length} (need scenarios)\n\n`;
    }
    
    md += `---\n\n`;
    md += `*Generated by AI-Driven Coverage System*\n`;
    
    return md;
  }

  private escapeCSV(text: string): string {
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[|\\]/g, '\\$&');
  }

  private openInBrowser(filePath: string): void {
    const { exec } = require('child_process');
    const platform = process.platform;
    
    let command: string;
    if (platform === 'darwin') {
      command = `open "${filePath}"`;
    } else if (platform === 'win32') {
      command = `start "" "${filePath}"`;
    } else {
      command = `xdg-open "${filePath}"`;
    }
    
    exec(command, (error: any) => {
      if (error) {
        console.log(`  ⚠️ Could not auto-open browser: ${error.message}`);
      }
    });
  }
}
