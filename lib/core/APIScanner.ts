/**
 * API Scanner
 * Automatically scans controller files to discover APIs
 * Works independently of scenarios - scans actual code
 */

import * as fs from 'fs';
import * as path from 'path';
import { ServiceConfig } from '../types';

export interface DiscoveredAPI {
  endpoint: string;
  method: string;
  controller: string;
  lineNumber: number;
  serviceName: string;
  hasScenario: boolean;
  hasTest: boolean;
}

export class APIScanner {
  /**
   * Scan a service for API endpoints by reading controller files
   */
  async scanAPIs(service: ServiceConfig): Promise<DiscoveredAPI[]> {
    const apis: DiscoveredAPI[] = [];

    try {
      const controllerPath = path.join(service.path, 'src/main/java');
      
      if (!fs.existsSync(controllerPath)) {
        console.warn(`  ⚠️ Controller directory not found: ${controllerPath}`);
        return apis;
      }

      const controllerFiles = this.findControllerFiles(controllerPath);
      console.log(`  📡 Scanning ${controllerFiles.length} controller file(s) for APIs...`);

      for (const file of controllerFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const extractedAPIs = this.parseAPIsFromController(content, file, service.name);
        apis.push(...extractedAPIs);
      }

      console.log(`  ✓ Discovered ${apis.length} API endpoint(s)`);
    } catch (error) {
      console.warn(`  ⚠️ Error scanning APIs: ${error instanceof Error ? error.message : String(error)}`);
    }

    return apis;
  }

