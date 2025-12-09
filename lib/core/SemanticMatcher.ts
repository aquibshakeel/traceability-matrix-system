/**
 * Semantic Matcher - Advanced matching engine
 * Supports multiple matching strategies: exact, fuzzy, semantic, keyword, levenshtein, jaccard
 * Handles synonyms, stop words, normalization, and intelligent scenario-to-test mapping
 */

import {
  MatchingConfig,
  Scenario,
  UnitTest,
  ScenarioMapping,
  MatchDetail,
  CoverageStatus,
  MatchingStrategy
} from '../types';

export class SemanticMatcher {
  private config: MatchingConfig;
  private stopWordsSet: Set<string>;

  constructor(config: MatchingConfig) {
    this.config = config;
    this.stopWordsSet = new Set(config.stopWords || this.getDefaultStopWords());
  }

  /**
   * Map scenarios to unit tests using configured strategies
   */
  mapScenarios(scenarios: Scenario[], tests: UnitTest[]): ScenarioMapping[] {
    const mappings: ScenarioMapping[] = [];

    for (const scenario of scenarios) {
      const matchedTests: MatchDetail[] = [];

      // Try matching with each test
      for (const test of tests) {
        const matchScore = this.calculateMatchScore(scenario, test);
        
        if (matchScore >= this.config.defaultThreshold) {
          matchedTests.push({
            test,
            strategy: this.getBestStrategy(scenario, test),
            score: matchScore,
            confidence: this.calculateConfidence(matchScore),
            explanation: this.generateMatchExplanation(scenario, test, matchScore)
          });
        }
      }

      // Sort by score descending
      matchedTests.sort((a, b) => b.score - a.score);

      // Determine coverage status
      const coverageStatus = this.determineCoverageStatus(scenario, matchedTests);
      
      // Calculate overall match score
      const overallScore = matchedTests.length > 0 
        ? matchedTests[0].score 
        : 0;

      // Generate gap explanation
      const gapExplanation = this.generateGapExplanation(scenario, matchedTests, coverageStatus);

      // Generate recommendations
      const recommendations = this.generateRecommendations(scenario, matchedTests, coverageStatus);

      mappings.push({
        scenario,
        matchedTests: matchedTests.map(m => m.test),
        coverageStatus,
        matchScore: overallScore,
        matchDetails: matchedTests,
        gapExplanation,
        recommendations
      });
    }

    return mappings;
  }

  /**
   * Calculate overall match score between scenario and test
   */
  private calculateMatchScore(scenario: Scenario, test: UnitTest): number {
    // Use weighted strategy combination for semantic matching
    const strategies = this.config.strategies;
    const weights = this.config.weights;
    
    let totalScore = 0;
    let totalWeight = 0;

    for (const strategy of strategies) {
      const weight = weights[strategy] || 1.0;
      const score = this.applyMatchingStrategy(strategy, scenario, test);
      
      totalScore += score * weight;
      totalWeight += weight;
    }

    const semanticScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // If scenario has explicit regex rules, use the BEST score between semantic and regex
    // This gives flexibility: good regex rules enhance matching, bad ones don't override semantic
    if (scenario.matchingRules && scenario.matchingRules.length > 0) {
      const regexScore = this.regexMatch(scenario, test);
      return Math.max(semanticScore, regexScore); // Take the better score
    }
    
    return semanticScore;
  }

  /**
   * Apply specific matching strategy
   */
  private applyMatchingStrategy(
    strategy: MatchingStrategy,
    scenario: Scenario,
    test: UnitTest
  ): number {
    switch (strategy) {
      case 'exact':
        return this.exactMatch(scenario, test);
      case 'fuzzy':
        return this.fuzzyMatch(scenario, test);
      case 'semantic':
        return this.semanticMatch(scenario, test);
      case 'keyword':
        return this.keywordMatch(scenario, test);
      case 'levenshtein':
        return this.levenshteinMatch(scenario, test);
      case 'jaccard':
        return this.jaccardMatch(scenario, test);
      case 'regex':
        return this.regexMatch(scenario, test);
      default:
        return 0;
    }
  }

