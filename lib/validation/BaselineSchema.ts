/**
 * Baseline YAML Schema Validator
 * Validates structure and format of baseline test case files
 */

export interface BaselineSchema {
  service?: string;
  api_mapping?: { [key: string]: string }; // Maps unique keys to actual endpoints
  [apiEndpoint: string]: {
    happy_case?: string[];
    edge_case?: string[];
    error_case?: string[];
    security?: string[];
  } | string | undefined | { [key: string]: string };
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
    
    // Get API mapping if present (new format)
    const apiMapping = data.api_mapping || {};
    
    // Validate each API endpoint
    for (const [key, value] of Object.entries(data)) {
      if (key === 'service' || key === 'api_mapping') continue; // Skip metadata
      
      // Check if API key looks valid (either old format or new unique key format)
      const isOldFormat = this.isValidAPIKey(key);
      const isNewFormat = apiMapping.hasOwnProperty(key);
      
      if (!isOldFormat && !isNewFormat) {
        errors.push(`Invalid API format: "${key}" - should be "METHOD /path" (e.g., "GET /v1/customers") or a unique key defined in api_mapping`);
      }
      
      // Allow null/undefined values - means 0 scenarios (valid use case)
      if (value === null || value === undefined) {
        continue; // Skip validation, this is valid
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
      
      // Allow empty categories - means 0 scenarios (valid use case)
      // Don't error, just skip
    }
    
    // Validate api_mapping if present
    if (data.api_mapping) {
      if (typeof data.api_mapping !== 'object') {
        errors.push('api_mapping must be an object');
      } else {
        for (const [key, value] of Object.entries(data.api_mapping)) {
          if (typeof value !== 'string') {
            errors.push(`api_mapping["${key}"] must be a string (API endpoint)`);
          } else if (!this.isValidAPIKey(value as string)) {
            errors.push(`api_mapping["${key}"] = "${value}" is not a valid API format (should be "METHOD /path")`);
          }
        }
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
