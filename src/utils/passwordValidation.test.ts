import { describe, it, expect } from 'vitest';
import { validatePassword, getPasswordStrength } from './passwordValidation';

describe('validatePassword', () => {
  it('rejects empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least 8 characters');
  });

  it('rejects password shorter than 8 characters', () => {
    const result = validatePassword('Abc1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least 8 characters');
  });

  it('rejects password without uppercase letter', () => {
    const result = validatePassword('abcdefg1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least one uppercase letter');
  });

  it('rejects password without lowercase letter', () => {
    const result = validatePassword('ABCDEFG1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least one lowercase letter');
  });

  it('rejects password without a number', () => {
    const result = validatePassword('Abcdefgh');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least one number');
  });

  it('accepts a strong password', () => {
    const result = validatePassword('MyStr0ng!');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts password with exactly 8 characters meeting all criteria', () => {
    const result = validatePassword('Abcdef1x');
    expect(result.isValid).toBe(true);
  });

  it('returns multiple errors for a very weak password', () => {
    const result = validatePassword('abc');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('getPasswordStrength', () => {
  it('returns weak for empty string', () => {
    expect(getPasswordStrength('')).toBe('weak');
  });

  it('returns weak for very short password', () => {
    expect(getPasswordStrength('ab')).toBe('weak');
  });

  it('returns fair for password meeting some criteria', () => {
    expect(getPasswordStrength('abcdefgh')).toBe('fair');
  });

  it('returns strong for password meeting all criteria', () => {
    expect(getPasswordStrength('Abcdefg1')).toBe('strong');
  });
});
