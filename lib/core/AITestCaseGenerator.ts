/**
 * AI Test Case Generator - Simple One-Liner Format
 * 
 * Generates test scenarios in simple format:
 * - One-liner descriptions
 * - Grouped by API
 * - Categorized (happy_case, edge_case, error_case, security)
 * - Marks which are in baseline (✅) vs new (🆕)
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { SwaggerParser } from './SwaggerParser';
import { APIScanner } from './APIScanner';
import { ServiceManager } from './ServiceManager';
import { GitChangeDetector } from './GitChangeDetector';
import { ModelDetector } from './ModelDetector';
import { ServiceConfig } from '../types';

export interface SimpleScenarios {
  [api: string]: {
    happy_case?: string[];
    edge_case?: string[];
    error_case?: string[];
    security?: string[];
  };
}

export class AITestCaseGenerator {
  private client: Anthropic;
  private model: string | null = null;
  private modelDetector: ModelDetector;
  private baselineDir: string;
  private aiCasesDir: string;
  private serviceManager: ServiceManager;
  private projectRoot: string;

  constructor(apiKey: string, projectRoot: string) {
    this.client = new Anthropic({ apiKey });
    this.projectRoot = projectRoot;
    this.modelDetector = new ModelDetector(apiKey);
    
    this.baselineDir = path.join(projectRoot, '.traceability/test-cases/baseline');
    this.aiCasesDir = path.join(projectRoot, '.traceability/test-cases/ai_cases');
    this.serviceManager = new ServiceManager();
    
    if (!fs.existsSync(this.aiCasesDir)) {
      fs.mkdirSync(this.aiCasesDir, { recursive: true });
    }
  }

  /**
   * Get the best available model for this user
   */
  private async getModel(): Promise<string> {
    if (!this.model) {
      this.model = await this.modelDetector.detectBestModel();
    }
    return this.model;
  }

  /**
   * Generate AI test cases for a service
   */
  async generate(service: ServiceConfig): Promise<void> {
    console.log(`\n🤖 Generating AI test cases: ${service.name}`);
    console.log('='.repeat(70));
    
    // 1. Detect git changes
    const gitDetector = new GitChangeDetector(path.dirname(this.aiCasesDir));
    const gitChanges = await gitDetector.detectChanges([service.path]);
    const changeMap = new Map<string, any>();
    
    for (const change of gitChanges.apiChanges) {
      const apiKey = `${change.method} ${change.endpoint}`;
      const affectedTests = gitDetector.findAffectedTests(change.file, service.path);
      const changeDetails = gitDetector.getChangeDetails(change.file);
      
      changeMap.set(apiKey, {
        type: change.type,
        file: change.file,
        affectedTests,
        changeDetails
      });
    }
    
    if (gitChanges.apiChanges.length > 0) {
      console.log(`   ✓ Detected ${gitChanges.apiChanges.length} API changes`);
    }
    
    // 2. Spin service
    await this.serviceManager.ensureServiceRunning({
      name: service.name,
      startCommand: service.startCommand,
      stopCommand: service.stopCommand,
      healthCheckUrl: service.healthCheckUrl,
      healthCheckTimeout: service.healthCheckTimeout
    });
    
    // 3. Discover APIs
    console.log(`\n📡 Discovering APIs...`);
    const apis = await this.discoverAPIs(service);
    console.log(`   ✓ Found ${apis.length} APIs`);
    
    // 4. Generate AI scenarios (NO access to baseline)
    console.log(`\n🤖 AI generating scenarios...`);
    const aiScenarios: SimpleScenarios = {};
    
    for (const api of apis) {
      const apiKey = `${api.method} ${api.endpoint}`;
      console.log(`   Processing: ${apiKey}`);
      aiScenarios[apiKey] = await this.generateForAPI(api);
    }
    
    // 5. Mark which are in baseline (separate step)
    const baseline = this.loadBaseline(service);
    const baselineCount = this.countScenarios(baseline);
    console.log(`\n📋 Comparing with baseline (${baselineCount} scenarios)...`);
    const marked = this.markBaseline(aiScenarios, baseline);
    
    // 6. Save with change impact
    this.save(service, marked, changeMap);
    
    console.log(`\n✅ Generation complete!`);
    console.log('='.repeat(70));
  }

  /**
   * Discover APIs
   */
  private async discoverAPIs(service: ServiceConfig): Promise<any[]> {
    const apis: any[] = [];
    
    // Swagger
    try {
      const swaggerFiles = SwaggerParser.findSwaggerFiles(service.path);
      if (swaggerFiles.length > 0) {
        const spec = SwaggerParser.parseFile(swaggerFiles[0]);
        const swaggerAPIs = SwaggerParser.extractAPIs(spec);
        apis.push(...swaggerAPIs.map(api => ({
          method: api.method,
          endpoint: api.path,
          description: api.summary || api.description,
          parameters: api.parameters,
          requestBody: api.requestBody,
          responses: api.responses
        })));
      }
    } catch (error) {
      console.warn(`   ⚠️  Swagger failed: ${error}`);
    }
    
    // Code scan
    try {
      const scanner = new APIScanner();
      const scanned = await scanner.scanAPIs(service);
      scanned.forEach(api => {
        if (!apis.find(a => a.method === api.method && a.endpoint === api.endpoint)) {
          apis.push(api);
        }
      });
    } catch (error) {
      console.warn(`   ⚠️  Code scan failed: ${error}`);
    }
    
    return apis;
  }

  /**
   * Generate scenarios for one API
   */
  private async generateForAPI(api: any): Promise<any> {
    const prompt = `Generate test scenarios for this API in simple one-liner format.

**API:** ${api.method} ${api.endpoint}
**Description:** ${api.description || 'N/A'}
**Parameters:** ${JSON.stringify(api.parameters || [])}
**Request Body:** ${JSON.stringify(api.requestBody || {})}
**Responses:** ${JSON.stringify(api.responses || {})}

Generate simple one-liner test scenarios:

1. **happy_case** - Valid inputs, success responses
2. **edge_case** - Boundaries, special chars, empty/null, long inputs  
3. **error_case** - 400, 401, 403, 404, 409, 422, 500 errors
4. **security** - SQL injection, XSS, auth bypass

Format: "When [condition], [expected result]"

Examples:
- When customer created with valid data, return 201
- When name has special characters, accept and store
- When created with missing required fields, return 400
- When name contains SQL injection, reject with 400

Respond in JSON:
{
  "happy_case": ["one-liner 1", "one-liner 2"],
  "edge_case": ["one-liner 1", "one-liner 2"],
  "error_case": ["one-liner 1", "one-liner 2"],
  "security": ["one-liner 1", "one-liner 2"]
}`;

    try {
      const model = await this.getModel();
      const response = await this.client.messages.create({
        model: model,
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseJSON(content);
    } catch (error) {
      console.error(`     ⚠️  Failed: ${error}`);
      return {};
    }
  }

  /**
   * Mark which scenarios are in baseline
   */
  private markBaseline(aiScenarios: SimpleScenarios, baseline: any): any {
    const marked: any = {};
    
    for (const [apiKey, categories] of Object.entries(aiScenarios)) {
      marked[apiKey] = {};
      
      for (const [category, scenarios] of Object.entries(categories as any)) {
        if (!scenarios || !Array.isArray(scenarios)) continue;
        
        marked[apiKey][category] = scenarios.map((scenario: string) => {
          const inBaseline = this.isInBaseline(apiKey, scenario, baseline);
          return inBaseline ? `${scenario}  ✅` : `${scenario}  🆕`;
        });
      }
    }
    
    return marked;
  }

  /**
   * Check if scenario is in baseline
   */
  private isInBaseline(apiKey: string, scenario: string, baseline: any): boolean {
    if (!baseline || !baseline[apiKey]) return false;
    
    const baselineApi = baseline[apiKey];
    // Handle null/undefined baseline API entries
    if (!baselineApi || baselineApi === null) return false;
    
    for (const category of ['happy_case', 'edge_case', 'error_case', 'security']) {
      const scenarios = baselineApi[category] || [];
      for (const baselineScenario of scenarios) {
        if (this.similar(scenario, baselineScenario)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Simple similarity check
   */
  private similar(a: string, b: string): boolean {
    const wordsA = a.toLowerCase().split(/\s+/);
    const wordsB = b.toLowerCase().split(/\s+/);
    const common = wordsA.filter(w => wordsB.includes(w)).length;
    return common >= 4; // At least 4 common words
  }

  /**
   * Load baseline (read-only)
   */
  private loadBaseline(service: ServiceConfig): any {
    const filePath = path.join(this.baselineDir, `${service.name}-baseline.yml`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = yaml.load(content) as any;
    
    // Extract just the scenarios part (skip service metadata)
    const { service: _, ...scenarios } = data;
    return scenarios;
  }

  /**
   * Count total scenarios
   */
  private countScenarios(baseline: any): number {
    if (!baseline) return 0;
    
    let count = 0;
    for (const apiKey of Object.keys(baseline)) {
      const api = baseline[apiKey];
      for (const category of ['happy_case', 'edge_case', 'error_case', 'security']) {
        count += (api[category] || []).length;
      }
    }
    return count;
  }

  /**
   * Save AI cases with ✅/🆕 markers and change impact
   */
  private save(service: ServiceConfig, scenarios: any, changeMap: Map<string, any>): void {
    const filePath = path.join(this.aiCasesDir, `${service.name}-ai.yml`);
    
    let content = `# AI-Generated Test Scenarios
# Generated: ${new Date().toISOString()}
# (✅ = in baseline, 🆕 = new suggestion, 🔧 = modified, ⚠️ = verify)
# DO NOT EDIT - regenerated automatically
# Copy relevant 🆕 scenarios to baseline/${service.name}-baseline.yml

service: ${service.name}

`;

    // Format each API with markers and change impact
    for (const [apiKey, categories] of Object.entries(scenarios)) {
      const change = changeMap.get(apiKey);
      
      content += `# ${apiKey}\n`;
      
      // Add change impact if API was modified
      if (change) {
        content += `# 🔧 CHANGE DETECTED - ${change.type.toUpperCase()}\n`;
        content += `# File: ${change.file}\n`;
        
        if (change.changeDetails) {
          content += `# Lines changed: ${change.changeDetails.linesChanged}\n`;
        }
        
        if (change.affectedTests && change.affectedTests.length > 0) {
          content += `# ⚠️ Affected tests (${change.affectedTests.length}):\n`;
          change.affectedTests.slice(0, 5).forEach((test: string) => {
            content += `#   - ${test}\n`;
          });
          if (change.affectedTests.length > 5) {
            content += `#   - ... and ${change.affectedTests.length - 5} more\n`;
          }
        }
        
        content += `# Action: Verify affected tests still pass, update if needed\n`;
        content += `#\n`;
      }
      
      content += `${apiKey}:\n`;
      
      for (const [category, scenarioList] of Object.entries(categories as any)) {
        if (!scenarioList || !Array.isArray(scenarioList) || scenarioList.length === 0) continue;
        
        content += `  ${category}:\n`;
        for (const scenario of scenarioList) {
          // Add ⚠️ marker to scenarios if API was changed
          if (change && scenario.includes('✅')) {
            content += `    - ${scenario.replace('✅', '✅ ⚠️')}\n`;
          } else {
            content += `    - ${scenario}\n`;
          }
        }
        content += `\n`;
      }
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`   ✓ Saved: ${filePath}`);
  }

  /**
   * Parse JSON
   */
  private parseJSON(content: string): any {
    try {
      let json = content.trim();
      if (json.startsWith('```')) {
        json = json.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      return JSON.parse(json);
    } catch (error) {
      return {};
    }
  }

  /**
   * Generate scenarios for a single API endpoint
   * Used by the QA-only single API generator tool
   */
  async generateForSingleAPI(api: any): Promise<any> {
    return await this.generateForAPI(api);
  }
}
