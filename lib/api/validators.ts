/**
 * API Validators
 * Senior-level validation functions with proper error handling
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

export interface ValidatorResult<T> {
  valid: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string>;
}

export class ApiValidator {
  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidatorResult<string> {
    if (!email || typeof email !== 'string') {
      return {
        valid: false,
        error: 'Email is required',
      };
    }

    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      return {
        valid: false,
        error: 'Invalid email format',
      };
    }

    if (trimmed.length > 254) {
      return {
        valid: false,
        error: 'Email is too long',
      };
    }

    return {
      valid: true,
      data: trimmed,
    };
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidatorResult<string> {
    if (!password || typeof password !== 'string') {
      return {
        valid: false,
        error: 'Password is required',
      };
    }

    const errors: Record<string, string> = {};

    if (password.length < PASSWORD_MIN_LENGTH) {
      errors['length'] = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }

    if (!/[A-Z]/.test(password)) {
      errors['uppercase'] = 'Password must contain an uppercase letter';
    }

    if (!/[a-z]/.test(password)) {
      errors['lowercase'] = 'Password must contain a lowercase letter';
    }

    if (!/\d/.test(password) && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors['numberOrSpecial'] = 'Password must contain a number or a special character';
    }

    const weakPatterns = [
      'password',
      'qwerty',
      '123456',
      'abcdef',
      'welcome',
      'admin',
      'letmein',
      'monkey',
      'dragon',
      'master',
    ];

    if (weakPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      errors['pattern'] = 'Password is too common. Please choose a stronger password';
    }

    if (Object.keys(errors).length > 0) {
      return {
        valid: false,
        error: 'Password does not meet security requirements',
        details: errors,
      };
    }

    return {
      valid: true,
      data: password,
    };
  }

  /**
   * Validate username
   */
  static validateUsername(username: string): ValidatorResult<string> {
    if (!username || typeof username !== 'string') {
      return {
        valid: false,
        error: 'Username is required',
      };
    }

    const trimmed = username.trim();

    if (!USERNAME_REGEX.test(trimmed)) {
      return {
        valid: false,
        error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens',
      };
    }

    return {
      valid: true,
      data: trimmed,
    };
  }

  /**
   * Validate user ID (UUID)
   */
  static validateUserId(userId: string): ValidatorResult<string> {
    if (!userId || typeof userId !== 'string') {
      return {
        valid: false,
        error: 'User ID is required',
      };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return {
        valid: false,
        error: 'Invalid user ID format',
      };
    }

    return {
      valid: true,
      data: userId,
    };
  }

  /**
   * Validate string length
   */
  static validateStringLength(
    value: string,
    fieldName: string,
    min: number = 1,
    max: number = 5000
  ): ValidatorResult<string> {
    if (typeof value !== 'string') {
      return {
        valid: false,
        error: `${fieldName} must be a string`,
      };
    }

    const trimmed = value.trim();

    if (trimmed.length < min) {
      return {
        valid: false,
        error: `${fieldName} must be at least ${min} character(s)`,
      };
    }

    if (trimmed.length > max) {
      return {
        valid: false,
        error: `${fieldName} must not exceed ${max} character(s)`,
      };
    }

    return {
      valid: true,
      data: trimmed,
    };
  }

  /**
   * Validate enum value
   */
  static validateEnum<T extends string>(
    value: unknown,
    allowedValues: readonly T[],
    fieldName: string
  ): ValidatorResult<T> {
    if (!value || typeof value !== 'string') {
      return {
        valid: false,
        error: `${fieldName} is required`,
      };
    }

    if (!allowedValues.includes(value as T)) {
      return {
        valid: false,
        error: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      };
    }

    return {
      valid: true,
      data: value as T,
    };
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(
    file: unknown,
    allowedMimeTypes: string[] = ['image/*'],
    maxSizeMB: number = 10
  ): ValidatorResult<File> {
    if (!file || !(file instanceof File)) {
      return {
        valid: false,
        error: 'File is required',
      };
    }

    if (!file.name) {
      return {
        valid: false,
        error: 'File must have a name',
      };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size must not exceed ${maxSizeMB}MB`,
      };
    }

    // Check MIME type
    const isAllowed = allowedMimeTypes.some(mime => {
      if (mime.endsWith('/*')) {
        const type = mime.split('/')[0];
        return file.type.startsWith(type);
      }
      return file.type === mime;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type must be one of: ${allowedMimeTypes.join(', ')}`,
      };
    }

    return {
      valid: true,
      data: file,
    };
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(
    limit?: number,
    offset?: number,
    maxLimit: number = 100
  ): ValidatorResult<{ limit: number; offset: number }> {
    const resolvedLimit = limit ?? 20;
    const resolvedOffset = offset ?? 0;

    if (!Number.isInteger(resolvedLimit) || resolvedLimit < 1) {
      return {
        valid: false,
        error: 'Limit must be a positive integer',
      };
    }

    if (resolvedLimit > maxLimit) {
      return {
        valid: false,
        error: `Limit cannot exceed ${maxLimit}`,
      };
    }

    if (!Number.isInteger(resolvedOffset) || resolvedOffset < 0) {
      return {
        valid: false,
        error: 'Offset must be a non-negative integer',
      };
    }

    return {
      valid: true,
      data: {
        limit: resolvedLimit,
        offset: resolvedOffset,
      },
    };
  }

  /**
   * Validate role
   */
  static validateRole(role: unknown): ValidatorResult<'seeker' | 'provider' | 'admin' | 'king'> {
    return this.validateEnum(role, ['seeker', 'provider', 'admin', 'king'] as const, 'Role');
  }

  /**
   * Validate date string
   */
  static validateDate(dateString: string): ValidatorResult<Date> {
    if (!dateString || typeof dateString !== 'string') {
      return {
        valid: false,
        error: 'Date is required',
      };
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return {
        valid: false,
        error: 'Invalid date format',
      };
    }

    return {
      valid: true,
      data: date,
    };
  }
}
