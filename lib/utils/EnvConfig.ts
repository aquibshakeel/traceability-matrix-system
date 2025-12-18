/**
 * Environment Configuration Helper
 * 
 * Provides centralized access to environment variables for configuration overrides.
 * Supports overriding config.json values via environment variables.
 * 
 * Priority: ENV Variable > Config File > Default
 */

export class EnvConfig {
  /**
   * Get AI provider override from environment
   * ENV: AI_PROVIDER=anthropic|openai|gpt|claude
   */
  static getAIProvider(): string | undefined {
    return process.env.AI_PROVIDER;
  }

  /**
   * Get AI model override from environment
   * ENV: AI_MODEL=auto|claude-sonnet-4|gpt-4-turbo|...
   */
  static getAIModel(): string | undefined {
    return process.env.AI_MODEL;
  }

  /**
   * Get AI temperature override from environment
   * ENV: AI_TEMPERATURE=0.0-1.0
   */
  static getAITemperature(): number | undefined {
    const temp = process.env.AI_TEMPERATURE;
    return temp ? parseFloat(temp) : undefined;
  }

  /**
   * Get AI max tokens override from environment
   * ENV: AI_MAX_TOKENS=1000-8000
   */
  static getAIMaxTokens(): number | undefined {
    const tokens = process.env.AI_MAX_TOKENS;
    return tokens ? parseInt(tokens, 10) : undefined;
  }

  /**
   * Get verbose logging flag from environment
   * ENV: VERBOSE=true|false
   */
  static isVerbose(): boolean {
    return process.env.VERBOSE === 'true';
  }

  /**
   * Get auto-open reports flag from environment
   * ENV: AUTO_OPEN_REPORTS=true|false
   */
  static shouldAutoOpenReports(): boolean | undefined {
    const value = process.env.AUTO_OPEN_REPORTS;
    return value ? value === 'true' : undefined;
  }

  /**
   * Get health check timeout override from environment
   * ENV: HEALTH_CHECK_TIMEOUT=5000 (milliseconds)
   */
  static getHealthCheckTimeout(): number | undefined {
    const timeout = process.env.HEALTH_CHECK_TIMEOUT;
    return timeout ? parseInt(timeout, 10) : undefined;
  }

  /**
   * Get skip git detection flag from environment
   * ENV: SKIP_GIT_DETECTION=true|false
   */
  static shouldSkipGitDetection(): boolean {
    return process.env.SKIP_GIT_DETECTION === 'true';
  }

  /**
   * Get service path override from environment (absolute path to service repository)
   * ENV: SERVICE_PATH=/absolute/path/to/service-repo
   * This allows analyzing services from external repositories
   */
  static getServicePath(): string | undefined {
    return process.env.SERVICE_PATH;
  }

  /**
   * Get test scenario path override from environment (absolute path to baseline scenarios)
   * ENV: TEST_SCENARIO_PATH=/absolute/path/to/test-scenarios
   * This allows using QA scenarios from external repositories
   */
  static getTestScenarioPath(): string | undefined {
    return process.env.TEST_SCENARIO_PATH;
  }

  /**
   * Get services root directory from environment
   * ENV: SERVICES_ROOT=/path/to/services
   * Alternative to SERVICE_PATH for multi-service setups
   */
  static getServicesRoot(): string | undefined {
    return process.env.SERVICES_ROOT;
  }

  /**
   * Get test cases root directory from environment
   * ENV: TEST_CASES_ROOT=/path/to/test-cases
   * Alternative to TEST_SCENARIO_PATH for complete test-cases directory
   */
  static getTestCasesRoot(): string | undefined {
    return process.env.TEST_CASES_ROOT;
  }

  /**
   * Get all AI-related environment overrides
   * Returns object with only defined overrides
   */
  static getAIOverrides(): {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } {
    const overrides: any = {};
    
    const provider = this.getAIProvider();
    if (provider) overrides.provider = provider;
    
    const model = this.getAIModel();
    if (model) overrides.model = model;
    
    const temperature = this.getAITemperature();
    if (temperature !== undefined) overrides.temperature = temperature;
    
    const maxTokens = this.getAIMaxTokens();
    if (maxTokens !== undefined) overrides.maxTokens = maxTokens;
    
    return overrides;
  }

  /**
   * Log environment overrides (for debugging)
   */
  static logOverrides(): void {
    const overrides = this.getAIOverrides();
    if (Object.keys(overrides).length > 0) {
      console.log('🔧 Environment Overrides:');
      for (const [key, value] of Object.entries(overrides)) {
        console.log(`   ${key}: ${value}`);
      }
    }
  }
}
