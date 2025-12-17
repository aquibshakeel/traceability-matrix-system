/**
 * OpenAI (GPT) AI Provider
 * 
 * Implements AIProvider interface for OpenAI models (GPT-4, GPT-4-turbo, etc.)
 */

import OpenAI from 'openai';
import { AIProvider } from '../AIProvider';
import {
  APIDefinition,
  Scenarios,
  BaselineScenario,
  CoverageAnalysis,
  TestCategories,
  ProviderConfig,
  CoverageMatch,
  TestCategorization
} from '../types';
import { UnitTest } from '../../types';

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  private client!: OpenAI;
  private _modelId: string = '';
  private config!: ProviderConfig;

  get modelId(): string {
    return this._modelId;
  }

  /**
   * Initialize the provider
   */
  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.client = new OpenAI({ apiKey: config.apiKey });
    
    // Auto-detect or use specified model
    if (config.model && config.model !== 'auto') {
      this._modelId = config.model;
    } else {
      this._modelId = await this.detectBestModel();
    }
  }

  /**
   * Generate test scenarios for an API
   */
  async generateScenarios(api: APIDefinition): Promise<Scenarios> {
    const prompt = this.buildScenarioPrompt(api);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this._modelId,
        max_tokens: this.config.maxTokens || 2000,
        temperature: this.config.temperature ?? 0.0,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content || '{}';
      return this.parseJSON(content);
    } catch (error) {
      console.error(`OpenAI API error: ${error}`);
      return {};
    }
  }

  /**
   * Analyze test coverage
   */
  async analyzeCoverage(
    api: APIDefinition,
    scenarios: BaselineScenario[],
    tests: UnitTest[]
  ): Promise<CoverageAnalysis> {
    const prompt = this.buildCoveragePrompt(api, scenarios, tests);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this._modelId,
        max_tokens: this.config.maxTokens || 4000,
        temperature: 0.0,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = this.parseJSON(content);
      
      return {
        matches: parsed.matches || [],
        orphanTests: parsed.orphanTests || [],
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      console.error(`OpenAI API error: ${error}`);
      return { matches: [] };
    }
  }

  /**
   * Categorize orphan tests
   */
  async categorizeOrphans(tests: UnitTest[]): Promise<TestCategories> {
    const prompt = this.buildCategorizationPrompt(tests);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this._modelId,
        max_tokens: this.config.maxTokens || 3000,
        temperature: 0.0,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = this.parseJSON(content);
      
      return {
        categorizations: parsed.categorizations || [],
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      console.error(`OpenAI API error: ${error}`);
      return { categorizations: [] };
    }
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: this._modelId,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get provider metadata
   */
  getMetadata() {
    return {
      name: this.name,
      model: this._modelId,
      version: '1.0.0'
    };
  }

  /**
   * Auto-detect best available OpenAI model
   */
  private async detectBestModel(): Promise<string> {
    try {
      const models = await this.client.models.list();
      
      // Prefer GPT-4 Turbo, then GPT-4, then fall back
      const gpt4TurboModels = models.data.filter(m => 
        m.id.includes('gpt-4-turbo') || m.id.includes('gpt-4-1106')
      );
      const gpt4Models = models.data.filter(m => 
        m.id.startsWith('gpt-4') && !m.id.includes('turbo')
      );
      
      if (gpt4TurboModels.length > 0) {
        return gpt4TurboModels[0].id;
      } else if (gpt4Models.length > 0) {
        return gpt4Models[0].id;
      }
      
      // Fallback to known stable model
      return 'gpt-4-turbo-preview';
    } catch (error) {
      // Fallback to known stable model
      return 'gpt-4-turbo-preview';
    }
  }

  /**
   * Build scenario generation prompt
   */
  private buildScenarioPrompt(api: APIDefinition): string {
    return `Generate test scenarios for this API in simple one-liner format.

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
  }

  /**
   * Build coverage analysis prompt
   */
  private buildCoveragePrompt(
    api: APIDefinition,
    scenarios: BaselineScenario[],
    tests: UnitTest[]
  ): string {
    return `Analyze test coverage for ${api.method} ${api.endpoint}

**Expected Scenarios:**
${scenarios.map((s, i) => `${i + 1}. [${s.priority}] ${s.scenario}`).join('\n')}

**Available Tests:**
${tests.map((t, i) => `Test ${i + 1}: ${t.description} (${t.file})`).join('\n')}

Determine coverage status for each scenario. Respond in JSON:
{
  "matches": [
    {
      "scenario": "scenario text",
      "status": "FULLY_COVERED" | "PARTIALLY_COVERED" | "NOT_COVERED",
      "testNumbers": [1, 2],
      "explanation": "explanation",
      "confidence": "HIGH" | "MEDIUM" | "LOW"
    }
  ]
}`;
  }

  /**
   * Build categorization prompt
   */
  private buildCategorizationPrompt(tests: UnitTest[]): string {
    return `Categorize these unit tests as TECHNICAL or BUSINESS:

**Tests:**
${tests.map((t, i) => `Test ${i + 1}: ${t.description} (${t.file})`).join('\n')}

- TECHNICAL: Infrastructure tests (Entity, DTO, Mapper) - no scenario needed
- BUSINESS: Business logic tests (Controller, Service) - needs scenario

Respond in JSON:
{
  "categorizations": [
    {
      "testNumber": 1,
      "category": "TECHNICAL" | "BUSINESS",
      "subtype": "Entity Test" | "Controller Test" | etc,
      "priority": "P0" | "P1" | "P2" | "P3",
      "action": "none" | "qa_add_scenario",
      "reasoning": "explanation"
    }
  ]
}`;
  }

  /**
   * Parse JSON from AI response
   */
  private parseJSON(content: string): any {
    try {
      let json = content.trim();
      if (json.startsWith('```')) {
        json = json.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      return JSON.parse(json);
    } catch (error) {
      console.error('JSON parse error:', error);
      return {};
    }
  }
}