  /**
   * Exact matching - Check for exact string matches
   */
  private exactMatch(scenario: Scenario, test: UnitTest): number {
    if (!scenario.description || !test.description) {
      return 0;
    }
    const scenarioText = this.normalizeText(scenario.description);
    const testText = this.normalizeText(test.description);

    // Check API endpoint exact match
    if (scenario.apiEndpoint && test.description.includes(scenario.apiEndpoint)) {
      return 1.0;
    }

    // Check scenario ID in test
    if (test.description.includes(scenario.id)) {
      return 1.0;
    }

    // Exact text match
    if (scenarioText === testText) {
      return 1.0;
    }

    // Check if scenario text is substring of test
    if (testText.includes(scenarioText)) {
      return 0.9;
    }

    return 0;
  }

  /**
   * Fuzzy matching - Using token-based similarity
   */
  private fuzzyMatch(scenario: Scenario, test: UnitTest): number {
    const scenarioTokens = this.tokenize(scenario.description);
    const testTokens = this.tokenize(test.description);

    if (scenarioTokens.length === 0 || testTokens.length === 0) {
      return 0;
    }

    // Calculate token overlap
    const scenarioSet = new Set(scenarioTokens);
    const testSet = new Set(testTokens);
    
    let matchCount = 0;
    for (const token of scenarioSet) {
      if (testSet.has(token)) {
        matchCount++;
      }
    }

    const similarity = matchCount / Math.max(scenarioSet.size, testSet.size);
    
    // Boost score if API endpoint matches
    if (scenario.apiEndpoint && test.description.includes(scenario.apiEndpoint)) {
      return Math.min(1.0, similarity + 0.2);
    }

    return similarity;
  }

  /**
   * Semantic matching - Context-aware matching with synonyms
   */
  private semanticMatch(scenario: Scenario, test: UnitTest): number {
    const scenarioTokens = this.tokenize(scenario.description);
    const testTokens = this.tokenize(test.description);

    let matchScore = 0;
    let totalTokens = scenarioTokens.length;

    for (const scenarioToken of scenarioTokens) {
      // Direct match
      if (testTokens.includes(scenarioToken)) {
        matchScore += 1.0;
        continue;
      }

      // Synonym match
      const synonyms = this.config.synonyms[scenarioToken] || [];
      for (const synonym of synonyms) {
        if (testTokens.includes(synonym)) {
          matchScore += 0.8; // Synonym match gets slightly lower score
          break;
        }
      }
    }

    return totalTokens > 0 ? matchScore / totalTokens : 0;
  }

  /**
   * Keyword matching - Match based on important keywords
   */
  private keywordMatch(scenario: Scenario, test: UnitTest): number {
    const keywords = this.extractKeywords(scenario);
    const testText = this.normalizeText(test.description);

    if (keywords.length === 0) return 0;

    let matchCount = 0;
    for (const keyword of keywords) {
      if (testText.includes(keyword)) {
        matchCount++;
      }
    }

    return matchCount / keywords.length;
  }

  /**
   * Levenshtein distance-based matching
   */
  private levenshteinMatch(scenario: Scenario, test: UnitTest): number {
    const s1 = this.normalizeText(scenario.description);
    const s2 = this.normalizeText(test.description);

    const distance = this.levenshteinDistance(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);

    if (maxLen === 0) return 0;

    const similarity = 1 - (distance / maxLen);
    return Math.max(0, similarity);
  }