  /**
   * Find all controller files recursively
   */
  private findControllerFiles(dir: string): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...this.findControllerFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('Controller.java')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Parse API endpoints from controller content
   */
  private parseAPIsFromController(
    content: string, 
    file: string, 
    serviceName: string
  ): DiscoveredAPI[] {
    const apis: DiscoveredAPI[] = [];
    const lines = content.split('\n');

    // Extract base request mapping from controller class
    let baseMapping = '';
    for (const line of lines) {
      const classMapping = line.match(/@RequestMapping\s*\(\s*["']([^"']+)["']/);
      if (classMapping) {
        baseMapping = classMapping[1];
        break;
      }
    }

    // Patterns for Spring Boot REST annotations
    const mappingPatterns = [
      { regex: /@GetMapping\s*\(\s*["']([^"']+)["']/, method: 'GET', hasPath: true },
      { regex: /@GetMapping\s*(?:\(\s*\))?(?:\s|$)/, method: 'GET', hasPath: false }, // @GetMapping or @GetMapping()
      { regex: /@PostMapping\s*\(\s*["']([^"']+)["']/, method: 'POST', hasPath: true },
      { regex: /@PostMapping\s*(?:\(\s*\))?(?:\s|$)/, method: 'POST', hasPath: false },
      { regex: /@PutMapping\s*\(\s*["']([^"']+)["']/, method: 'PUT', hasPath: true },
      { regex: /@PutMapping\s*(?:\(\s*\))?(?:\s|$)/, method: 'PUT', hasPath: false },
      { regex: /@DeleteMapping\s*\(\s*["']([^"']+)["']/, method: 'DELETE', hasPath: true },
      { regex: /@DeleteMapping\s*(?:\(\s*\))?(?:\s|$)/, method: 'DELETE', hasPath: false },
      { regex: /@PatchMapping\s*\(\s*["']([^"']+)["']/, method: 'PATCH', hasPath: true },
      { regex: /@PatchMapping\s*(?:\(\s*\))?(?:\s|$)/, method: 'PATCH', hasPath: false },
      { regex: /@RequestMapping\s*\(.*value\s*=\s*["']([^"']+)["'].*method\s*=\s*RequestMethod\.(\w+)/, method: null, hasPath: true }
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of mappingPatterns) {
        const match = line.match(pattern.regex);
        
        if (match) {
          const endpoint = pattern.hasPath ? match[1] : ''; // Empty string for no path
          const method = pattern.method || (match[2] || 'GET').toUpperCase();
          const fullEndpoint = baseMapping ? `${baseMapping}${endpoint}` : (endpoint || baseMapping);

          apis.push({
            endpoint: fullEndpoint,
            method,
            controller: path.basename(file),
            lineNumber: i + 1,
            serviceName,
            hasScenario: false,
            hasTest: false
          });
        }
      }
    }

    return apis;
  }

  /**
   * Mark an API as having a scenario
   */
  markAPIWithScenario(apis: DiscoveredAPI[], scenarioEndpoint: string): void {
    for (const api of apis) {
      if (api.endpoint.toLowerCase().includes(scenarioEndpoint.toLowerCase()) ||
          scenarioEndpoint.toLowerCase().includes(api.endpoint.toLowerCase())) {
        api.hasScenario = true;
      }
    }
  }

  /**
   * Mark APIs as having tests by checking all test descriptions
   */
  markAPIsWithTests(apis: DiscoveredAPI[], tests: any[]): void {
    for (const api of apis) {
      const endpoint = api.endpoint.toLowerCase();
      const method = api.method.toLowerCase();
      
      // Check if this specific API endpoint has matching tests
      const hasTest = tests.some(test => {
        const testDesc = (test.description || '').toLowerCase();
        const testFile = (test.file || '').toLowerCase();
        const testContent = testDesc + ' ' + testFile;
        
        // Match by HTTP method + endpoint pattern
        // Special handling for parameterized endpoints like {id}
        if (endpoint.includes('{id}') || endpoint.includes('/{id}')) {
          // For endpoints with {id}, look for "by id" or "byid" in test descriptions
          const methodKeywords = this.getMethodKeywords(method);
          const hasMethodMatch = methodKeywords.some(keyword => testContent.includes(keyword));
          const hasByIdMatch = testContent.includes('by id') || testContent.includes('byid') || testContent.includes('{id}');
          
          return hasMethodMatch && hasByIdMatch;
        } else {
          // For endpoints without parameters
          // Extract meaningful parts (e.g., "customers", "register", "login")
          const endpointParts = endpoint.split('/').filter(p => p && !p.startsWith('{'));
          
          // Check if test matches this specific endpoint
          const methodKeywords = this.getMethodKeywords(method);
          const hasMethodMatch = methodKeywords.some(keyword => testContent.includes(keyword));
          
          if (!hasMethodMatch) return false;
          
          // Make sure test doesn't reference parameterized version
          // e.g., "getCustomers" should NOT match tests for "getCustomerById"
          const hasParameterReference = testContent.includes('by id') || testContent.includes('byid') || testContent.includes('{id}');
          if (hasParameterReference) return false;
          
          // Check if endpoint parts are mentioned in test
          return endpointParts.some(part => testContent.includes(part));
        }
      });
      
      api.hasTest = hasTest;
    }
  }
  
  /**
   * Get keywords associated with HTTP methods for test matching
   */
  private getMethodKeywords(method: string): string[] {
    const keywords: { [key: string]: string[] } = {
      'get': ['get', 'fetch', 'retrieve', 'find', 'read', 'load', 'show', 'view'],
      'post': ['post', 'create', 'add', 'insert', 'register', 'save', 'new'],
      'put': ['put', 'update', 'edit', 'modify', 'change', 'replace'],
      'delete': ['delete', 'remove', 'destroy', 'erase'],
      'patch': ['patch', 'update', 'modify']
    };
    
    return keywords[method.toLowerCase()] || [method.toLowerCase()];
  }

  /**
   * Get orphan APIs (APIs without scenarios AND without tests)
   */
  getOrphanAPIs(apis: DiscoveredAPI[]): DiscoveredAPI[] {
    return apis.filter(api => !api.hasScenario && !api.hasTest);
  }

  /**
   * Get APIs without scenarios
   */
  getAPIsWithoutScenarios(apis: DiscoveredAPI[]): DiscoveredAPI[] {
    return apis.filter(api => !api.hasScenario);
  }

  /**
   * Get APIs without tests
   */
  getAPIsWithoutTests(apis: DiscoveredAPI[]): DiscoveredAPI[] {
    return apis.filter(api => !api.hasTest);
  }
}
