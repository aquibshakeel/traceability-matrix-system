/**
 * Unit-Test-Tracer - Universal Validator Library
 * Main entry point for the validation system
 * 
 * @package unit-test-tracer
 * @version 1.0.0
 */

export { UniversalValidator } from './core/UniversalValidator';
export { ScenarioLoader } from './core/ScenarioLoader';
export { TestParserFactory } from './core/TestParserFactory';
export { SemanticMatcher } from './core/SemanticMatcher';
export { AIBasedMatcher } from './core/AIBasedMatcher';
export { ReportGenerator } from './core/ReportGenerator';

// Types
export * from './types';

// Parsers
export { TypeScriptTestParser } from './parsers/TypeScriptTestParser';
export { JavaTestParser } from './parsers/JavaTestParser';
export { PythonTestParser } from './parsers/PythonTestParser';
export { GoTestParser } from './parsers/GoTestParser';

// Re-export for convenience
export { ValidationResult, ValidationConfig, Scenario, UnitTest } from './types';