  /**
   * Jaccard similarity matching
   */
  private jaccardMatch(scenario: Scenario, test: UnitTest): number {
    const scenarioTokens = new Set(this.tokenize(scenario.description));
    const testTokens = new Set(this.tokenize(test.description));

    const intersection = new Set(
      [...scenarioTokens].filter(x => testTokens.has(x))
    );
    const union = new Set([...scenarioTokens, ...testTokens]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Regex-based matching using scenario matching rules
   */
  private regexMatch(scenario: Scenario, test: UnitTest): number {
    if (!scenario.matchingRules || scenario.matchingRules.length === 0) {
      return 0;
    }
    
    for (const rule of scenario.matchingRules) {
      if (rule.type === 'regex') {
        try {
          const regex = new RegExp(rule.pattern, 'i');
          // Check both test.id and test.description
          if (regex.test(test.id) || regex.test(test.description)) {
            return 1.0;
          }
        } catch (error) {
          // Invalid regex, skip
          continue;
        }
      }
    }
    return 0;
  }

  /**
   * Normalize text for matching
   */
  private normalizeText(text: string): string {
    if (!text) {
      return '';
    }
    
    let normalized = text;

    if (this.config.normalization.lowercase) {
      normalized = normalized.toLowerCase();
    }

    if (this.config.normalization.removePunctuation) {
      normalized = normalized.replace(/[^\w\s]/g, ' ');
    }

    if (this.config.normalization.removeExtraSpaces) {
      normalized = normalized.replace(/\s+/g, ' ').trim();
    }

    return normalized;
  }

  /**
   * Tokenize text into meaningful words
   */
  private tokenize(text: string): string[] {
    if (!text) {
      return [];
    }
    const normalized = this.normalizeText(text);
    let tokens = normalized.split(/\s+/).filter(t => t.length > 0);

    if (this.config.normalization.removeStopWords) {
      tokens = tokens.filter(t => !this.stopWordsSet.has(t));
    }

    if (this.config.normalization.stemming) {
      tokens = tokens.map(t => this.simpleStem(t));
    }

    return tokens;
  }

  /**
   * Extract important keywords from scenario
   */
  private extractKeywords(scenario: Scenario): string[] {
    const keywords: Set<string> = new Set();

    // Add scenario ID
    keywords.add(scenario.id.toLowerCase());

    // Add API endpoint parts
    if (scenario.apiEndpoint) {
      const endpointParts = scenario.apiEndpoint
        .split(/[\/\-_]/)
        .filter(p => p.length > 2);
      endpointParts.forEach(p => keywords.add(p.toLowerCase()));
    }

    // Add category
    if (scenario.category) {
      keywords.add(scenario.category.toLowerCase());
    }

    // Add tags
    if (scenario.tags) {
      scenario.tags.forEach(tag => keywords.add(tag.toLowerCase()));
    }

    // Extract important words from description
    const tokens = this.tokenize(scenario.description);
    const importantWords = tokens.filter(t => t.length > 4); // Words longer than 4 chars
    importantWords.slice(0, 5).forEach(w => keywords.add(w)); // Top 5 important words

    return Array.from(keywords);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Simple stemming algorithm (Porter stemmer lite)
   */
  private simpleStem(word: string): string {
    // Very basic stemming - remove common suffixes
    return word
      .replace(/ing$/, '')
      .replace(/ed$/, '')
      .replace(/s$/, '')
      .replace(/es$/, '')
      .replace(/er$/, '')
      .replace(/ly$/, '');
  }

  /**
   * Determine coverage status based on matched tests
   */
  private determineCoverageStatus(
    scenario: Scenario,
    matchedTests: MatchDetail[]
  ): CoverageStatus {
    if (matchedTests.length === 0) {
      return 'Not Covered';
    }

    // NEW: Check against acceptance criteria count if available
    if (scenario.acceptanceCriteria && scenario.acceptanceCriteria.length > 0) {
      const criteriaCount = scenario.acceptanceCriteria.length;
      const testCount = matchedTests.length;
      
      // Fully covered if we have at least as many tests as acceptance criteria
      if (testCount >= criteriaCount) {
        return 'Fully Covered';
      }
      
      // Partially covered if we have some tests but not enough
      if (testCount > 0 && testCount < criteriaCount) {
        return 'Partially Covered';
      }
    }

    // Fallback to confidence-based logic if no acceptance criteria
    // Fully covered if high confidence match exists
    if (matchedTests.some(m => m.confidence >= 0.9)) {
      return 'Fully Covered';
    }

    // Partially covered if medium confidence match exists
    if (matchedTests.some(m => m.confidence >= 0.6)) {
      return 'Partially Covered';
    }

    // Over covered if too many matches (might indicate generic tests)
    if (matchedTests.length > 5) {
      return 'Over Covered';
    }

    return 'Partially Covered';
  }

  /**
   * Calculate confidence level from match score
   */
  private calculateConfidence(matchScore: number): number {
    // Non-linear confidence calculation
    if (matchScore >= 0.95) return 1.0;
    if (matchScore >= 0.85) return 0.95;
    if (matchScore >= 0.75) return 0.85;
    if (matchScore >= 0.65) return 0.75;
    if (matchScore >= 0.55) return 0.65;
    return matchScore;
  }

  /**
   * Get the best matching strategy used
   */
  private getBestStrategy(scenario: Scenario, test: UnitTest): MatchingStrategy {
    let bestStrategy: MatchingStrategy = 'fuzzy';
    let bestScore = 0;

    for (const strategy of this.config.strategies) {
      const score = this.applyMatchingStrategy(strategy, scenario, test);
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    }

    return bestStrategy;
  }

  /**
   * Generate match explanation
   */
  private generateMatchExplanation(
    scenario: Scenario,
    test: UnitTest,
    matchScore: number
  ): string {
    const explanations: string[] = [];

    // Check for API endpoint match
    if (scenario.apiEndpoint && test.description.includes(scenario.apiEndpoint)) {
      explanations.push(`API endpoint '${scenario.apiEndpoint}' found in test`);
    }

    // Check for scenario ID match
    if (test.description.includes(scenario.id)) {
      explanations.push(`Scenario ID '${scenario.id}' referenced in test`);
    }

    // Check for keyword matches
    const keywords = this.extractKeywords(scenario);
    const matchedKeywords = keywords.filter(k => 
      this.normalizeText(test.description).includes(k)
    );
    if (matchedKeywords.length > 0) {
      explanations.push(`Matched keywords: ${matchedKeywords.slice(0, 3).join(', ')}`);
    }

    // Default explanation
    if (explanations.length === 0) {
      if (matchScore >= 0.8) {
        explanations.push('High semantic similarity between scenario and test');
      } else if (matchScore >= 0.6) {
        explanations.push('Moderate similarity detected through fuzzy matching');
      } else {
        explanations.push('Low confidence match - manual review recommended');
      }
    }

    return explanations.join('; ');
  }

  /**
   * Generate gap explanation
   */
  private generateGapExplanation(
    scenario: Scenario,
    matchedTests: MatchDetail[],
    coverageStatus: CoverageStatus
  ): string {
    if (coverageStatus === 'Fully Covered') {
      return 'Scenario is fully covered by unit tests';
    }

    if (coverageStatus === 'Partially Covered') {
      return `Scenario is partially covered (${matchedTests.length} test(s) found with medium confidence)`;
    }

    if (coverageStatus === 'Over Covered') {
      return `Scenario has ${matchedTests.length} matching tests - may indicate overly generic tests`;
    }

    // Not Covered
    return 'No unit test found for this scenario - Developer action required';
  }

  /**
   * Generate recommendations for improving coverage
   */
  private generateRecommendations(
    scenario: Scenario,
    matchedTests: MatchDetail[],
    coverageStatus: CoverageStatus
  ): string[] {
    const recommendations: string[] = [];

    if (coverageStatus === 'Not Covered') {
      recommendations.push(
        `Create unit test for: ${scenario.description}`,
        `Test should cover API: ${scenario.apiEndpoint || 'N/A'}`,
        `Priority: ${scenario.priority}, Risk: ${scenario.riskLevel}`
      );
    } else if (coverageStatus === 'Partially Covered') {
      recommendations.push(
        'Enhance existing tests to improve coverage',
        'Consider adding edge case tests',
        'Review test assertions for completeness'
      );
    } else if (coverageStatus === 'Over Covered') {
      recommendations.push(
        'Review if tests are too generic',
        'Consider consolidating duplicate tests',
        'Ensure each test has a specific focus'
      );
    }

    return recommendations;
  }

  /**
   * Get default stop words
   */
  private getDefaultStopWords(): string[] {
    return [
      'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'should', 'could', 'may', 'might', 'must',
      'can', 'of', 'to', 'in', 'for', 'on', 'at', 'by', 'with',
      'from', 'as', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'between', 'under', 'over', 'again', 'then',
      'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
      'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
      'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
      'very', 'that', 'this', 'these', 'those', 'what', 'which', 'who',
      'whom', 'whose', 'if', 'because', 'while', 'during', 'up', 'down',
      'out', 'off', 'over', 'under', 'about'
    ];
  }
}
