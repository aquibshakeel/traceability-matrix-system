/**
 * Test Setup
 * Global test configuration and utilities
 */

// Mock console to reduce test noise (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};
