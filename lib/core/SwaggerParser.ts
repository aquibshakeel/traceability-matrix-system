/**
 * Swagger/OpenAPI Parser
 * 
 * Parses Swagger 2.0 and OpenAPI 3.x specifications
 * Extracts API endpoints, schemas, validations, and metadata
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface SwaggerAPI {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: SwaggerParameter[];
  requestBody?: SwaggerRequestBody;
  responses?: Record<string, SwaggerResponse>;
  security?: any[];
  deprecated?: boolean;
}

export interface SwaggerParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: any;
  type?: string;
  format?: string;
  enum?: any[];
}

export interface SwaggerRequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, { schema: any }>;
}

export interface SwaggerResponse {
  description: string;
  content?: Record<string, { schema: any }>;
  headers?: Record<string, any>;
}

export interface SwaggerSpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{ url: string; description?: string }>;
  basePath?: string;
  host?: string;
  paths: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  definitions?: Record<string, any>;
}

export class SwaggerParser {
  /**
   * Parse Swagger/OpenAPI file
   */
  static parseFile(filePath: string): SwaggerSpec {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.json') {
      return JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      return yaml.load(content) as SwaggerSpec;
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Extract all APIs from Swagger spec
   */
  static extractAPIs(spec: SwaggerSpec): SwaggerAPI[] {
    const apis: SwaggerAPI[] = [];

    for (const [pathKey, pathItem] of Object.entries(spec.paths || {})) {
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

      for (const method of methods) {
        const operation = pathItem[method];
        if (!operation) continue;

        apis.push({
          path: pathKey,
          method: method.toUpperCase(),
          operationId: operation.operationId,
          summary: operation.summary,
          description: operation.description,
          tags: operation.tags,
          parameters: this.parseParameters(operation.parameters || []),
          requestBody: this.parseRequestBody(operation.requestBody),
          responses: operation.responses,
          security: operation.security,
          deprecated: operation.deprecated
        });
      }
    }

    return apis;
  }

  /**
   * Parse parameters
   */
  private static parseParameters(params: any[]): SwaggerParameter[] {
    return params.map(p => ({
      name: p.name,
      in: p.in,
      description: p.description,
      required: p.required,
      schema: p.schema,
      type: p.type,
      format: p.format,
      enum: p.enum
    }));
  }

  /**
   * Parse request body
   */
  private static parseRequestBody(body: any): SwaggerRequestBody | undefined {
    if (!body) return undefined;

    return {
      description: body.description,
      required: body.required,
      content: body.content
    };
  }

  /**
   * Find Swagger files in a directory
   */
  static findSwaggerFiles(directory: string): string[] {
    const files: string[] = [];
    
    const searchPatterns = [
      'swagger.json',
      'swagger.yaml',
      'swagger.yml',
      'openapi.json',
      'openapi.yaml',
      'openapi.yml',
      'api-docs.json',
      'api-docs.yaml'
    ];

    for (const pattern of searchPatterns) {
      const filePath = path.join(directory, pattern);
      if (fs.existsSync(filePath)) {
        files.push(filePath);
      }
    }

    // Also check in common subdirectories
    const subdirs = ['docs', 'api', 'spec', 'specs', 'swagger', 'openapi'];
    for (const subdir of subdirs) {
      const subdirPath = path.join(directory, subdir);
      if (fs.existsSync(subdirPath)) {
        for (const pattern of searchPatterns) {
          const filePath = path.join(subdirPath, pattern);
          if (fs.existsSync(filePath)) {
            files.push(filePath);
          }
        }
      }
    }

    return files;
  }

  /**
   * Generate summary of API
   */
  static generateAPISummary(api: SwaggerAPI): string {
    let summary = `${api.method} ${api.path}`;
    if (api.summary) {
      summary += ` - ${api.summary}`;
    }
    return summary;
  }

  /**
   * Get request schema as string
   */
  static getRequestSchema(api: SwaggerAPI): string {
    if (!api.requestBody?.content) return 'No request body';

    const contentTypes = Object.keys(api.requestBody.content);
    if (contentTypes.length === 0) return 'No request body';

    const firstType = contentTypes[0];
    const schema = api.requestBody.content[firstType].schema;

    return JSON.stringify(schema, null, 2);
  }

  /**
   * Get response schema as string
   */
  static getResponseSchema(api: SwaggerAPI, statusCode: string = '200'): string {
    if (!api.responses) return 'No response schema';

    const response = api.responses[statusCode] || api.responses['default'];
    if (!response) return 'No response schema';

    if (!response.content) return response.description || 'No content';

    const contentTypes = Object.keys(response.content);
    if (contentTypes.length === 0) return response.description || 'No content';

    const firstType = contentTypes[0];
    const schema = response.content[firstType].schema;

    return JSON.stringify(schema, null, 2);
  }
}
