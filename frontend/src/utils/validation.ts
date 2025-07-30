import { AppError, AppErrorHandler } from './error-handling';

export interface ValidationRule<T = any> {
  validator: (value: T) => boolean;
  message: string;
}

export interface ValidationSchema<T = Record<string, any>> {
  [K in keyof T]?: ValidationRule<T[K]>[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class Validator {
  static email(message = 'Please enter a valid email address'): ValidationRule<string> {
    return {
      validator: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message
    };
  }

  static required(message = 'This field is required'): ValidationRule<any> {
    return {
      validator: (value: any) => {
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined;
      },
      message
    };
  }

  static minLength(min: number, message?: string): ValidationRule<string> {
    return {
      validator: (value: string) => value.length >= min,
      message: message || `Must be at least ${min} characters long`
    };
  }

  static maxLength(max: number, message?: string): ValidationRule<string> {
    return {
      validator: (value: string) => value.length <= max,
      message: message || `Must be no more than ${max} characters long`
    };
  }

  static pattern(regex: RegExp, message: string): ValidationRule<string> {
    return {
      validator: (value: string) => regex.test(value),
      message
    };
  }

  static phone(message = 'Please enter a valid phone number'): ValidationRule<string> {
    return {
      validator: (value: string) => {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(value.replace(/\s/g, ''));
      },
      message
    };
  }

  static url(message = 'Please enter a valid URL'): ValidationRule<string> {
    return {
      validator: (value: string) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message
    };
  }

  static number(message = 'Please enter a valid number'): ValidationRule<any> {
    return {
      validator: (value: any) => !isNaN(Number(value)) && isFinite(Number(value)),
      message
    };
  }

  static positive(message = 'Must be a positive number'): ValidationRule<number> {
    return {
      validator: (value: number) => value > 0,
      message
    };
  }

  static range(min: number, max: number, message?: string): ValidationRule<number> {
    return {
      validator: (value: number) => value >= min && value <= max,
      message: message || `Must be between ${min} and ${max}`
    };
  }

  static custom<T>(validator: (value: T) => boolean, message: string): ValidationRule<T> {
    return { validator, message };
  }
}

export function validateField<T>(value: T, rules: ValidationRule<T>[]): string | null {
  for (const rule of rules) {
    if (!rule.validator(value)) {
      return rule.message;
    }
  }
  return null;
}

export function validateObject<T extends Record<string, any>>(
  data: T, 
  schema: ValidationSchema<T>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, rules] of Object.entries(schema)) {
    if (rules && Array.isArray(rules)) {
      const fieldError = validateField(data[field], rules);
      if (fieldError) {
        errors[field] = fieldError;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Basic XSS prevention
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T];
    }
  }
  
  return sanitized;
}

// Validation schemas for common forms
export const userProfileSchema: ValidationSchema = {
  displayName: [
    Validator.required('Display name is required'),
    Validator.minLength(2, 'Display name must be at least 2 characters'),
    Validator.maxLength(50, 'Display name must be less than 50 characters')
  ],
  email: [
    Validator.required('Email is required'),
    Validator.email()
  ],
  bio: [
    Validator.maxLength(500, 'Bio must be less than 500 characters')
  ]
};

export const salonProfileSchema: ValidationSchema = {
  salonName: [
    Validator.required('Salon name is required'),
    Validator.minLength(2, 'Salon name must be at least 2 characters'),
    Validator.maxLength(100, 'Salon name must be less than 100 characters')
  ],
  description: [
    Validator.maxLength(1000, 'Description must be less than 1000 characters')
  ],
  address: [
    Validator.required('Address is required'),
    Validator.minLength(10, 'Please enter a complete address')
  ],
  phone: [
    Validator.required('Phone number is required'),
    Validator.phone()
  ]
};

export const serviceSchema: ValidationSchema = {
  name: [
    Validator.required('Service name is required'),
    Validator.minLength(2, 'Service name must be at least 2 characters'),
    Validator.maxLength(100, 'Service name must be less than 100 characters')
  ],
  price: [
    Validator.required('Price is required'),
    Validator.number(),
    Validator.positive('Price must be greater than 0')
  ],
  duration: [
    Validator.required('Duration is required'),
    Validator.number(),
    Validator.range(15, 480, 'Duration must be between 15 minutes and 8 hours')
  ]
};

export function throwValidationError(field: string, message: string): never {
  const error = AppErrorHandler.handleValidationError(field, message);
  throw error;
}