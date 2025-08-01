/**
 * Jest Test Setup for PPM Backend
 * Global test configuration and utilities
 */

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in tests
global.console = {
  ...console,
  // Uncomment to silence logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test utilities interface
interface TestUtils {
  createMockRequest: (overrides?: any) => any;
  createMockResponse: () => any;
  createMockNext: () => jest.Mock;
}

// Mock utilities for Express req/res
(global as any).testUtils = {
  createMockRequest: (overrides = {}) => ({
    body: {},
    query: {},
    params: {},
    headers: {},
    user: null,
    ...overrides
  }),
  
  createMockResponse: () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
  },
  
  createMockNext: () => jest.fn()
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});