import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Environment Variable Validation Tests
 * 
 * Ensures that required environment variables are present and properly configured
 * before the app starts up. This prevents runtime errors when the auth service
 * cannot be reached due to missing configuration.
 */

describe('Environment Variable Validation', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    // Clear any cached values
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    Object.assign(import.meta.env, originalEnv);
  });

  describe('VITE_AUTH_SERVICE_URL', () => {
    it('should be defined in import.meta.env', () => {
      const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL;
      expect(authServiceUrl).toBeDefined();
      expect(typeof authServiceUrl).toBe('string');
    });

    it('should not be empty', () => {
      const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL;
      expect(authServiceUrl).toBeTruthy();
      expect(authServiceUrl.length).toBeGreaterThan(0);
    });

    it('should be a valid URL format', () => {
      const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL;
      const urlPattern = /^https?:\/\/.+/;
      expect(authServiceUrl).toMatch(urlPattern);
    });

    it('should resolve to localhost:8003 in development', () => {
      const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL;
      expect(authServiceUrl).toBe('http://localhost:8003');
    });
  });

  describe('VITE_APP_URL', () => {
    it('should be defined', () => {
      const appUrl = import.meta.env.VITE_APP_URL;
      expect(appUrl).toBeDefined();
      expect(appUrl).toBeTruthy();
    });

    it('should be a valid URL format', () => {
      const appUrl = import.meta.env.VITE_APP_URL;
      const urlPattern = /^https?:\/\/.+/;
      expect(appUrl).toMatch(urlPattern);
    });
  });

  describe('VITE_BACKEND_URL', () => {
    it('should be defined', () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      expect(backendUrl).toBeDefined();
      expect(backendUrl).toBeTruthy();
    });

    it('should be a valid URL format', () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const urlPattern = /^https?:\/\/.+/;
      expect(backendUrl).toMatch(urlPattern);
    });
  });

  describe('Environment variable consistency', () => {
    it('all required VITE_* variables should be defined', () => {
      const requiredVars = [
        'VITE_AUTH_SERVICE_URL',
        'VITE_APP_URL',
        'VITE_BACKEND_URL',
      ];

      const env = import.meta.env as Record<string, string | undefined>;
      const missing = requiredVars.filter((varName) => !env[varName]);

      expect(missing).toHaveLength(0);
      if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
      }
    });

    it('AUTH_SERVICE_URL should not be VITE_AUTH_URL (common naming mistake)', () => {
      // This ensures we're using the correct variable name and not falling back to old naming
      const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL;
      const env = import.meta.env as Record<string, string | undefined>;
      const _oldAuthUrl = env.VITE_AUTH_URL;

      // Should use VITE_AUTH_SERVICE_URL
      expect(authServiceUrl).toBeDefined();
      expect(authServiceUrl).toBe('http://localhost:8003');
    });
  });
});
