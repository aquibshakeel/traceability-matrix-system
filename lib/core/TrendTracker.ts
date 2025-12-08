/**
 * Trend Tracker - Historical report tracking and analysis
 * Stores report snapshots over time and provides trend analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult } from '../types';

interface HistoricalSnapshot {
  timestamp: string;
  coveragePercent: number;
  totalScenarios: number;
  fullyCovered: number;
  p0Gaps: number;
  p1Gaps: number;
  p2Gaps: number;
  p3Gaps: number;
  orphanTests: number;
  totalTests: number;
}

interface TrendData {
  snapshots: HistoricalSnapshot[];
  latestSnapshot: HistoricalSnapshot;
  trends: {
    coverageChange: number;
    p0GapChange: number;
    testGrowth: number;
  };
}

export class TrendTracker {
  private historyDir: string;
  private historyFile: string;
  private maxSnapshots: number;

  constructor(outputDir: string, maxSnapshots: number = 30) {
    this.historyDir = path.join(outputDir, 'history');
    this.historyFile = path.join(this.historyDir, 'snapshots.json');
    this.maxSnapshots = maxSnapshots;
    
    // Ensure history directory exists
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
  }

  /**
   * Save current validation result as a snapshot
   */
  saveSnapshot(result: ValidationResult): void {
    const snapshot: HistoricalSnapshot = {
      timestamp: new Date().toISOString(),
      coveragePercent: result.summary.coveragePercent,
      totalScenarios: result.summary.totalScenarios,
      fullyCovered: result.summary.fullyCovered,
      p0Gaps: result.summary.p0Gaps,
      p1Gaps: result.summary.p1Gaps,
      p2Gaps: result.summary.p2Gaps,
      p3Gaps: result.summary.p3Gaps,
      orphanTests: result.summary.orphanTests,
      totalTests: result.summary.totalTests
    };

    const snapshots = this.loadSnapshots();
    snapshots.push(snapshot);

    // Keep only last N snapshots
    if (snapshots.length > this.maxSnapshots) {
      snapshots.splice(0, snapshots.length - this.maxSnapshots);
    }

    fs.writeFileSync(this.historyFile, JSON.stringify(snapshots, null, 2), 'utf-8');
  }

  /**
   * Load all historical snapshots
   */
  private loadSnapshots(): HistoricalSnapshot[] {
    if (!fs.existsSync(this.historyFile)) {
      return [];
    }

    try {
      const data = fs.readFileSync(this.historyFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Get trend data for report generation
   */
  getTrendData(): TrendData | null {
    const snapshots = this.loadSnapshots();
    
    if (snapshots.length === 0) {
      return null;
    }

    const latest = snapshots[snapshots.length - 1];
    const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;

    const trends = {
      coverageChange: previous ? latest.coveragePercent - previous.coveragePercent : 0,
      p0GapChange: previous ? latest.p0Gaps - previous.p0Gaps : 0,
      testGrowth: previous ? latest.totalTests - previous.totalTests : 0
    };

    return {
      snapshots,
      latestSnapshot: latest,
      trends
    };
  }

  /**
   * Get chart data for coverage trends
   */
  getCoverageChartData(): { labels: string[]; values: number[] } {
    const snapshots = this.loadSnapshots();
    
    return {
      labels: snapshots.map(s => new Date(s.timestamp).toLocaleDateString()),
      values: snapshots.map(s => s.coveragePercent)
    };
  }

  /**
   * Get chart data for gap trends
   */
  getGapTrendChartData(): { labels: string[]; p0: number[]; p1: number[]; p2: number[]; p3: number[] } {
    const snapshots = this.loadSnapshots();
    
    return {
      labels: snapshots.map(s => new Date(s.timestamp).toLocaleDateString()),
      p0: snapshots.map(s => s.p0Gaps),
      p1: snapshots.map(s => s.p1Gaps),
      p2: snapshots.map(s => s.p2Gaps),
      p3: snapshots.map(s => s.p3Gaps)
    };
  }
}
