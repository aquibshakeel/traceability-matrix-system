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
      { regex: /@GetMapping\s*\(\s*["']([^"']+)["']/, method: 'GET' },
      { regex: /@PostMapping\s*\(\s*["']([^"']+)["']/, method: 'POST' },
      { regex: /@PutMapping\s*\(\s*["']([^"']+)["']/, method: 'PUT' },
      { regex: /@DeleteMapping\s*\(\s*["']([^"']+)["']/, method: 'DELETE' },
      { regex: /@PatchMapping\s*\(\s*["']([^"']+)["']/, method: 'PATCH' },
      { regex: /@RequestMapping\s*\(.*value\s*=\s*["']([^"']+)["'].*method\s*=\s*RequestMethod\.(\w+)/, method: null }
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of mappingPatterns) {
        const match = line.match(pattern.regex);
        
        if (match) {
          const endpoint = match[1];
          const method = pattern.method || (match[2] || 'GET').toUpperCase();
          const fullEndpoint = baseMapping ? `${baseMapping}${endpoint}` : endpoint;

          apis.push({
            endpoint: fullEndpoint,
            method,
            controller: path.basename(file),
            lineNumber: i + 1,
            serviceName,
            hasScenario: false, // Will be updated during validation
            hasTest: false      // Will be updated during validation
          });
        }
      }
    }

    return apis;
  }

  /**
   * Check if an API has a corresponding scenario
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
   * Check if an API has a corresponding test
   */
  markAPIWithTest(apis: DiscoveredAPI[], testDescription: string): void {
    for (const api of apis) {
      const endpoint = api.endpoint.toLowerCase().replace(/\//g, '').replace(/-/g, '');
      const testDesc = testDescription.toLowerCase().replace(/\s/g, '').replace(/-/g, '');
      
      if (testDesc.includes(endpoint) || endpoint.includes(testDesc)) {
        api.hasTest = true;
      }
    }
  }

  /**
   * Get orphan APIs (APIs without scenarios or tests)
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
