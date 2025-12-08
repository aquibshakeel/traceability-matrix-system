/**
 * Universal Scenario Loader
 * Loads and parses scenarios from multiple formats: YAML, JSON, TXT, Markdown
 * Supports rich metadata and flexible scenario definitions
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { 
  Scenario, 
  MatchingRule, 
  ValidationError, 
  ScenarioFormat,
  Priority,
  RiskLevel
} from '../types';

export class ScenarioLoader {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Load scenarios from file (auto-detect format)
   */
  async loadScenarios(filePath: string): Promise<Scenario[]> {
    const fullPath = path.join(this.projectRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Scenario file not found: ${fullPath}`);
    }

    const ext = path.extname(fullPath).toLowerCase();
    
    try {
      let scenarios: Scenario[];
      
      switch (ext) {
        case '.yaml':
        case '.yml':
          scenarios = await this.loadYAMLScenarios(fullPath);
          break;
        case '.json':
          scenarios = await this.loadJSONScenarios(fullPath);
          break;
        case '.md':
        case '.markdown':
          scenarios = await this.loadMarkdownScenarios(fullPath);
          break;
        case '.txt':
          scenarios = await this.loadPlainTextScenarios(fullPath);
          break;
        default:
          throw new Error(`Unsupported scenario file format: ${ext}. Supported: .yaml, .json, .md, .txt`);
      }

      // Validate loaded scenarios
      this.validateScenarios(scenarios, fullPath);
      
      return scenarios;
    } catch (error) {
      throw new Error(`Failed to load scenarios from ${fullPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load YAML scenarios - Rich structured format
   */
  private async loadYAMLScenarios(filePath: string): Promise<Scenario[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = yaml.load(content) as any;
    
    if (!data) {
      throw new Error('Empty YAML file');
    }

    // Support both direct array and object with scenarios property
    const scenariosData = Array.isArray(data) ? data : data.scenarios;
    
    if (!scenariosData || !Array.isArray(scenariosData)) {
      throw new Error('Invalid YAML format: Expected scenarios array');
    }

    return scenariosData.map((s: any) => this.normalizeScenario(s));
  }

  /**
   * Load JSON scenarios - Rich structured format
   */
  private async loadJSONScenarios(filePath: string): Promise<Scenario[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!data) {
      throw new Error('Empty JSON file');
    }

    // Support both direct array and object with scenarios property
    const scenariosData = Array.isArray(data) ? data : data.scenarios;
    
    if (!scenariosData || !Array.isArray(scenariosData)) {
      throw new Error('Invalid JSON format: Expected scenarios array');
    }

    return scenariosData.map((s: any) => this.normalizeScenario(s));
  }

  /**
   * Load Markdown scenarios - Human-readable format
   */
  private async loadMarkdownScenarios(filePath: string): Promise<Scenario[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const scenarios: Scenario[] = [];
    const lines = content.split('\n');
    
    let currentScenario: any = null;
    let inCodeBlock = false;
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Handle code blocks
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      
      if (inCodeBlock) continue;
      
      // New scenario: ## Scenario: or ### Scenario ID:
      if (trimmed.match(/^#{2,3}\s+Scenario(?:\s+ID)?:\s+(.+)/i)) {
        if (currentScenario) {
          scenarios.push(this.normalizeScenario(currentScenario));
        }
        const match = trimmed.match(/^#{2,3}\s+Scenario(?:\s+ID)?:\s+(.+)/i);
        currentScenario = {
          id: match![1].trim(),
          description: '',
          matchingRules: []
        };
        currentSection = '';
      }
      // Metadata fields
      else if (currentScenario && trimmed.match(/^\*\*(.+?):\*\*\s*(.+)/)) {
        const match = trimmed.match(/^\*\*(.+?):\*\*\s*(.+)/);
        const key = match![1].toLowerCase().replace(/\s+/g, '_');
        const value = match![2].trim();
        
        if (key === 'priority') currentScenario.priority = value;
        else if (key === 'risk_level' || key === 'risk') currentScenario.riskLevel = value;
        else if (key === 'category') currentScenario.category = value;
        else if (key === 'api_endpoint' || key === 'api') currentScenario.apiEndpoint = value;
        else if (key === 'http_method' || key === 'method') currentScenario.httpMethod = value;
        else if (key === 'tags') currentScenario.tags = value.split(',').map((t: string) => t.trim());
      }
      // Section headers
      else if (trimmed.match(/^#{4}\s+(.+)/)) {
        currentSection = trimmed.match(/^#{4}\s+(.+)/)![1].toLowerCase();
      }
      // Content lines
      else if (currentScenario && trimmed.length > 0 && !trimmed.startsWith('#')) {
        if (currentSection === 'description' || !currentSection) {
          currentScenario.description = currentScenario.description 
            ? `${currentScenario.description} ${trimmed}`
            : trimmed;
        } else if (currentSection === 'acceptance criteria') {
          if (!currentScenario.acceptanceCriteria) {
            currentScenario.acceptanceCriteria = [];
          }
          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            currentScenario.acceptanceCriteria.push(trimmed.replace(/^[-*]\s*/, ''));
          }
        }
      }
    }
    
    // Add last scenario
    if (currentScenario) {
      scenarios.push(this.normalizeScenario(currentScenario));
    }
    
    return scenarios;
  }

  /**
   * Load plain text scenarios - Simple format for QA team
   */
  private async loadPlainTextScenarios(filePath: string): Promise<Scenario[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const scenarios: Scenario[] = [];
    const lines = content.split('\n');
    
    let currentScenario: any = null;
    let currentApi: string = '';
    let descriptionLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Detect API sections
      if (trimmed.match(/^API:\s+(.+)/i)) {
        const match = trimmed.match(/^API:\s+(.+)/i);
        currentApi = match![1].trim();
        continue;
      }
      
      // New scenario
      if (trimmed.match(/^Scenario\s+ID:\s*(.+)/i)) {
        // Save previous scenario
        if (currentScenario) {
          currentScenario.description = descriptionLines.join(' ').trim();
          scenarios.push(this.normalizeScenario(currentScenario));
        }
        
        const match = trimmed.match(/^Scenario\s+ID:\s*(.+)/i);
        currentScenario = {
          id: match![1].trim(),
          apiEndpoint: currentApi,
          matchingRules: []
        };
        descriptionLines = [];
      }
      // Metadata fields
      else if (currentScenario) {
        if (trimmed.match(/^Priority:\s*(.+)/i)) {
          const match = trimmed.match(/^Priority:\s*(.+)/i);
          currentScenario.priority = match![1].trim();
        }
        else if (trimmed.match(/^Risk\s*Level:\s*(.+)/i)) {
          const match = trimmed.match(/^Risk\s*Level:\s*(.+)/i);
          currentScenario.riskLevel = match![1].trim();
        }
        else if (trimmed.match(/^Category:\s*(.+)/i)) {
          const match = trimmed.match(/^Category:\s*(.+)/i);
          currentScenario.category = match![1].trim();
        }
        else if (trimmed.match(/^Tags:\s*(.+)/i)) {
          const match = trimmed.match(/^Tags:\s*(.+)/i);
          currentScenario.tags = match![1].split(',').map(t => t.trim());
        }
        // Description lines (When/Then/And format)
        else if (trimmed.match(/^(When|Then|And|Given)\s+/i)) {
          descriptionLines.push(trimmed);
        }
        else if (trimmed.length > 0 && !trimmed.startsWith('=') && !trimmed.startsWith('#')) {
          // Other description text
          descriptionLines.push(trimmed);
        }
      }
    }
    
    // Add last scenario
    if (currentScenario) {
      currentScenario.description = descriptionLines.join(' ').trim();
      scenarios.push(this.normalizeScenario(currentScenario));
    }
    
    return scenarios;
  }

  /**
   * Normalize scenario to ensure all required fields exist
   */
  private normalizeScenario(raw: any): Scenario {
    // Generate matching rules
    const matchingRules: MatchingRule[] = [];
    
    if (raw.matchingRules && Array.isArray(raw.matchingRules)) {
      matchingRules.push(...raw.matchingRules);
    } else {
      // Auto-generate matching rules from description and metadata
      const description = raw.description || '';
      const apiEndpoint = raw.apiEndpoint || '';
      
      // Fuzzy matching on description
      if (description) {
        matchingRules.push({
          type: 'fuzzy',
          pattern: description,
          threshold: 0.7
        });
      }
      
      // Exact matching on API endpoint if present
      if (apiEndpoint) {
        matchingRules.push({
          type: 'exact',
          pattern: apiEndpoint,
          threshold: 1.0
        });
      }
      
      // Keyword matching on category
      if (raw.category) {
        matchingRules.push({
          type: 'keyword',
          pattern: raw.category,
          keywords: [raw.category.toLowerCase()],
          threshold: 0.5
        });
      }
    }

    return {
      id: raw.id || raw.scenarioId || 'UNKNOWN',
      manualTestId: raw.manualTestId,
      module: raw.module,
      moduleName: raw.moduleName || raw.module,
      description: raw.description || '',
      apiEndpoint: raw.apiEndpoint,
      httpMethod: raw.httpMethod || raw.method,
      category: raw.category,
      priority: this.normalizePriority(raw.priority),
      riskLevel: this.normalizeRiskLevel(raw.riskLevel || raw.risk),
      matchingRules,
      estimatedEffort: raw.estimatedEffort || raw.effort,
      manualTestingRequired: raw.manualTestingRequired || false,
      businessImpact: raw.businessImpact || raw.impact,
      tags: raw.tags || [],
      acceptanceCriteria: raw.acceptanceCriteria || [],
      testData: raw.testData,
      preconditions: raw.preconditions || [],
      postconditions: raw.postconditions || [],
      dependencies: raw.dependencies || [],
      createdBy: raw.createdBy || raw.author,
      createdDate: raw.createdDate,
      lastModified: raw.lastModified || raw.updated,
      status: raw.status || 'Active',
      notes: raw.notes
    };
  }

  /**
   * Normalize priority value
   */
  private normalizePriority(priority: any): Priority {
    if (!priority) return 'P3';
    
    const p = String(priority).toUpperCase();
    if (p.match(/P0|CRITICAL|BLOCKER/)) return 'P0';
    if (p.match(/P1|HIGH|MAJOR/)) return 'P1';
    if (p.match(/P2|MEDIUM|NORMAL/)) return 'P2';
    return 'P3';
  }

  /**
   * Normalize risk level value
   */
  private normalizeRiskLevel(risk: any): RiskLevel {
    if (!risk) return 'Low';
    
    const r = String(risk).toLowerCase();
    if (r.match(/critical|highest/)) return 'Critical';
    if (r.match(/high|major/)) return 'High';
    if (r.match(/medium|moderate/)) return 'Medium';
    return 'Low';
  }

  /**
   * Validate scenarios after loading
   */
  private validateScenarios(scenarios: Scenario[], filePath: string): void {
    const errors: string[] = [];
    const scenarioIds = new Set<string>();
    
    scenarios.forEach((scenario, index) => {
      // Check for required fields
      if (!scenario.id) {
        errors.push(`Scenario at index ${index} missing ID`);
      }
      
      if (!scenario.description) {
        errors.push(`Scenario ${scenario.id} missing description`);
      }
      
      // Check for duplicate IDs
      if (scenarioIds.has(scenario.id)) {
        errors.push(`Duplicate scenario ID: ${scenario.id}`);
      }
      scenarioIds.add(scenario.id);
      
      // Check matching rules
      if (!scenario.matchingRules || scenario.matchingRules.length === 0) {
        errors.push(`Scenario ${scenario.id} has no matching rules`);
      }
    });
    
    if (errors.length > 0) {
      throw new Error(`Validation errors in ${filePath}:\n${errors.join('\n')}`);
    }
  }

  /**
   * Get supported formats
   */
  static getSupportedFormats(): ScenarioFormat[] {
    return ['yaml', 'json', 'txt', 'markdown'];
  }
}
