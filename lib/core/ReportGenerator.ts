/**
 * Report Generator - Multi-format report generation
 * Generates HTML, JSON, Markdown, CSV reports
 * Includes traceability matrix, gap analysis, and recommendations
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  ReportingConfig, 
  ValidationResult, 
  Report, 
  ReportFormat 
} from '../types';
import { TrendTracker } from './TrendTracker';

export class ReportGenerator {
  private config: ReportingConfig;
  private trendTracker: TrendTracker;

  constructor(config: ReportingConfig) {
    this.config = config;
    this.trendTracker = new TrendTracker(config.outputDirectory);
  }

  /**
   * Generate all configured report formats
   */
  async generate(result: ValidationResult): Promise<Report[]> {
    const reports: Report[] = [];
    
    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDirectory)) {
      fs.mkdirSync(this.config.outputDirectory, { recursive: true });
    }

    // Save snapshot for trend tracking
    try {
      this.trendTracker.saveSnapshot(result);
    } catch (error) {
      console.warn('Failed to save trend snapshot:', error);
    }

    for (const format of this.config.formats) {
      try {
        const report = await this.generateReport(format, result);
        reports.push(report);
        console.log(`\n✓ Generated ${format.toUpperCase()} report: ${report.filePath}`);
      } catch (error) {
        console.error(`✗ Failed to generate ${format} report:`, error);
      }
    }

    return reports;
  }

  /**
   * Generate report in specific format
   */
  private async generateReport(format: ReportFormat, result: ValidationResult): Promise<Report> {
    switch (format) {
      case 'html':
        return this.generateHTMLReport(result);
      case 'json':
        return this.generateJSONReport(result);
      case 'markdown':
        return this.generateMarkdownReport(result);
      case 'csv':
        return this.generateCSVReport(result);
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  /**
   * Generate enhanced HTML report with Chart.js, interactivity, and modern UI
   */
  private async generateHTMLReport(result: ValidationResult): Promise<Report> {
    // Get trend data
    const trendData = this.trendTracker.getTrendData();
    
    // Load template
    const templatePath = path.join(__dirname, '../templates/enhanced-report.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    // Calculate trend indicators
    let coverageTrendIcon = '—';
    let coverageTrendText = 'No change';
    let coverageTrendClass = '';
    let p0TrendIcon = '—';
    let p0TrendText = 'No change';
    let p0TrendClass = '';

    if (trendData && trendData.trends) {
      if (trendData.trends.coverageChange > 0) {
        coverageTrendIcon = '↑';
        coverageTrendText = `+${trendData.trends.coverageChange.toFixed(1)}%`;
        coverageTrendClass = 'up';
      } else if (trendData.trends.coverageChange < 0) {
        coverageTrendIcon = '↓';
        coverageTrendText = `${trendData.trends.coverageChange.toFixed(1)}%`;
        coverageTrendClass = 'down';
      }

      if (trendData.trends.p0GapChange < 0) {
        p0TrendIcon = '↓';
        p0TrendText = `${Math.abs(trendData.trends.p0GapChange)} fewer`;
        p0TrendClass = 'up';
      } else if (trendData.trends.p0GapChange > 0) {
        p0TrendIcon = '↑';
        p0TrendText = `+${trendData.trends.p0GapChange} more`;
        p0TrendClass = 'down';
      }
    }

    // Replace basic placeholders
    html = html
      .replace(/\{\{TIMESTAMP\}\}/g, new Date(result.timestamp).toLocaleString())
      .replace(/\{\{DURATION\}\}/g, result.duration.toString())
      .replace(/\{\{STATUS_CLASS\}\}/g, result.success ? 'success' : 'failure')
      .replace(/\{\{STATUS_TEXT\}\}/g, result.success ? '✓ PASSED' : '✗ FAILED')
      .replace(/\{\{COVERAGE_PERCENT\}\}/g, result.summary.coveragePercent.toString())
      .replace(/\{\{FULLY_COVERED\}\}/g, result.summary.fullyCovered.toString())
      .replace(/\{\{TOTAL_SCENARIOS\}\}/g, result.summary.totalScenarios.toString())
      .replace(/\{\{PARTIALLY_COVERED\}\}/g, result.summary.partiallyCovered.toString())
      .replace(/\{\{NOT_COVERED\}\}/g, result.summary.notCovered.toString())
      .replace(/\{\{SERVICES_ANALYZED\}\}/g, result.summary.servicesAnalyzed.toString())
      .replace(/\{\{TOTAL_TESTS\}\}/g, result.summary.totalTests.toString())
      .replace(/\{\{ORPHAN_TESTS\}\}/g, result.summary.orphanTests.toString())
      .replace(/\{\{P0_GAPS\}\}/g, result.summary.p0Gaps.toString())
      .replace(/\{\{COVERAGE_TREND_ICON\}\}/g, coverageTrendIcon)
      .replace(/\{\{COVERAGE_TREND_TEXT\}\}/g, coverageTrendText)
      .replace(/\{\{COVERAGE_TREND_CLASS\}\}/g, coverageTrendClass)
      .replace(/\{\{P0_TREND_ICON\}\}/g, p0TrendIcon)
      .replace(/\{\{P0_TREND_TEXT\}\}/g, p0TrendText)
      .replace(/\{\{P0_TREND_CLASS\}\}/g, p0TrendClass)
      .replace(/\{\{GENERATION_DATE\}\}/g, new Date().toLocaleString());

    // Generate gaps section
    const gapsSection = result.gaps.length > 0 ? `
<div class="section">
    <h2>
        🚨 Coverage Gaps (${result.gaps.length})
        <span class="section-toggle" onclick="toggleSection('gaps')">▼</span>
    </h2>
    <div class="section-content" id="gaps-content">
        <div class="gap-list">
            ${result.gaps.map(gap => {
              const statusMap: Record<string, string> = {
                'Fully Covered': 'covered',
                'Partially Covered': 'partial',
                'Not Covered': 'not-covered'
              };
              const status = statusMap['Not Covered'] || 'not-covered';
              
              return `
            <div class="gap-item ${gap.severity.toLowerCase()}" 
                 data-status="${status}" 
                 data-priority="${gap.severity.toLowerCase()}">
                <div class="gap-header">
                    <span class="gap-id">${gap.scenario.id}</span>
                    <span class="priority-badge priority-${gap.severity.toLowerCase()}">${gap.severity}</span>
                </div>
                <div class="gap-description"><strong>Description:</strong> ${gap.scenario.description}</div>
                <div class="gap-description"><strong>API:</strong> ${gap.scenario.apiEndpoint || 'N/A'}</div>
                <div class="gap-description"><strong>Risk Level:</strong> ${gap.scenario.riskLevel}</div>
                <div class="gap-description"><strong>Impact:</strong> ${gap.impact}</div>
                <div class="gap-description"><strong>Action Required:</strong> ${gap.actionRequired}</div>
                ${gap.recommendations.length > 0 ? `
                <div class="gap-recommendations">
                    <h4>💡 Recommendations:</h4>
                    <ul>
                        ${gap.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            `;
            }).join('')}
        </div>
    </div>
</div>
    ` : '';

    // Generate orphan APIs section
    const orphanAPIsSection = result.orphanAPIs && result.orphanAPIs.length > 0 ? `
<div class="section">
    <h2>
        🚨 Orphan APIs (${result.orphanAPIs.length})
        <span class="section-toggle" onclick="toggleSection('orphan-apis')">▼</span>
    </h2>
    <div class="section-content" id="orphan-apis-content">
        <p style="margin-bottom: 15px; color: var(--text-secondary); background: rgba(239, 68, 68, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
            <strong>⚠️ Critical:</strong> These APIs were discovered in controller files but have NO scenarios or tests. 
            They are completely untracked and represent gaps in test coverage.
        </p>
        <table style="table-layout: fixed;">
            <thead>
                <tr>
                    <th style="width: 12%; text-align: left;">Method</th>
                    <th style="width: 35%; text-align: left;">Endpoint</th>
                    <th style="width: 25%; text-align: left;">Controller</th>
                    <th style="width: 8%; text-align: center;">Line</th>
                    <th style="width: 10%; text-align: center;">Scenario</th>
                    <th style="width: 10%; text-align: center;">Test</th>
                </tr>
            </thead>
            <tbody>
                ${result.orphanAPIs.map(api => `
                <tr style="background: rgba(239, 68, 68, 0.05);">
                    <td style="vertical-align: middle;">
                        <span style="padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.85em; display: inline-block; white-space: nowrap;
                                     ${api.method === 'POST' ? 'background: #10b981; color: white;' : 
                                       api.method === 'GET' ? 'background: #3b82f6; color: white;' :
                                       api.method === 'PUT' ? 'background: #f59e0b; color: white;' :
                                       api.method === 'DELETE' ? 'background: #ef4444; color: white;' :
                                       'background: #6b7280; color: white;'}">
                            ${api.method}
                        </span>
                    </td>
                    <td style="vertical-align: middle; word-break: break-all;"><code style="font-size: 0.9em;">${api.endpoint}</code></td>
                    <td style="vertical-align: middle; word-break: break-word; font-size: 0.9em;">${api.controller}</td>
                    <td style="text-align: center; vertical-align: middle;">${api.lineNumber}</td>
                    <td style="text-align: center; vertical-align: middle;">
                        <span style="font-size: 1.2em;">${api.hasScenario ? '✅' : '❌'}</span>
                    </td>
                    <td style="text-align: center; vertical-align: middle;">
                        <span style="font-size: 1.2em;">${api.hasTest ? '✅' : '❌'}</span>
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        <div style="margin-top: 20px; padding: 15px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h4 style="margin-bottom: 10px; color: var(--text-primary);">💡 Recommended Actions:</h4>
            <ul style="margin-left: 20px; color: var(--text-secondary);">
                <li>Create scenarios to document expected behavior for each API</li>
                <li>Add unit tests to verify API functionality</li>
                <li>If APIs are deprecated, remove them from code</li>
                <li>Ensure all new APIs are created with tests</li>
            </ul>
        </div>
    </div>
</div>
    ` : '';

    // Generate orphan tests section
    const orphanTestsSection = result.orphanTests.length > 0 ? `
<div class="section">
    <h2>
        🔍 Orphan Tests (${result.orphanTests.length})
        <span class="section-toggle" onclick="toggleSection('orphans')">▼</span>
    </h2>
    <div class="section-content" id="orphans-content">
        <p style="margin-bottom: 15px; color: var(--text-secondary);">
            Tests without corresponding business scenarios. 
            <strong>${result.orphanAnalysis.businessCount}</strong> require QA action, 
            <strong>${result.orphanAnalysis.technicalCount}</strong> are infrastructure tests.
        </p>
        <table>
            <thead>
                <tr>
                    <th style="width: 20%;">Test ID</th>
                    <th style="width: 20%;">Description</th>
                    <th style="width: 12%;">File</th>
                    <th style="width: 10%;">Service</th>
                    <th style="width: 10%;">Category</th>
                    <th style="width: 8%;">Priority</th>
                    <th style="width: 20%;">Suggested Fix</th>
                </tr>
            </thead>
            <tbody>
                ${[...result.orphanTests]
                  .sort((a, b) => {
                    // Business tests first
                    const aIsBusiness = result.orphanAnalysis.businessTests.some(t => t.id === a.id);
                    const bIsBusiness = result.orphanAnalysis.businessTests.some(t => t.id === b.id);
                    if (aIsBusiness !== bIsBusiness) return aIsBusiness ? -1 : 1;
                    
                    // Then sort by priority within category
                    const aPriority = a.orphanCategory?.priority || 'P3';
                    const bPriority = b.orphanCategory?.priority || 'P3';
                    return aPriority.localeCompare(bPriority);
                  })
                  .slice(0, 50).map(test => {
                  const isTechnical = result.orphanAnalysis.technicalTests.some(t => t.id === test.id);
                  const priority = test.orphanCategory?.priority || 'P3';
                  const priorityColors: Record<string, string> = {
                    'P0': 'background: #dc2626; color: white;',
                    'P1': 'background: #f59e0b; color: white;',
                    'P2': 'background: #3b82f6; color: white;',
                    'P3': 'background: #6b7280; color: white;'
                  };
                  
                  // Generate suggested fix
                  let suggestedFix = 'No action needed';
                  if (!isTechnical) {
                    if (test.orphanCategory?.actionRequired === 'qa_add_scenario') {
                      suggestedFix = `<strong>QA Action:</strong> Create scenario for this ${test.orphanCategory.subtype} test`;
                      if (test.orphanCategory.suggestedScenarioId) {
                        suggestedFix += `<br><small>Suggested ID: ${test.orphanCategory.suggestedScenarioId}</small>`;
                      }
                    } else if (test.orphanCategory?.actionRequired === 'review') {
                      suggestedFix = `<strong>Review:</strong> Verify if scenario exists or test is technical`;
                    }
                  }
                  
                  return `
                <tr data-priority="${priority.toLowerCase()}" data-category="${isTechnical ? 'technical' : 'business'}">
                    <td><code style="word-break: break-word; font-size: 0.85em;">${test.id}</code></td>
                    <td style="font-size: 0.9em;">${test.description}</td>
                    <td style="font-size: 0.85em;">${test.file}</td>
                    <td style="font-size: 0.85em;">${test.service}</td>
                    <td>
                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.85em; white-space: nowrap; ${isTechnical ? 'background: rgba(107, 114, 128, 0.1); color: #6b7280;' : 'background: rgba(239, 68, 68, 0.1); color: #ef4444;'}">
                            ${isTechnical ? '🔧 Technical' : '💼 Business'}
                        </span>
                    </td>
                    <td>
                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.85em; white-space: nowrap; font-weight: bold; ${priorityColors[priority]}">
                            ${priority}
                        </span>
                    </td>
                    <td style="font-size: 0.85em; color: ${isTechnical ? '#6b7280' : '#ef4444'};">
                        ${suggestedFix}
                    </td>
                </tr>
                `;
                }).join('')}
            </tbody>
        </table>
        ${result.orphanTests.length > 50 ? `<p style="margin-top: 15px;"><em>Showing first 50 of ${result.orphanTests.length} orphan tests</em></p>` : ''}
    </div>
</div>
    ` : '';

    // Generate recommendations section
    const recommendationsSection = result.recommendations.length > 0 ? `
<div class="section">
    <h2>
        💡 Recommendations
        <span class="section-toggle" onclick="toggleSection('recommendations')">▼</span>
    </h2>
    <div class="section-content" id="recommendations-content">
        ${result.recommendations.map(rec => `
        <div style="background: #eff6ff; padding: 15px; margin: 10px 0; border-left: 4px solid #3b82f6; border-radius: 5px;">
            <strong style="color: var(--text-primary);">${rec.title}</strong><br>
            <p style="color: var(--text-secondary); margin: 10px 0;">${rec.description}</p>
            <small style="color: var(--text-secondary);">
                <strong>Priority:</strong> ${rec.priority} | 
                <strong>Effort:</strong> ${rec.effort} | 
                <strong>Assigned to:</strong> ${rec.assignedTo}
            </small>
        </div>
        `).join('')}
    </div>
</div>
    ` : '';

    // Generate errors section
    const errorsSection = result.errors.length > 0 ? `
<div class="section">
    <h2>
        ❌ Errors
        <span class="section-toggle" onclick="toggleSection('errors')">▼</span>
    </h2>
    <div class="section-content" id="errors-content">
        ${result.errors.map(error => `
        <div style="background: #fef2f2; padding: 15px; margin: 10px 0; border-left: 4px solid #ef4444; border-radius: 5px;">
            <strong style="color: var(--danger);">${error.type}:</strong> 
            <span style="color: var(--text-secondary);">${error.message}</span><br>
            ${error.service ? `<small style="color: var(--text-secondary);">Service: ${error.service}</small>` : ''}
        </div>
        `).join('')}
    </div>
</div>
    ` : '';

    // Replace section placeholders
    html = html
      .replace(/\{\{GAPS_SECTION\}\}/g, gapsSection)
      .replace(/\{\{ORPHAN_APIS_SECTION\}\}/g, orphanAPIsSection)
      .replace(/\{\{ORPHAN_TESTS_SECTION\}\}/g, orphanTestsSection)
      .replace(/\{\{RECOMMENDATIONS_SECTION\}\}/g, recommendationsSection)
      .replace(/\{\{ERRORS_SECTION\}\}/g, errorsSection);

    // Inject data for JavaScript
    const reportDataJson = JSON.stringify(result, null, 2);
    const trendDataJson = trendData ? JSON.stringify(trendData, null, 2) : 'null';

    html = html
      .replace(/\{\{REPORT_DATA_JSON\}\}/g, reportDataJson)
      .replace(/\{\{TREND_DATA_JSON\}\}/g, trendDataJson);

    const filePath = path.join(this.config.outputDirectory, 'traceability-report.html');
    fs.writeFileSync(filePath, html, 'utf-8');

    return {
      format: 'html',
      filePath,
      content: html,
      generatedAt: new Date(),
      metadata: {
        title: 'Unit Test Traceability Report - Enhanced',
        project: 'Universal Validator',
        version: '2.0.0',
        author: 'System',
        generatedBy: 'UniversalValidator'
      }
    };
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(result: ValidationResult): Promise<Report> {
    const json = JSON.stringify(result, null, 2);
    const filePath = path.join(this.config.outputDirectory, 'traceability-report.json');
    fs.writeFileSync(filePath, json, 'utf-8');

    return {
      format: 'json',
      filePath,
      content: json,
      generatedAt: new Date(),
      metadata: {
        title: 'Unit Test Traceability Report (JSON)',
        project: 'Universal Validator',
        version: '1.0.0',
        author: 'System',
        generatedBy: 'UniversalValidator'
      }
    };
  }

  /**
   * Generate Markdown report
   */
  private async generateMarkdownReport(result: ValidationResult): Promise<Report> {
    const md = `# Unit Test Traceability Report

**Generated:** ${new Date(result.timestamp).toLocaleString()}  
**Duration:** ${result.duration}ms  
**Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}

---

## 📊 Summary

| Metric | Value |
|--------|-------|
| **Total Scenarios** | ${result.summary.totalScenarios} |
| **Fully Covered** | ${result.summary.fullyCovered} (${result.summary.coveragePercent}%) |
| **Partially Covered** | ${result.summary.partiallyCovered} |
| **Not Covered** | ${result.summary.notCovered} |
| **Total Tests** | ${result.summary.totalTests} |
| **Orphan Tests** | ${result.summary.orphanTests} |
| **Coverage Gaps** | ${result.gaps.length} |
| **P0 Gaps** | ${result.summary.p0Gaps} |
| **P1 Gaps** | ${result.summary.p1Gaps} |
| **Services Analyzed** | ${result.summary.servicesAnalyzed} |

---

## 🚨 Coverage Gaps

${result.gaps.length === 0 ? '*No gaps found - All scenarios are covered!*' : result.gaps.map(gap => `
### ${gap.scenario.id} - **${gap.severity}**

**Description:** ${gap.scenario.description}  
**API:** ${gap.scenario.apiEndpoint || 'N/A'}  
**Risk Level:** ${gap.scenario.riskLevel}  
**Action Required:** ${gap.actionRequired}

**Impact:** ${gap.impact}

**Recommendations:**
${gap.recommendations.map(rec => `- ${rec}`).join('\n')}

---
`).join('\n')}

${result.orphanTests.length > 0 ? `
## 🔍 Orphan Tests (${result.orphanTests.length})

Tests without corresponding business scenarios:

${result.orphanTests.slice(0, 20).map(test => `- **${test.id}**: ${test.description} (${test.file})`).join('\n')}

${result.orphanTests.length > 20 ? `\n*Showing first 20 of ${result.orphanTests.length} orphan tests*\n` : ''}
` : ''}

${result.recommendations.length > 0 ? `
## 💡 Recommendations

${result.recommendations.map(rec => `
### ${rec.title}
${rec.description}

- **Priority:** ${rec.priority}
- **Effort:** ${rec.effort}
- **Assigned to:** ${rec.assignedTo}
`).join('\n')}
` : ''}

---

*Report generated by Universal Unit-Test Traceability Validator*
`;

    const filePath = path.join(this.config.outputDirectory, 'traceability-report.md');
    fs.writeFileSync(filePath, md, 'utf-8');

    return {
      format: 'markdown',
      filePath,
      content: md,
      generatedAt: new Date(),
      metadata: {
        title: 'Unit Test Traceability Report (Markdown)',
        project: 'Universal Validator',
        version: '1.0.0',
        author: 'System',
        generatedBy: 'UniversalValidator'
      }
    };
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(result: ValidationResult): Promise<Report> {
    const csvLines: string[] = [];
    
    // Header
    csvLines.push('Scenario ID,Description,Priority,Risk Level,API Endpoint,Coverage Status,Match Score,Gap Reason,Action Required');
    
    // Data rows
    for (const mapping of result.mappings) {
      const row = [
        mapping.scenario.id,
        `"${mapping.scenario.description.replace(/"/g, '""')}"`,
        mapping.scenario.priority,
        mapping.scenario.riskLevel,
        mapping.scenario.apiEndpoint || 'N/A',
        mapping.coverageStatus,
        mapping.matchScore.toFixed(2),
        mapping.coverageStatus === 'Not Covered' ? 'No unit test found' : '',
        mapping.coverageStatus === 'Not Covered' ? 'Developer - Create Test' : ''
      ];
      csvLines.push(row.join(','));
    }
    
    const csv = csvLines.join('\n');
    const filePath = path.join(this.config.outputDirectory, 'traceability-report.csv');
    fs.writeFileSync(filePath, csv, 'utf-8');

    return {
      format: 'csv',
      filePath,
      content: csv,
      generatedAt: new Date(),
      metadata: {
        title: 'Unit Test Traceability Report (CSV)',
        project: 'Universal Validator',
        version: '1.0.0',
        author: 'System',
        generatedBy: 'UniversalValidator'
      }
    };
  }
}
