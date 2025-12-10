/**
 * Baseline YAML Schema Validator
 * Validates structure and format of baseline test case files
 */

export interface BaselineSchema {
  service?: string;
  [apiEndpoint: string]: {
    happy_case?: string[];
    edge_case?: string[];
    error_case?: string[];
    security?: string[];
  } | string | undefined;
}

export class BaselineValidator {
  private validCategories = ['happy_case', 'edge_case', 'error_case', 'security'];
  
  /**
   * Validate baseline YAML structure
   */
  validate(data: any, filePath: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check data exists and is object
    if (!data || typeof data !== 'object') {
      errors.push('Baseline must be a valid YAML object');
      return { valid: false, errors };
    }
    
    // Validate each API endpoint
    for (const [key, value] of Object.entries(data)) {
      if (key === 'service') continue; // Skip service metadata
      
      // Check if API key looks valid
      if (!this.isValidAPIKey(key)) {
        errors.push(`Invalid API format: "${key}" - should be "METHOD /path" (e.g., "GET /v1/customers")`);
      }
      
      // Check value structure
      if (value === null || value === undefined) {
        errors.push(`API "${key}" has no content - should have test categories`);
        continue;
      }
      
      if (typeof value !== 'object') {
        errors.push(`API "${key}" must be an object with test categories, got ${typeof value}`);
        continue;
      }
      
      // Validate categories
      const categories = Object.keys(value as object);
      const invalidCategories = categories.filter(
        cat => !this.validCategories.includes(cat)
      );
      
      if (invalidCategories.length > 0) {
        errors.push(
          `API "${key}" has invalid categories: ${invalidCategories.join(', ')}. ` +
          `Valid categories: ${this.validCategories.join(', ')}`
        );
      }
      
      // Check that each category has an array of scenarios
      for (const category of categories) {
        const scenarios = (value as any)[category];
        if (!Array.isArray(scenarios)) {
          errors.push(
            `API "${key}" category "${category}" must be an array of scenario strings`
          );
        } else {
          // Validate each scenario is a non-empty string
          scenarios.forEach((scenario, index) => {
            if (typeof scenario !== 'string') {
              errors.push(
                `API "${key}" category "${category}" scenario ${index + 1} must be a string`
              );
            } else if (scenario.trim().length === 0) {
              errors.push(
                `API "${key}" category "${category}" scenario ${index + 1} cannot be empty`
              );
            }
          });
        }
      }
      
      // Warn if no categories defined
      if (categories.length === 0) {
        errors.push(`API "${key}" has no test categories - should have at least one`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Check if API key format is valid
   */
  private isValidAPIKey(key: string): boolean {
    // Should match: "METHOD /path" pattern
    const methodPattern = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+\//;
    return methodPattern.test(key);
  }
}
