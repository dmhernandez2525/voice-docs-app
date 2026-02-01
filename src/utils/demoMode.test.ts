/**
 * Demo Mode Utilities Tests
 *
 * Note: Testing import.meta.env is tricky because Vite replaces it at build time.
 * These tests verify the logic of the utility functions by testing the actual
 * runtime behavior. The functions are tested by checking their return values
 * match the current environment configuration.
 */

import { describe, it, expect } from 'vitest';
import { isDemoModeEnabled, getDemoModeStatus } from './demoMode';

describe('demoMode utilities', () => {
  describe('isDemoModeEnabled', () => {
    it('should return a boolean value', () => {
      const result = isDemoModeEnabled();
      expect(typeof result).toBe('boolean');
    });

    it('should be consistent across multiple calls', () => {
      const result1 = isDemoModeEnabled();
      const result2 = isDemoModeEnabled();
      expect(result1).toBe(result2);
    });
  });

  describe('getDemoModeStatus', () => {
    it('should return an object with enabled and envValue properties', () => {
      const status = getDemoModeStatus();

      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('envValue');
      expect(typeof status.enabled).toBe('boolean');
    });

    it('should have enabled match isDemoModeEnabled result', () => {
      const status = getDemoModeStatus();
      const isEnabled = isDemoModeEnabled();

      expect(status.enabled).toBe(isEnabled);
    });

    it('should have envValue match the actual env variable', () => {
      const status = getDemoModeStatus();
      expect(status.envValue).toBe(import.meta.env.VITE_DEMO_MODE);
    });
  });

  describe('logic verification', () => {
    it('isDemoModeEnabled should return true only when env is "true" (case insensitive)', () => {
      // This test documents the expected behavior
      // The function checks: demoMode?.toLowerCase() === 'true'
      const envValue = import.meta.env.VITE_DEMO_MODE;
      const expected = envValue?.toLowerCase() === 'true';
      expect(isDemoModeEnabled()).toBe(expected);
    });
  });
});
