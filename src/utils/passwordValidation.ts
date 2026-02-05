/**
 * Password strength validation for signup forms.
 *
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('At least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Returns a simple strength indicator for UI display.
 */
export function getPasswordStrength(password: string): 'weak' | 'fair' | 'strong' {
  if (!password) return 'weak';

  const { errors } = validatePassword(password);
  const passed = 4 - errors.length;

  if (passed <= 1) return 'weak';
  if (passed <= 3) return 'fair';
  return 'strong';
}
