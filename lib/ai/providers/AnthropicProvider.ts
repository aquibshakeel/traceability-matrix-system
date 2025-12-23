/**
 * Anthropic (Claude) AI Provider
 * 
 * Implements AIProvider interface for Claude AI models.
 * This wraps existing Claude AI logic for compatibility with the provider abstraction.
 */

import Anthropic from '@anthropic-ai/sdk';
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

export class AnthropicProvider implements AIProvider {
  readonly name = 'Anthropic';
  private client!: Anthropic;
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
    this.client = new Anthropic({ apiKey: config.apiKey });
    
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
      const response = await this.client.messages.create({
        model: this._modelId,
        max_tokens: this.config.maxTokens || 2000,
        temperature: this.config.temperature ?? 0.0,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseJSON(content);
    } catch (error) {
      console.error(`Anthropic API error: ${error}`);
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
      const response = await this.client.messages.create({
        model: this._modelId,
        max_tokens: this.config.maxTokens || 4000,
        temperature: 0.0,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = this.parseJSON(content);
      
      return {
        matches: parsed.matches || [],
        orphanTests: parsed.orphanTests || [],
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      console.error(`Anthropic API error: ${error}`);
      return { matches: [] };
    }
  }

  /**
   * Categorize orphan tests
   */
  async categorizeOrphans(tests: UnitTest[]): Promise<TestCategories> {
    const prompt = this.buildCategorizationPrompt(tests);
    
    try {
      const response = await this.client.messages.create({
        model: this._modelId,
        max_tokens: this.config.maxTokens || 3000,
        temperature: 0.0,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = this.parseJSON(content);
      
      return {
        categorizations: parsed.categorizations || [],
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      console.error(`Anthropic API error: ${error}`);
      return { categorizations: [] };
    }
  }

  /**
   * Infer priority for a test scenario using AI
   */
  async inferPriority(scenario: string): Promise<'P0' | 'P1' | 'P2' | 'P3'> {
    const prompt = `Classify this test scenario's priority for API testing:

Scenario: "${scenario}"

Priority Definitions:
- P0: Security threats (SQL injection, XSS, CSRF, auth bypass, session hijacking, transport security like HTTPS/TLS/SSL)
- P1: Critical API validation (empty/null/missing required fields, invalid formats, bad request 400), infrastructure failures (database connection, service unavailable 500/503), attack prevention (rate limiting, brute force, replay attacks, account locking, password policies)
- P2: Edge cases (boundary testing, special characters, maximum/minimum length), validation rules
- P3: Nice-to-have features, everything else

Analyze the scenario and respond with ONLY the priority level: P0, P1, P2, or P3

No explanation needed, just the priority.`;

    try {
      const response = await this.client.messages.create({
        model: this._modelId,
        max_tokens: 10,
        temperature: 0.0,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const priority = content.trim().toUpperCase();
      
      // Validate response
      if (priority === 'P0' || priority === 'P1' || priority === 'P2' || priority === 'P3') {
        return priority as 'P0' | 'P1' | 'P2' | 'P3';
      }
      
      // Fallback to P3 if invalid response
      console.warn(`Invalid priority response: ${content}, defaulting to P3`);
      return 'P3';
    } catch (error) {
      console.error(`Anthropic API error in inferPriority: ${error}`);
      throw error; // Let caller handle fallback
    }
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.messages.create({
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
   * Auto-detect best available Claude model
   */
  private async detectBestModel(): Promise<string> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      if (!response.ok) {
        throw new Error(`Models API failed: ${response.status}`);
      }

      const data: any = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No models returned from API');
      }

      // Prefer Claude 4.5 Sonnet, then fall back
      const claude4Models = data.data.filter((m: any) => 
        m.id.includes('-4-5-') || m.id.includes('-4-')
      );
      const claude3Models = data.data.filter((m: any) => 
        m.id.includes('-3-7-') || m.id.includes('-3-5-') || m.id.includes('-3-')
      );
      
      let selectedModel = null;
      
      if (claude4Models.length > 0) {
        const sonnet = claude4Models.find((m: any) => m.id.includes('sonnet'));
        const opus = claude4Models.find((m: any) => m.id.includes('opus'));
        const haiku = claude4Models.find((m: any) => m.id.includes('haiku'));
        selectedModel = sonnet || opus || haiku || claude4Models[0];
      } else if (claude3Models.length > 0) {
        const sonnet = claude3Models.find((m: any) => m.id.includes('sonnet'));
        selectedModel = sonnet || claude3Models[0];
      } else {
        selectedModel = data.data[0];
      }
      
      return selectedModel.id;
    } catch (error) {
      // Fallback to known stable model
      return 'claude-3-5-sonnet-20240620';
    }
  }

  /**
   * Build scenario generation prompt
   */
  private buildScenarioPrompt(api: APIDefinition): string {
    return `Generate API-LEVEL BUSINESS test scenarios ONLY for this API in simple, natural language format.

**API:** ${api.method} ${api.endpoint}
**Description:** ${api.description || 'N/A'}
**Parameters:** ${JSON.stringify(api.parameters || [])}
**Request Body:** ${JSON.stringify(api.requestBody || {})}
**Responses:** ${JSON.stringify(api.responses || {})}

IMPORTANT RULES:
- Focus ONLY on API-level business scenarios (what the API does)
- DO NOT include security tests (SQL injection, XSS, CSRF, authentication, authorization)
- DO NOT include infrastructure tests (database connection, service health, timeouts)
- DO NOT include technical implementation details
- Use simple, natural language that QA can understand
- Keep scenarios short and clear (1-2 lines max)

Generate these types of scenarios:

1. **happy_case** - Valid business flows and successful operations
2. **edge_case** - Boundary conditions, special values, optional fields
3. **error_case** - Invalid business inputs, missing required data, business rule violations

Format examples (simple and clear):
- Customer created with valid details
- Update customer with new email address
- Retrieve customer by ID
- Delete existing customer
- Create customer with minimum required fields
- Update with missing required field returns error
- Get non-existent customer returns 404

EXCLUDE (DO NOT generate):
- SQL injection scenarios
- XSS attack scenarios
- Authentication/authorization tests
- Rate limiting tests
- Session management tests
- HTTPS/TLS tests
- Database connection tests
- Any security-focused scenarios

Respond in JSON (NO security category):
{
  "happy_case": ["scenario 1", "scenario 2"],
  "edge_case": ["scenario 1", "scenario 2"],
  "error_case": ["scenario 1", "scenario 2"]
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
