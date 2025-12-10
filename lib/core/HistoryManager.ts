/**
 * History Manager
 * Manages persistent storage of git changes, coverage trends, and impact analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import { APIChange } from './GitChangeDetector';

export interface GitChangeHistoryEntry {
  timestamp: string;
  commit: string;
  author?: string;
  message?: string;
  apisChanged: APIChange[];
  summary: {
    added: number;
    modified: number;
    removed: number;
  };
}

export interface CoverageTrendEntry {
  timestamp: string;
  commit?: string;
  coveragePercent: number;
  scenariosCovered: number;
  totalScenarios: number;
  p0Gaps: number;
  p1Gaps: number;
}

export interface APIRiskScore {
  api: string;
  changeCount: number;
  lastChanged: string;
  riskScore: number; // 0-1
  reasons: string[];
}

export interface HistoryData {
  service: string;
  gitChanges: GitChangeHistoryEntry[];
  coverageTrends: CoverageTrendEntry[];
  apiRiskScores: APIRiskScore[];
  lastUpdated: string;
}

export class HistoryManager {
  private projectRoot: string;
  private historyDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.historyDir = path.join(projectRoot, '.traceability', 'history');
  }

  /**
   * Initialize history directory
   */
  private ensureHistoryDir(): void {
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
  }

  /**
   * Get history file path for a service
   */
  private getHistoryFilePath(serviceName: string): string {
    return path.join(this.historyDir, `${serviceName}-history.json`);
  }

  /**
   * Load existing history or create new
   */
  loadHistory(serviceName: string): HistoryData {
    this.ensureHistoryDir();
    const filePath = this.getHistoryFilePath(serviceName);

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.warn(`⚠️  Could not parse history file, creating new: ${error}`);
      }
    }

    // Return new history structure
    return {
      service: serviceName,
      gitChanges: [],
      coverageTrends: [],
      apiRiskScores: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save history data
   */
  saveHistory(history: HistoryData): void {
    this.ensureHistoryDir();
    const filePath = this.getHistoryFilePath(history.service);
    
    history.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(
      filePath,
      JSON.stringify(history, null, 2),
      'utf-8'
    );
  }

  /**
   * Append git changes to history
   */
  appendGitChanges(
    serviceName: string,
    apiChanges: APIChange[],
    commit?: string,
    author?: string,
    message?: string
  ): void {
    const history = this.loadHistory(serviceName);

    const entry: GitChangeHistoryEntry = {
      timestamp: new Date().toISOString(),
      commit: commit || 'unknown',
      author,
      message,
      apisChanged: apiChanges,
      summary: {
        added: apiChanges.filter(c => c.type === 'added').length,
        modified: apiChanges.filter(c => c.type === 'modified').length,
        removed: apiChanges.filter(c => c.type === 'removed').length
      }
    };

    history.gitChanges.push(entry);

    // Keep only last 50 entries to prevent file from growing too large
    if (history.gitChanges.length > 50) {
      history.gitChanges = history.gitChanges.slice(-50);
    }

    this.saveHistory(history);
  }

  /**
   * Append coverage trend data
   */
  appendCoverageTrend(
    serviceName: string,
    coveragePercent: number,
    scenariosCovered: number,
    totalScenarios: number,
    p0Gaps: number,
    p1Gaps: number,
    commit?: string
  ): void {
    const history = this.loadHistory(serviceName);

    const entry: CoverageTrendEntry = {
      timestamp: new Date().toISOString(),
      commit,
      coveragePercent,
      scenariosCovered,
      totalScenarios,
      p0Gaps,
      p1Gaps
    };

    history.coverageTrends.push(entry);

    // Keep only last 100 trend entries
    if (history.coverageTrends.length > 100) {
      history.coverageTrends = history.coverageTrends.slice(-100);
    }

    this.saveHistory(history);
  }

  /**
   * Calculate and update API risk scores
   */
  updateAPIRiskScores(serviceName: string, apiChanges: APIChange[]): void {
    const history = this.loadHistory(serviceName);

    // Count changes per API
    const changeCountMap = new Map<string, { count: number; lastChanged: string }>();

    // Process current changes
    for (const change of apiChanges) {
      const apiKey = `${change.method} ${change.endpoint}`;
      const existing = changeCountMap.get(apiKey) || { count: 0, lastChanged: new Date().toISOString() };
      existing.count++;
      existing.lastChanged = new Date().toISOString();
      changeCountMap.set(apiKey, existing);
    }

    // Process historical changes (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const entry of history.gitChanges) {
      if (new Date(entry.timestamp) < thirtyDaysAgo) continue;

      for (const change of entry.apisChanged) {
        const apiKey = `${change.method} ${change.endpoint}`;
        const existing = changeCountMap.get(apiKey) || { count: 0, lastChanged: entry.timestamp };
        existing.count++;
        changeCountMap.set(apiKey, existing);
      }
    }

    // Calculate risk scores
    const riskScores: APIRiskScore[] = [];
    const maxChanges = Math.max(...Array.from(changeCountMap.values()).map(v => v.count), 1);

    for (const [api, data] of changeCountMap.entries()) {
      const reasons: string[] = [];
      let riskScore = 0;

      // Factor 1: Change frequency (0-0.5)
      const frequencyScore = (data.count / maxChanges) * 0.5;
      riskScore += frequencyScore;
      if (data.count > 3) {
        reasons.push(`Changed ${data.count} times in 30 days`);
      }

      // Factor 2: Recency (0-0.3)
      const daysSinceChange = (Date.now() - new Date(data.lastChanged).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = daysSinceChange < 7 ? 0.3 : daysSinceChange < 14 ? 0.15 : 0;
      riskScore += recencyScore;
      if (recencyScore > 0) {
        reasons.push(`Recently changed (${Math.round(daysSinceChange)} days ago)`);
      }

      // Factor 3: Missing tests (0-0.2)
      const recentChange = apiChanges.find(c => `${c.method} ${c.endpoint}` === api);
      if (recentChange && !recentChange.hasTest) {
        riskScore += 0.2;
        reasons.push('No unit tests');
      }

      riskScores.push({
        api,
        changeCount: data.count,
        lastChanged: data.lastChanged,
        riskScore: Math.min(riskScore, 1),
        reasons
      });
    }

    // Sort by risk score descending
    riskScores.sort((a, b) => b.riskScore - a.riskScore);

    // Keep only top 20 high-risk APIs
    history.apiRiskScores = riskScores.slice(0, 20);

    this.saveHistory(history);
  }

  /**
   * Get change history for a specific API
   */
  getAPIChangeHistory(serviceName: string, api: string): GitChangeHistoryEntry[] {
    const history = this.loadHistory(serviceName);
    
    return history.gitChanges.filter(entry =>
      entry.apisChanged.some(change => 
        `${change.method} ${change.endpoint}` === api
      )
    );
  }

  /**
   * Get high-risk APIs
   */
  getHighRiskAPIs(serviceName: string, minRiskScore: number = 0.5): APIRiskScore[] {
    const history = this.loadHistory(serviceName);
    return history.apiRiskScores.filter(score => score.riskScore >= minRiskScore);
  }

  /**
   * Get coverage trend for charts
   */
  getCoverageTrend(serviceName: string, days: number = 30): CoverageTrendEntry[] {
    const history = this.loadHistory(serviceName);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return history.coverageTrends.filter(
      entry => new Date(entry.timestamp) >= cutoffDate
    );
  }

  /**
   * Get git commit info
   */
  getCommitInfo(): { commit: string; author: string; message: string } | null {
    try {
      const { execSync } = require('child_process');
      
      const commit = execSync('git rev-parse --short HEAD', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      }).trim();

      const author = execSync('git log -1 --pretty=format:"%an"', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      }).trim();

      const message = execSync('git log -1 --pretty=format:"%s"', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      }).trim();

      return { commit, author, message };
    } catch (error) {
      return null;
    }
  }
}
