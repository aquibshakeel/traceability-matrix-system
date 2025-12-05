/**
 * Allure Helper Utility
 * Provides clean wrappers for Allure reporting functionality
 */

import { allure } from 'allure-mocha/runtime';

export interface TestMetadata {
  testId: string;
  scenarioId: string;
  epic: string;
  feature: string;
  story: string;
  severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
  tags?: string[];
  owner?: string;
  description?: string;
}

/**
 * Set test metadata at the beginning of a test
 */
export function setTestMetadata(metadata: TestMetadata): void {
  allure.epic(metadata.epic);
  allure.feature(metadata.feature);
  allure.story(metadata.story);
  
  if (metadata.severity) {
    allure.severity(metadata.severity);
  }
  
  if (metadata.tags) {
    metadata.tags.forEach(tag => allure.tag(tag));
  }
  
  if (metadata.owner) {
    allure.owner(metadata.owner);
  }
  
  if (metadata.description) {
    allure.description(metadata.description);
  }
}

/**
 * Simplified step execution - only logs to Allure, keeps code clean
 */
export async function step<T>(name: string, body: () => T | Promise<T>): Promise<T> {
  return allure.step(name, body);
}

/**
 * Optional: attach data only when needed for debugging
 */
export function attach(name: string, content: string, type: string = 'application/json'): void {
  allure.attachment(name, content, type);
}

/**
 * Optional: add parameter for reporting
 */
export function param(name: string, value: string | number): void {
  allure.parameter(name, value);
}
