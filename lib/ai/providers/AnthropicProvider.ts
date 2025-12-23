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
      const scenarios = this.parseJSON(content);
      
      // Filter out non-API testing scenarios
      return this.filterNonAPIScenarios(scenarios);
    } catch (error) {
      console.error(`Anthropic API error: ${error}`);
      return {};
    }
  }

  /**
   * Filter out security, infrastructure, and non-API testing scenarios
   */
  private filterNonAPIScenarios(scenarios: Scenarios): Scenarios {
    const filtered: any = {};
    
    // Keywords to exclude (security, infrastructure, auth)
    const excludePatterns = [
      /\btoken\b/i,
      /\bauth(entication|orization)?\b/i,
      /\bjwt\b/i,
      /\boauth\b/i,
      /\bsession\b/i,
      /\bpermission\b/i,
      /\brole\b/i,
      /\baccess control\b/i,
      /\bsql injection\b/i,
      /\bxss\b/i,
      /\bcsrf\b/i,
      /\brate limit\b/i,
      /\bthrottl/i,
      /\bdatabase.*unavailable\b/i,
      /\bdatabase.*connection\b/i,
      /\bdatabase.*fail/i,
      /\bservice.*unavailable\b/i,
      /\b500\b/,
      /\b503\b/,
      /\bhttps\b/i,
      /\btls\b/i,
      /\bssl\b/i,
      /\bnetwork\b/i,
      /\btimeout\b/i,
      /\bddos\b/i,
      /\bbrute force\b/i,
      /\breplay attack\b/i,
      /\bexpired.*token\b/i,
      /\binvalid.*token\b/i,
      /\btamper\b/i,
      /\btenant\b/i,
      /\banother user\b/i,
      /\bexcessive requests\b/i,
      /\b429\b/
    ];
    
    for (const [category, scenarioList] of Object.entries(scenarios)) {
      if (!scenarioList || !Array.isArray(scenarioList)) continue;
      
      filtered[category] = scenarioList.filter((scenario: string) => {
        const lowerScenario = scenario.toLowerCase();
        
        // Check if scenario matches any exclude pattern
        for (const pattern of excludePatterns) {
          if (pattern.test(scenario)) {
            return false; // Exclude this scenario
          }
        }
        
        return true; // Keep this scenario
      });
    }
    
    return filtered as Scenarios;
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
    return `You are an API testing expert. Generate FUNCTIONAL API test scenarios for this endpoint.

**API:** ${api.method} ${api.endpoint}
**Description:** ${api.description || 'N/A'}
**Parameters:** ${JSON.stringify(api.parameters || [])}
**Request Body:** ${JSON.stringify(api.requestBody || {})}
**Responses:** ${JSON.stringify(api.responses || {})}

CRITICAL: Generate ONLY functional API testing scenarios. Focus on:

✅ INCLUDE (API Functional Testing):
- Valid API requests with required fields
- Invalid API requests (missing fields, wrong data types, format validation)
- Boundary values (min/max length, empty strings, special characters in data)
- API response validation (200, 400, 404, 422 status codes)
- Business logic validation (duplicate checks, data constraints)
- Query parameter combinations
- Request body field validation
- Response data structure validation

❌ ABSOLUTELY EXCLUDE (NOT API Testing):
- Authentication tokens (JWT, OAuth, session) - SKIP
- Authorization permissions (user roles, access control) - SKIP
- Security attacks (SQL injection, XSS, CSRF) - SKIP
- Rate limiting or throttling - SKIP
- Database connection failures - SKIP
- Service availability (500, 503 errors) - SKIP
- HTTPS/TLS/SSL transport security - SKIP
- Network timeouts or connection issues - SKIP
- DDoS or brute force attacks - SKIP
- Session management or expiry - SKIP
- Any infrastructure or security concerns - SKIP

SCENARIO FORMAT RULES:
- Start with "When" followed by the API action
- Focus on DATA and BUSINESS LOGIC only
- Use simple, clear language (1 line each)
- Specify expected HTTP status code when relevant
- Do NOT mention tokens, auth, permissions, security

GOOD EXAMPLES:
- When creating customer with valid email, name, and phone, return 201
- When email format is invalid, return 400 with validation error
- When required field 'name' is missing, return 400
- When email already exists in system, return 409 conflict
- When customer ID does not exist, return 404
- When email exceeds maximum length of 255 characters, return 400
- When retrieving customer with valid ID, return customer details
- When updating customer with new email, update succeeds

BAD EXAMPLES (Don't generate these):
- When authentication token is missing, return 401 ❌
- When user lacks permission, return 403 ❌
- When database is unavailable, return 500 ❌
- When rate limit exceeded, return 429 ❌
- When HTTPS not used, reject request ❌
- When CSRF token invalid, return 403 ❌

Generate scenarios in 3 categories:

1. **happy_case**: Valid API requests that should succeed (200, 201, 204)
2. **edge_case**: Boundary conditions, optional fields, special characters in data
3. **error_case**: Invalid API requests that should fail (400, 404, 409, 422)

Respond ONLY with JSON (no explanations):
{
  "happy_case": ["scenario 1", "scenario 2", ...],
  "edge_case": ["scenario 1", "scenario 2", ...],
  "error_case": ["scenario 1", "scenario 2", ...]
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
