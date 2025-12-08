/**
 * Test Parser Factory - Creates appropriate parser based on language/framework
 */

import { SupportedLanguage, SupportedFramework, TestParser } from '../types';
import { TypeScriptTestParser } from '../parsers/TypeScriptTestParser';
import { JavaTestParser } from '../parsers/JavaTestParser';
import { PythonTestParser } from '../parsers/PythonTestParser';
import { GoTestParser } from '../parsers/GoTestParser';

export class TestParserFactory {
  private parsers: TestParser[] = [];

  constructor() {
    // Register all available parsers
    this.registerParser(new TypeScriptTestParser());
    this.registerParser(new JavaTestParser());
    this.registerParser(new PythonTestParser());
    this.registerParser(new GoTestParser());
  }

  /**
   * Register a custom parser
   */
  registerParser(parser: TestParser): void {
    this.parsers.push(parser);
  }

  /**
   * Get appropriate parser for language/framework combination
   */
  getParser(language: SupportedLanguage, framework: SupportedFramework): TestParser {
    const parser = this.parsers.find(p => p.canParse(language, framework));
    
    if (!parser) {
      throw new Error(
        `No parser available for language: ${language}, framework: ${framework}`
      );
    }

    return parser;
  }

  /**
   * Get all registered parsers
   */
  getAllParsers(): TestParser[] {
    return [...this.parsers];
  }

  /**
   * Check if a language/framework combination is supported
   */
  isSupported(language: SupportedLanguage, framework: SupportedFramework): boolean {
    return this.parsers.some(p => p.canParse(language, framework));
  }
}
