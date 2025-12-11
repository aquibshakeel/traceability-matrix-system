/**
 * History Tracker
 * 
 * Persists coverage history over time to enable trend visualization
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CoverageSnapshot {
  date: string; // YYYY-MM-DD
  timestamp: number;
  coverage: number;
  fullyCovered: number;
  totalScenarios: number;
  p0Gaps: number;
  p1Gaps: number;
  p2Gaps: number;
  p3Gaps: number;
  orphanTests: number;
}

export interface ServiceHistory {
  service: string;
  snapshots: CoverageSnapshot[];
  lastUpdated: string;
}

export class HistoryTracker {
  private historyDir: string;
  private maxSnapshots: number = 90; // Keep 90 days of history

  constructor(projectRoot: string) {
    this.historyDir = path.join(projectRoot, '.traceability/history');
    this.ensureHistoryDir();
  }

  /**
   * Ensure history directory exists
   */
  private ensureHistoryDir(): void {
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
  }

  /**
   * Add a coverage snapshot for a service
   */
  addSnapshot(serviceName: string, snapshot: Omit<CoverageSnapshot, 'date' | 'timestamp'>): void {
    const history = this.loadHistory(serviceName);
    
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();
    
    // Check if we already have a snapshot for today
    const existingIndex = history.snapshots.findIndex(s => s.date === today);
    
    const newSnapshot: CoverageSnapshot = {
      date: today,
      timestamp: now,
      ...snapshot
    };
    
    if (existingIndex >= 0) {
      // Update existing snapshot for today
      history.snapshots[existingIndex] = newSnapshot;
    } else {
      // Add new snapshot
      history.snapshots.push(newSnapshot);
    }
    
    // Sort by date (oldest first)
    history.snapshots.sort((a, b) => a.timestamp - b.timestamp);
    
    // Keep only last N snapshots
    if (history.snapshots.length > this.maxSnapshots) {
      history.snapshots = history.snapshots.slice(-this.maxSnapshots);
    }
    
    history.lastUpdated = new Date().toISOString();
    
    this.saveHistory(serviceName, history);
  }

  /**
   * Get coverage trend for a service
   */
  getTrend(serviceName: string, days: number = 30): CoverageSnapshot[] {
    const history = this.loadHistory(serviceName);
    
    // Return last N days
    return history.snapshots.slice(-days);
  }

  /**
   * Get full history for a service
   */
  getHistory(serviceName: string): ServiceHistory {
    return this.loadHistory(serviceName);
  }

  /**
   * Load history from disk
   */
  private loadHistory(serviceName: string): ServiceHistory {
    const filePath = path.join(this.historyDir, `${serviceName}-history.json`);
    
    if (!fs.existsSync(filePath)) {
      return {
        service: serviceName,
        snapshots: [],
        lastUpdated: new Date().toISOString()
      };
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to load history for ${serviceName}:`, error);
      return {
        service: serviceName,
        snapshots: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Save history to disk
   */
  private saveHistory(serviceName: string, history: ServiceHistory): void {
    const filePath = path.join(this.historyDir, `${serviceName}-history.json`);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Failed to save history for ${serviceName}:`, error);
    }
  }

  /**
   * Clear history for a service
   */
  clearHistory(serviceName: string): void {
    const filePath = path.join(this.historyDir, `${serviceName}-history.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Get statistics about historical data
   */
  getStats(serviceName: string): {
    totalSnapshots: number;
    oldestDate: string | null;
    newestDate: string | null;
    averageCoverage: number;
    trend: 'improving' | 'declining' | 'stable';
  } {
    const history = this.loadHistory(serviceName);
    
    if (history.snapshots.length === 0) {
      return {
        totalSnapshots: 0,
        oldestDate: null,
        newestDate: null,
        averageCoverage: 0,
        trend: 'stable'
      };
    }
    
    const avgCoverage = history.snapshots.reduce((sum, s) => sum + s.coverage, 0) / history.snapshots.length;
    
    // Determine trend by comparing first half vs second half
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (history.snapshots.length >= 4) {
      const midpoint = Math.floor(history.snapshots.length / 2);
      const firstHalf = history.snapshots.slice(0, midpoint);
      const secondHalf = history.snapshots.slice(midpoint);
      
      const firstAvg = firstHalf.reduce((sum, s) => sum + s.coverage, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, s) => sum + s.coverage, 0) / secondHalf.length;
      
      const diff = secondAvg - firstAvg;
      if (diff > 2) trend = 'improving';
      else if (diff < -2) trend = 'declining';
    }
    
    return {
      totalSnapshots: history.snapshots.length,
      oldestDate: history.snapshots[0].date,
      newestDate: history.snapshots[history.snapshots.length - 1].date,
      averageCoverage: avgCoverage,
      trend
    };
  }
}
