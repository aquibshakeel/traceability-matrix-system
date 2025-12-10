/**
 * AI-Driven Test Coverage System
 * Complete AI-powered test coverage analysis with advanced features
 * 
 * @package ai-test-coverage
 * @version 4.0.0
 */

// Core Analysis Modules
export { EnhancedCoverageAnalyzer } from './core/EnhancedCoverageAnalyzer';
export { AITestCaseGenerator } from './core/AITestCaseGenerator';
export { ServiceManager } from './core/ServiceManager';

// Git & Change Detection
export { GitChangeDetector } from './core/GitChangeDetector';
export { HistoryManager } from './core/HistoryManager';

// Reporting
export { ReportGenerator } from './core/ReportGenerator';

// API Discovery
export { SwaggerParser } from './core/SwaggerParser';
export { APIScanner } from './core/APIScanner';

// Test Parsing
export { TestParserFactory } from './core/TestParserFactory';
export { TypeScriptTestParser } from './parsers/TypeScriptTestParser';
export { JavaTestParser } from './parsers/JavaTestParser';
export { PythonTestParser } from './parsers/PythonTestParser';
export { GoTestParser } from './parsers/GoTestParser';

// Types
export * from './types';
