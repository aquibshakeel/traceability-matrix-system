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
  private model: string = 'claude-3-5-sonnet-20241022';
  private baselineDir: string;
  private aiCasesDir: string;
  private serviceManager: ServiceManager;

  constructor(apiKey: string, projectRoot: string) {
    this.client = new Anthropic({ apiKey });
    this.baselineDir = path.join(projectRoot, '.traceability/test-cases/baseline');
    this.aiCasesDir = path.join(projectRoot, '.traceability/test-cases/ai_cases');
    this.serviceManager = new ServiceManager();
    
    if (!fs.existsSync(this.aiCasesDir)) {
      fs.mkdirSync(this.aiCasesDir, { recursive: true });
    }
  }

  /**
   * Generate AI test cases for a service
   */
  async generate(service: ServiceConfig): Promise<void> {
    console.log(`\n🤖 Generating AI test cases: ${service.name}`);
    console.log('='.repeat(70));
    
    // 1. Spin service
    await this.serviceManager.ensureServiceRunning({
      name: service.name,
      startCommand: service.startCommand,
      stopCommand: service.stopCommand,
      healthCheckUrl: service.healthCheckUrl,
      healthCheckTimeout: service.healthCheckTimeout
    });
    
    // 2. Discover APIs
    console.log(`\n📡 Discovering APIs...`);
    const apis = await this.discoverAPIs(service);
    console.log(`   ✓ Found ${apis.length} APIs`);
    
    // 3. Load baseline (read-only!)
    const baseline = this.loadBaseline(service);
    console.log(`   ✓ Baseline has ${this.countScenarios(baseline)} scenarios`);
    
    // 4. Generate AI scenarios
    console.log(`\n🤖 AI generating scenarios...`);
    const aiScenarios: SimpleScenarios = {};
    
    for (const api of apis) {
      const apiKey = `${api.method} ${api.endpoint}`;
      console.log(`   Processing: ${apiKey}`);
      aiScenarios[apiKey] = await this.generateForAPI(api);
    }
    
    // 5. Mark which are in baseline
    const marked = this.markBaseline(aiScenarios, baseline);
    
    // 6. Save
    this.save(service, marked);
    
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
      const response = await this.client.messages.create({
        model: this.model,
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
   * Save AI cases
   */
  private save(service: ServiceConfig, scenarios: any): void {
    const filePath = path.join(this.aiCasesDir, `${service.name}-ai.yml`);
    
    const data = {
      service: service.name,
      generated: new Date().toISOString(),
      notes: [
        'AI-generated scenarios (✅ = in baseline, 🆕 = new suggestion)',
        'DO NOT EDIT - regenerated automatically',
        'Copy relevant 🆕 scenarios to baseline/{service}-baseline.yml'
      ],
      ...scenarios
    };
    
    fs.writeFileSync(filePath, yaml.dump(data, { indent: 2, lineWidth: -1 }));
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
}
