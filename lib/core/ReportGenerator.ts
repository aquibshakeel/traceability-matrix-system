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
    const { summary, apis, orphanTests, orphanAPIs, gaps, visualAnalytics } = analysis;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coverage Report - ${serviceName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
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
        .header .timestamp { opacity: 0.9; font-size: 0.9em; }
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }
        .card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        .card:hover { transform: translateY(-5px); box-shadow: 0 5px 20px rgba(0,0,0,0.15); }
        .card-title { font-size: 0.85em; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .card-value { font-size: 2.5em; font-weight: bold; color: #333; }
        .card-footer { font-size: 0.9em; color: #888; margin-top: 10px; }
        .progress-bar {
            width: 100%;
            height: 10px;
            background: #e0e0e0;
            border-radius: 5px;
            overflow: hidden;
            margin-top: 15px;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.5s ease;
        }
        .section {
            padding: 40px;
            border-bottom: 1px solid #eee;
        }
        .section:last-child { border-bottom: none; }
        .section-title {
            font-size: 1.8em;
            margin-bottom: 25px;
            color: #333;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .icon { font-size: 1.2em; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border-radius: 8px;
            overflow: hidden;
        }
        thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        th, td {
            padding: 15px;
            text-align: left;
        }
        tbody tr:hover { background: #f8f9fa; }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 600;
        }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        .badge-p0 { background: #dc3545; color: white; }
        .badge-p1 { background: #fd7e14; color: white; }
        .badge-p2 { background: #ffc107; color: #333; }
        .badge-p3 { background: #6c757d; color: white; }
        .status-covered { color: #28a745; font-weight: bold; }
        .status-partial { color: #ffc107; font-weight: bold; }
        .status-missing { color: #dc3545; font-weight: bold; }
        .orphan-section {
            background: #fff8dc;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
        .git-changes {
            background: #e7f3ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
        .api-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #667eea;
        }
        .api-box h4 { color: #667eea; margin-bottom: 15px; }
        .scenario-item {
            padding: 10px;
            margin: 5px 0;
            background: white;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .footer {
            background: #f8f9fa;
            padding: 30px 40px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Coverage Report</h1>
            <div class="timestamp">Service: <strong>${serviceName}</strong> | Generated: ${analysis.timestamp.toLocaleString()}</div>
        </div>

        <div class="summary-cards">
            <div class="card">
                <div class="card-title">Coverage</div>
                <div class="card-value">${summary.coveragePercent.toFixed(1)}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${summary.coveragePercent}%"></div>
                </div>
                <div class="card-footer">${summary.fullyCovered}/${summary.totalScenarios} scenarios covered</div>
            </div>
            <div class="card">
                <div class="card-title">Critical Gaps</div>
                <div class="card-value" style="color: ${summary.p0Gaps > 0 ? '#dc3545' : '#28a745'}">${summary.p0Gaps}</div>
                <div class="card-footer">P0 scenarios without tests</div>
            </div>
            <div class="card">
                <div class="card-title">High Priority Gaps</div>
                <div class="card-value" style="color: ${summary.p1Gaps > 0 ? '#fd7e14' : '#28a745'}">${summary.p1Gaps}</div>
                <div class="card-footer">P1 scenarios need attention</div>
            </div>
            <div class="card">
                <div class="card-title">Orphan Tests</div>
                <div class="card-value" style="color: ${orphanTests.businessTests.length > 0 ? '#ffc107' : '#28a745'}">${orphanTests.totalOrphans}</div>
                <div class="card-footer">${orphanTests.businessTests.length} need scenarios</div>
            </div>
        </div>

        ${gitChanges.summary.apisAdded > 0 || gitChanges.summary.apisModified > 0 || gitChanges.summary.apisRemoved > 0 ? `
        <div class="section">
            <h2 class="section-title"><span class="icon">🔄</span> Git Changes Detected</h2>
            <div class="git-changes">
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
        ` : ''}

        <div class="section">
            <h2 class="section-title"><span class="icon">🎯</span> API Coverage Analysis</h2>
            ${apis.map(api => `
            <div class="api-box">
                <h4>${api.api}</h4>
                <div style="margin-bottom: 15px;">
                    <span class="badge badge-success">${api.coveredScenarios} Covered</span>
                    <span class="badge badge-warning">${api.partiallyCoveredScenarios} Partial</span>
                    <span class="badge badge-danger">${api.uncoveredScenarios} Missing</span>
                </div>
                ${api.matchedTests.slice(0, 10).map(match => `
                <div class="scenario-item">
                    <span>${match.scenario}</span>
                    <span class="status-${match.status === 'FULLY_COVERED' ? 'covered' : match.status === 'PARTIALLY_COVERED' ? 'partial' : 'missing'}">
                        ${match.status.replace('_', ' ')} (${match.tests.length} test${match.tests.length !== 1 ? 's' : ''})
                    </span>
                </div>
                `).join('')}
                ${api.matchedTests.length > 10 ? `<div style="text-align: center; padding: 10px; color: #666;">... and ${api.matchedTests.length - 10} more scenarios</div>` : ''}
            </div>
            `).join('')}
        </div>

        ${gaps.length > 0 ? `
        <div class="section">
            <h2 class="section-title"><span class="icon">⚠️</span> Coverage Gaps (${gaps.length})</h2>
            <table>
                <thead>
                    <tr>
                        <th>Priority</th>
                        <th>API</th>
                        <th>Scenario</th>
                        <th>Reason</th>
                        <th>Recommendation</th>
                    </tr>
                </thead>
                <tbody>
                    ${gaps.slice(0, 50).map(gap => `
                    <tr>
                        <td><span class="badge badge-${gap.priority.toLowerCase()}">${gap.priority}</span></td>
                        <td><code>${gap.api}</code></td>
                        <td>${gap.scenario}</td>
                        <td>${gap.reason}</td>
                        <td>${gap.recommendations[0] || 'Review and fix'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ${gaps.length > 50 ? `<div style="text-align: center; padding: 20px; color: #666;">Showing 50 of ${gaps.length} gaps</div>` : ''}
        </div>
        ` : ''}

        ${orphanAPIs && orphanAPIs.length > 0 ? `
        <div class="section">
            <h2 class="section-title"><span class="icon">⚠️</span> Orphan APIs (${orphanAPIs.length})</h2>
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                <strong>⚠️ Critical: These APIs were discovered but have NO scenarios or tests.</strong> They are completely untracked and represent gaps in test coverage.
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
            <div style="background: #e7f3ff; padding: 15px; border-radius: 4px; margin-top: 20px;">
                <strong>📋 Recommended Actions:</strong>
                <ul style="margin: 10px 0 0 20px;">
                    <li>Create scenarios to document expected behavior for each API</li>
                    <li>Add unit tests to verify API functionality</li>
                    <li>If APIs are deprecated, remove them from code</li>
                    <li>Ensure all new APIs are created with tests</li>
                </ul>
            </div>
        </div>
        ` : ''}

        ${orphanTests.totalOrphans > 0 ? `
        <div class="section">
            <h2 class="section-title"><span class="icon">🔍</span> Orphan Tests (${orphanTests.totalOrphans})</h2>
            <div style="background: #fff8dc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                Tests without corresponding business scenarios. <strong>${orphanTests.businessTests.length}</strong> require QA action, <strong>${orphanTests.technicalTests.length}</strong> are infrastructure tests.
            </div>
            <div class="orphan-section">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <strong>Technical Tests:</strong> ${orphanTests.technicalTests.length}<br>
                        <small style="color: #666;">No action needed - infrastructure/utility tests</small>
                    </div>
                    <div>
                        <strong>Business Tests:</strong> ${orphanTests.businessTests.length}<br>
                        <small style="color: #dc3545;">Action required - need business scenarios</small>
                    </div>
                </div>
                
                ${orphanTests.categorization.length > 0 ? `
                <h4 style="margin-top: 20px; margin-bottom: 15px;">Categorization</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Subtype</th>
                            <th>Count</th>
                            <th>Priority</th>
                            <th>Action Required</th>
                            <th>Suggested Fix</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orphanTests.categorization.map(cat => `
                        <tr>
                            <td><span class="badge badge-${cat.category === 'technical' ? 'info' : 'warning'}">${cat.category.toUpperCase()}</span></td>
                            <td>${cat.subtype}</td>
                            <td>${cat.count}</td>
                            <td><span class="badge badge-${cat.priority.toLowerCase()}">${cat.priority}</span></td>
                            <td>${cat.actionRequired ? '✅ Yes' : '❌ No'}</td>
                            <td>${cat.actionRequired ? `QA Action: Create scenario for ${cat.category} tests` : 'No action needed'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                ${orphanTests.businessTests.length > 0 ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin-top: 20px; border-left: 4px solid #ffc107;">
                    <strong>⚠️ Priority Action:</strong> ${orphanTests.businessTests.length} business test(s) need scenarios to be added to baseline for traceability.
                </div>
                ` : ''}
                ` : ''}
            </div>
        </div>
        ` : ''}

        ${visualAnalytics ? `
        <div class="section">
            <h2 class="section-title"><span class="icon">📊</span> Visual Analytics</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h4 style="margin-bottom: 15px;">Coverage Distribution</h4>
                    <div style="margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>✅ Fully Covered:</span>
                            <strong>${visualAnalytics.coverageDistribution.fullyCovered}</strong>
                        </div>
                        <div style="width: 100%; background: #e0e0e0; height: 8px; border-radius: 4px;">
                            <div style="width: ${visualAnalytics.coverageDistribution.fullyCovered > 0 ? (visualAnalytics.coverageDistribution.fullyCovered / (visualAnalytics.coverageDistribution.fullyCovered + visualAnalytics.coverageDistribution.partiallyCovered + visualAnalytics.coverageDistribution.notCovered)) * 100 : 0}%; background: #28a745; height: 100%; border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>⚠️ Partially Covered:</span>
                            <strong>${visualAnalytics.coverageDistribution.partiallyCovered}</strong>
                        </div>
                        <div style="width: 100%; background: #e0e0e0; height: 8px; border-radius: 4px;">
                            <div style="width: ${visualAnalytics.coverageDistribution.partiallyCovered > 0 ? (visualAnalytics.coverageDistribution.partiallyCovered / (visualAnalytics.coverageDistribution.fullyCovered + visualAnalytics.coverageDistribution.partiallyCovered + visualAnalytics.coverageDistribution.notCovered)) * 100 : 0}%; background: #ffc107; height: 100%; border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>❌ Not Covered:</span>
                            <strong>${visualAnalytics.coverageDistribution.notCovered}</strong>
                        </div>
                        <div style="width: 100%; background: #e0e0e0; height: 8px; border-radius: 4px;">
                            <div style="width: ${visualAnalytics.coverageDistribution.notCovered > 0 ? (visualAnalytics.coverageDistribution.notCovered / (visualAnalytics.coverageDistribution.fullyCovered + visualAnalytics.coverageDistribution.partiallyCovered + visualAnalytics.coverageDistribution.notCovered)) * 100 : 0}%; background: #dc3545; height: 100%; border-radius: 4px;"></div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h4 style="margin-bottom: 15px;">Gap Priority Breakdown</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 4px;">
                            <div style="font-size: 2em; color: #dc3545;">${visualAnalytics.gapPriorityBreakdown.p0}</div>
                            <div style="color: #666;">P0 - Critical</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 4px;">
                            <div style="font-size: 2em; color: #fd7e14;">${visualAnalytics.gapPriorityBreakdown.p1}</div>
                            <div style="color: #666;">P1 - High</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 4px;">
                            <div style="font-size: 2em; color: #ffc107;">${visualAnalytics.gapPriorityBreakdown.p2}</div>
                            <div style="color: #666;">P2 - Medium</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 4px;">
                            <div style="font-size: 2em; color: #6c757d;">${visualAnalytics.gapPriorityBreakdown.p3}</div>
                            <div style="color: #666;">P3 - Low</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h4 style="margin-bottom: 15px;">Orphan Test Priority Breakdown</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 4px;">
                            <div style="font-size: 2em; color: #dc3545;">${visualAnalytics.orphanTestPriorityBreakdown.p0}</div>
                            <div style="color: #666;">P0</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 4px;">
                            <div style="font-size: 2em; color: #fd7e14;">${visualAnalytics.orphanTestPriorityBreakdown.p1}</div>
                            <div style="color: #666;">P1</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 4px;">
                            <div style="font-size: 2em; color: #ffc107;">${visualAnalytics.orphanTestPriorityBreakdown.p2}</div>
                            <div style="color: #666;">P2</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 4px;">
                            <div style="font-size: 2em; color: #6c757d;">${visualAnalytics.orphanTestPriorityBreakdown.p3}</div>
                            <div style="color: #666;">P3</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            Generated by AI-Driven Coverage System | ${new Date().toLocaleDateString()}
        </div>
    </div>
</body>
</html>`;
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
