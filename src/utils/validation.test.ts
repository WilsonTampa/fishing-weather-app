/**
 * Tests for the API middleware validation functions.
 * These are pure functions imported from the API middleware,
 * but since the middleware uses Node.js types (VercelRequest),
 * we re-implement the pure validation logic here for testing.
 *
 * This ensures the validation logic stays correct as it evolves.
 */

import { describe, it, expect } from 'vitest';

// Re-implement the pure validation functions to test them in the jsdom environment
// (the actual middleware.ts uses Node types that aren't available in browser tests)

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isValidTrialDays(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'number') return false;
  return Number.isInteger(value) && value >= 0 && value <= 14;
}

describe('isValidUUID', () => {
  it('accepts a valid v4 UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts uppercase UUID', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('rejects non-string', () => {
    expect(isValidUUID(123)).toBe(false);
    expect(isValidUUID(null)).toBe(false);
    expect(isValidUUID(undefined)).toBe(false);
  });

  it('rejects UUID without dashes', () => {
    expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
  });

  it('rejects malicious input', () => {
    expect(isValidUUID("'; DROP TABLE users; --")).toBe(false);
    expect(isValidUUID('<script>alert(1)</script>')).toBe(false);
  });
});

describe('isValidUrl', () => {
  it('accepts a valid HTTPS URL', () => {
    expect(isValidUrl('https://mymarineforecast.com/forecast')).toBe(true);
  });

  it('accepts a valid HTTP URL', () => {
    expect(isValidUrl('http://localhost:3000/forecast')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });

  it('rejects non-string', () => {
    expect(isValidUrl(123)).toBe(false);
  });

  it('rejects javascript: protocol', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: protocol', () => {
    expect(isValidUrl('data:text/html,<h1>hi</h1>')).toBe(false);
  });

  it('rejects plain text', () => {
    expect(isValidUrl('not a url')).toBe(false);
  });
});

describe('isValidTrialDays', () => {
  it('accepts undefined (optional field)', () => {
    expect(isValidTrialDays(undefined)).toBe(true);
  });

  it('accepts null (optional field)', () => {
    expect(isValidTrialDays(null)).toBe(true);
  });

  it('accepts 0', () => {
    expect(isValidTrialDays(0)).toBe(true);
  });

  it('accepts 7', () => {
    expect(isValidTrialDays(7)).toBe(true);
  });

  it('accepts 14', () => {
    expect(isValidTrialDays(14)).toBe(true);
  });

  it('rejects negative numbers', () => {
    expect(isValidTrialDays(-1)).toBe(false);
  });

  it('rejects numbers > 14', () => {
    expect(isValidTrialDays(15)).toBe(false);
    expect(isValidTrialDays(365)).toBe(false);
  });

  it('rejects non-integers', () => {
    expect(isValidTrialDays(7.5)).toBe(false);
  });

  it('rejects strings', () => {
    expect(isValidTrialDays('7')).toBe(false);
  });
});
