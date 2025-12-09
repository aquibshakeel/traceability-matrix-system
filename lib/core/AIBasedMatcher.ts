/**
 * AI-Based Matcher - Claude API Integration
 * 
 * Uses Claude AI to perform intelligent matching between:
 * - Business scenarios
 * - Unit tests
 * - API endpoints
 * 
 * Features:
 * - Deep semantic understanding
 * - Context-aware reasoning
 * - Intent detection
 * - Gap analysis
 * - Overlap detection
 * - Coverage assessment
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  MatchingConfig,
  Scenario,
  UnitTest,
  ScenarioMapping,
  MatchDetail,
  CoverageStatus,
} from '../types';

interface AIMatchResult {
  matchType: 'exact' | 'partial' | 'none';
  confidence: number;
  reasoning: string;
  matchedTests: {
    testId: string;
    relevance: number;
    explanation: string;
  }[];
  gaps: string[];
  recommendations: string[];
}

export class AIBasedMatcher {
  private client: Anthropic | null = null;
  private config: MatchingConfig;
  private apiKey: string;
  private model: string = 'claude-3-5-sonnet-20241022';

  constructor(config: MatchingConfig, apiKey: string) {
    this.config = config;
    this.apiKey = apiKey;
    
    if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
      this.client = new Anthropic({
        apiKey: this.apiKey,
      });
    }
  }

  /**
   * Map scenarios to unit tests using Claude AI
   */
  async mapScenarios(scenarios: Scenario[], tests: UnitTest[]): Promise<ScenarioMapping[]> {
    const mappings: ScenarioMapping[] = [];

    console.log(`\n🤖 AI-Based Matching (Claude API):`);
    console.log(`   Processing ${scenarios.length} scenarios against ${tests.length} tests...`);

    if (!this.client) {
      console.log(`   ⚠️  No Claude API key configured - falling back to basic matching`);
      return this.fallbackMatching(scenarios, tests);
    }

    // Process scenarios in batches to respect rate limits
    const batchSize = 3; // Process 3 scenarios at a time
    for (let i = 0; i < scenarios.length; i += batchSize) {
      const batch = scenarios.slice(i, Math.min(i + batchSize, scenarios.length));
      
      const batchPromises = batch.map(scenario => 
        this.matchScenario(scenario, tests)
      );

      const batchResults = await Promise.all(batchPromises);
      mappings.push(...batchResults);

      // Show progress
      console.log(`   Progress: ${Math.min(i + batchSize, scenarios.length)}/${scenarios.length} scenarios analyzed`);
    }

    console.log(`   ✓ AI matching completed\n`);
    return mappings;
  }

  /**
   * Match a single scenario against all tests using Claude AI
   */
  private async matchScenario(scenario: Scenario, tests: UnitTest[]): Promise<ScenarioMapping> {
    try {
      const aiResult = await this.analyzeWithClaude(scenario, tests);
      
      // Convert AI result to ScenarioMapping
      const matchedTests = this.selectMatchedTests(tests, aiResult.matchedTests);
      const coverageStatus = this.determineCoverageStatus(scenario, matchedTests, aiResult);
      const matchScore = aiResult.confidence;

      const matchDetails: MatchDetail[] = matchedTests.map((test, index) => ({
        test,
        strategy: 'ai',
        score: aiResult.matchedTests[index]?.relevance || 0,
        confidence: aiResult.matchedTests[index]?.relevance || 0,
        explanation: aiResult.matchedTests[index]?.explanation || 'AI-based match'
      }));

      return {
        scenario,
        matchedTests,
        coverageStatus,
        matchScore,
        matchDetails,
        gapExplanation: this.generateGapExplanation(aiResult, coverageStatus),
        recommendations: aiResult.recommendations
      };
    } catch (error) {
      console.warn(`   ⚠️  AI analysis failed for ${scenario.id}: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback to basic matching for this scenario
      return this.fallbackMatchScenario(scenario, tests);
    }
  }

  /**
   * Analyze scenario-test matching using Claude AI
   */
  private async analyzeWithClaude(scenario: Scenario, tests: UnitTest[]): Promise<AIMatchResult> {
    if (!this.client) {
      throw new Error('Claude API client not initialized');
    }

    const prompt = this.buildAnalysisPrompt(scenario, tests);

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent analysis
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Parse Claude's response
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    return this.parseAIResponse(responseText);
  }

  /**
   * Build analysis prompt for Claude
   */
  private buildAnalysisPrompt(scenario: Scenario, tests: UnitTest[]): string {
    return `You are an expert QA analyst performing test coverage analysis. Analyze the following business scenario and determine which unit tests provide coverage for it.

**BUSINESS SCENARIO:**
ID: ${scenario.id}
Description: ${scenario.description}
API Endpoint: ${scenario.apiEndpoint || 'N/A'}
HTTP Method: ${scenario.httpMethod || 'N/A'}
Priority: ${scenario.priority}
Risk Level: ${scenario.riskLevel}
Category: ${scenario.category}

${scenario.acceptanceCriteria && scenario.acceptanceCriteria.length > 0 ? `
Acceptance Criteria:
${scenario.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}
` : ''}

**AVAILABLE UNIT TESTS:**
${tests.slice(0, 50).map((test, i) => `
Test ${i + 1}:
  ID: ${test.id}
  Description: ${test.description}
  File: ${test.file}
  Service: ${test.service}
`).join('\n')}

${tests.length > 50 ? `\n... and ${tests.length - 50} more tests (analyzing subset for efficiency)\n` : ''}

**TASK:**
Analyze each test and determine:
1. Does it test the scenario's functionality?
2. What is the relevance/match score (0-1)?
3. Is coverage exact, partial, or none?

Respond in the following JSON format:
{
  "matchType": "exact|partial|none",
  "confidence": 0.85,
  "reasoning": "Brief explanation of the analysis",
  "matchedTests": [
    {
      "testId": "test identifier",
      "relevance": 0.95,
      "explanation": "Why this test matches"
    }
  ],
  "gaps": ["What's not covered"],
  "recommendations": ["Specific actions needed"]
}

Focus on:
- Semantic meaning, not just keyword matching
- Intent and purpose alignment
- Coverage completeness
- Edge cases and validations

Provide your analysis as valid JSON only, no additional text.`;
  }

  /**
   * Parse Claude's JSON response
   */
  private parseAIResponse(responseText: string): AIMatchResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = responseText.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }

      const parsed = JSON.parse(jsonText);

      return {
        matchType: parsed.matchType || 'none',
        confidence: parsed.confidence || 0,
        reasoning: parsed.reasoning || 'No reasoning provided',
        matchedTests: parsed.matchedTests || [],
        gaps: parsed.gaps || [],
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      console.warn(`Failed to parse AI response: ${error}`);
      // Return default response
      return {
        matchType: 'none',
        confidence: 0,
        reasoning: 'Failed to parse AI response',
        matchedTests: [],
        gaps: ['AI analysis failed'],
        recommendations: ['Retry with corrected data']
      };
    }
  }

  /**
   * Select matched tests from AI result
   */
  private selectMatchedTests(allTests: UnitTest[], aiMatches: AIMatchResult['matchedTests']): UnitTest[] {
    const matchedTests: UnitTest[] = [];

    for (const match of aiMatches) {
      const test = allTests.find(t => t.id === match.testId);
      if (test && match.relevance >= 0.5) { // Minimum 50% relevance
        matchedTests.push(test);
      }
    }

    return matchedTests;
  }

  /**
   * Determine coverage status based on AI analysis
   */
  private determineCoverageStatus(
    scenario: Scenario,
    matchedTests: UnitTest[],
    aiResult: AIMatchResult
  ): CoverageStatus {
    if (matchedTests.length === 0) {
      return 'Not Covered';
    }

    // Check AI's assessment
    if (aiResult.matchType === 'exact' && aiResult.confidence >= 0.9) {
      return 'Fully Covered';
    }

    if (aiResult.matchType === 'partial' || aiResult.confidence >= 0.6) {
      return 'Partially Covered';
    }

    // Check acceptance criteria coverage
    if (scenario.acceptanceCriteria && scenario.acceptanceCriteria.length > 0) {
      const criteriaCount = scenario.acceptanceCriteria.length;
      const testCount = matchedTests.length;

      if (testCount >= criteriaCount && aiResult.confidence >= 0.8) {
        return 'Fully Covered';
      }
    }

    return 'Partially Covered';
  }

  /**
   * Generate gap explanation
   */
  private generateGapExplanation(aiResult: AIMatchResult, status: CoverageStatus): string {
    if (status === 'Fully Covered') {
      return `AI Analysis: ${aiResult.reasoning}. Coverage is complete.`;
    }

    if (status === 'Partially Covered') {
      return `AI Analysis: ${aiResult.reasoning}. Gaps: ${aiResult.gaps.join(', ')}`;
    }

    return `AI Analysis: No coverage found. ${aiResult.reasoning}`;
  }

  /**
   * Fallback to basic matching when AI is unavailable
   */
  private fallbackMatching(scenarios: Scenario[], tests: UnitTest[]): ScenarioMapping[] {
    return scenarios.map(scenario => this.fallbackMatchScenario(scenario, tests));
  }

  /**
   * Basic fallback matching for single scenario
   */
  private fallbackMatchScenario(scenario: Scenario, tests: UnitTest[]): ScenarioMapping {
    // Simple keyword-based matching as fallback
    const matchedTests = tests.filter(test => {
      const scenarioText = scenario.description.toLowerCase();
      const testText = test.description.toLowerCase();
      
      // Check for basic keyword overlap
      const scenarioWords = scenarioText.split(/\s+/);
      const testWords = testText.split(/\s+/);
      
      const overlap = scenarioWords.filter(w => 
        w.length > 3 && testWords.some(tw => tw.includes(w) || w.includes(tw))
      );

      return overlap.length >= 2; // At least 2 overlapping words
    });

    return {
      scenario,
      matchedTests,
      coverageStatus: matchedTests.length > 0 ? 'Partially Covered' : 'Not Covered',
      matchScore: matchedTests.length > 0 ? 0.5 : 0,
      matchDetails: matchedTests.map(test => ({
        test,
        strategy: 'fallback',
        score: 0.5,
        confidence: 0.5,
        explanation: 'Fallback keyword matching (AI unavailable)'
      })),
      gapExplanation: matchedTests.length > 0 
        ? 'Basic keyword matching applied (AI unavailable)'
        : 'No matching tests found',
      recommendations: ['Configure Claude API key for better matching']
    };
  }
}
