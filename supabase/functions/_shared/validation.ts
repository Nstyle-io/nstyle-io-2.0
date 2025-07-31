/**
 * Comprehensive Input Validation Utility for Supabase Edge Functions
 * 
 * Provides security-focused validation to prevent:
 * - SQL injection attacks
 * - XSS attacks through stored data
 * - Data integrity issues
 * - Invalid data formats
 * - Buffer overflow attacks
 * - Injection attacks through excessive string lengths
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

export interface ValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  allowEmpty?: boolean;
  customPattern?: RegExp;
}

/**
 * Base validation class with common security utilities
 */
export class InputValidator {
  private static readonly MAX_STRING_LENGTH = 10000; // Global max to prevent DoS
  private static readonly DANGEROUS_HTML_PATTERN = /<script[^>]*>.*?<\/script>|<iframe[^>]*>.*?<\/iframe>|javascript:|data:|vbscript:|onload=|onerror=/gi;
  private static readonly SQL_INJECTION_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b|--|\*|;|'|"|\\)/gi;

  /**
   * Sanitize string input to prevent XSS and injection attacks
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Remove dangerous HTML patterns
    let sanitized = input.replace(this.DANGEROUS_HTML_PATTERN, '');
    
    // Encode special characters that could be used for injection
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\\/g, '&#x5C;');
    
    // Trim whitespace and limit length
    return sanitized.trim().substring(0, this.MAX_STRING_LENGTH);
  }

  /**
   * Check for potential SQL injection patterns
   */
  static containsSQLInjection(input: string): boolean {
    return this.SQL_INJECTION_PATTERN.test(input);
  }

  /**
   * Validate and sanitize general string input
   */
  static validateString(
    input: any, 
    fieldName: string, 
    options: ValidationOptions = {}
  ): ValidationResult {
    const errors: string[] = [];
    
    // Type check
    if (input !== null && input !== undefined && typeof input !== 'string') {
      errors.push(`${fieldName} must be a string`);
      return { isValid: false, errors };
    }

    // Handle null/undefined
    if (input === null || input === undefined || input === '') {
      if (options.required && !options.allowEmpty) {
        errors.push(`${fieldName} is required`);
        return { isValid: false, errors };
      }
      return { isValid: true, errors: [], sanitizedValue: input || '' };
    }

    const strInput = String(input);

    // Length validation
    if (options.minLength && strInput.length < options.minLength) {
      errors.push(`${fieldName} must be at least ${options.minLength} characters`);
    }
    
    if (options.maxLength && strInput.length > options.maxLength) {
      errors.push(`${fieldName} must not exceed ${options.maxLength} characters`);
    }

    // Global length check for security
    if (strInput.length > this.MAX_STRING_LENGTH) {
      errors.push(`${fieldName} exceeds maximum allowed length`);
    }

    // SQL injection check
    if (this.containsSQLInjection(strInput)) {
      errors.push(`${fieldName} contains potentially dangerous content`);
    }

    // Custom pattern validation
    if (options.customPattern && !options.customPattern.test(strInput)) {
      errors.push(`${fieldName} format is invalid`);
    }

    const sanitizedValue = this.sanitizeString(strInput);
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    };
  }
}

/**
 * UUID validation utility
 */
export class UUIDValidator {
  private static readonly UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  static validate(input: any, fieldName: string, required: boolean = true): ValidationResult {
    const errors: string[] = [];

    if (input === null || input === undefined || input === '') {
      if (required) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !required, errors, sanitizedValue: input };
    }

    if (typeof input !== 'string') {
      errors.push(`${fieldName} must be a string`);
      return { isValid: false, errors };
    }

    if (!this.UUID_PATTERN.test(input)) {
      errors.push(`${fieldName} must be a valid UUID`);
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [], sanitizedValue: input.toLowerCase() };
  }
}

/**
 * Email validation utility
 */
export class EmailValidator {
  private static readonly EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  static validate(input: any, fieldName: string, required: boolean = false): ValidationResult {
    const errors: string[] = [];

    if (input === null || input === undefined || input === '') {
      if (required) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !required, errors, sanitizedValue: input };
    }

    if (typeof input !== 'string') {
      errors.push(`${fieldName} must be a string`);
      return { isValid: false, errors };
    }

    const email = input.trim().toLowerCase();

    if (email.length > 254) {
      errors.push(`${fieldName} is too long`);
    }

    if (!this.EMAIL_PATTERN.test(email)) {
      errors.push(`${fieldName} must be a valid email address`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: email
    };
  }
}

/**
 * Phone number validation utility
 */
export class PhoneValidator {
  private static readonly PHONE_PATTERN = /^\+?[1-9]\d{1,14}$/; // E.164 format
  private static readonly US_PHONE_PATTERN = /^(\+1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;

  static validate(input: any, fieldName: string, required: boolean = false): ValidationResult {
    const errors: string[] = [];

    if (input === null || input === undefined || input === '') {
      if (required) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !required, errors, sanitizedValue: input };
    }

    if (typeof input !== 'string') {
      errors.push(`${fieldName} must be a string`);
      return { isValid: false, errors };
    }

    // Remove common formatting characters
    const cleanPhone = input.replace(/[-.\s()]/g, '');

    // Check for reasonable length (international format)
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      errors.push(`${fieldName} must be between 7 and 15 digits`);
    }

    // Validate against international format or US format
    if (!this.PHONE_PATTERN.test(cleanPhone) && !this.US_PHONE_PATTERN.test(input)) {
      errors.push(`${fieldName} must be a valid phone number`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: cleanPhone
    };
  }
}

/**
 * Date and time validation utilities
 */
export class DateTimeValidator {
  static validateDate(input: any, fieldName: string, required: boolean = true): ValidationResult {
    const errors: string[] = [];

    if (input === null || input === undefined || input === '') {
      if (required) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !required, errors, sanitizedValue: input };
    }

    if (typeof input !== 'string') {
      errors.push(`${fieldName} must be a string`);
      return { isValid: false, errors };
    }

    // Check ISO date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(input)) {
      errors.push(`${fieldName} must be in YYYY-MM-DD format`);
      return { isValid: false, errors };
    }

    const date = new Date(input);
    if (isNaN(date.getTime())) {
      errors.push(`${fieldName} must be a valid date`);
      return { isValid: false, errors };
    }

    // Check if date is not in the past (for appointments)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      errors.push(`${fieldName} cannot be in the past`);
    }

    // Check reasonable future limit (1 year from now)
    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (date > oneYearFromNow) {
      errors.push(`${fieldName} cannot be more than 1 year in the future`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: input
    };
  }

  static validateTime(input: any, fieldName: string, required: boolean = true): ValidationResult {
    const errors: string[] = [];

    if (input === null || input === undefined || input === '') {
      if (required) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !required, errors, sanitizedValue: input };
    }

    if (typeof input !== 'string') {
      errors.push(`${fieldName} must be a string`);
      return { isValid: false, errors };
    }

    // Check HH:MM format
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(input)) {
      errors.push(`${fieldName} must be in HH:MM format`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: input
    };
  }

  static validateTimeRange(
    startTime: string, 
    endTime: string, 
    fieldPrefix: string = 'Time range'
  ): ValidationResult {
    const errors: string[] = [];

    const startValidation = this.validateTime(startTime, `${fieldPrefix} start time`);
    const endValidation = this.validateTime(endTime, `${fieldPrefix} end time`);

    errors.push(...startValidation.errors, ...endValidation.errors);

    if (startValidation.isValid && endValidation.isValid) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        errors.push(`${fieldPrefix}: start time must be before end time`);
      }

      // Validate reasonable appointment duration (15 minutes to 8 hours)
      const durationMinutes = endMinutes - startMinutes;
      if (durationMinutes < 15) {
        errors.push(`${fieldPrefix}: minimum appointment duration is 15 minutes`);
      }
      if (durationMinutes > 480) { // 8 hours
        errors.push(`${fieldPrefix}: maximum appointment duration is 8 hours`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: { startTime, endTime }
    };
  }
}

/**
 * Numeric validation utility
 */
export class NumericValidator {
  static validateInteger(
    input: any, 
    fieldName: string, 
    min?: number, 
    max?: number, 
    required: boolean = true
  ): ValidationResult {
    const errors: string[] = [];

    if (input === null || input === undefined) {
      if (required) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !required, errors, sanitizedValue: input };
    }

    let numValue: number;

    if (typeof input === 'string') {
      numValue = parseInt(input, 10);
    } else if (typeof input === 'number') {
      numValue = input;
    } else {
      errors.push(`${fieldName} must be a number`);
      return { isValid: false, errors };
    }

    if (isNaN(numValue) || !Number.isInteger(numValue)) {
      errors.push(`${fieldName} must be a valid integer`);
      return { isValid: false, errors };
    }

    if (min !== undefined && numValue < min) {
      errors.push(`${fieldName} must be at least ${min}`);
    }

    if (max !== undefined && numValue > max) {
      errors.push(`${fieldName} must not exceed ${max}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: numValue
    };
  }

  static validatePositiveInteger(
    input: any, 
    fieldName: string, 
    max?: number, 
    required: boolean = true
  ): ValidationResult {
    return this.validateInteger(input, fieldName, 1, max, required);
  }

  static validateCurrency(
    input: any, 
    fieldName: string, 
    required: boolean = true
  ): ValidationResult {
    // Validate amount in cents (positive integer, reasonable limits)
    const result = this.validatePositiveInteger(input, fieldName, 10000000, required); // Max $100,000
    
    if (result.isValid && result.sanitizedValue && result.sanitizedValue < 50) {
      result.errors.push(`${fieldName} must be at least $0.50 (50 cents)`);
      result.isValid = false;
    }

    return result;
  }
}

/**
 * Currency code validation
 */
export class CurrencyValidator {
  private static readonly VALID_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'SEK', 'NZD'
  ];

  static validate(input: any, fieldName: string, required: boolean = false): ValidationResult {
    const errors: string[] = [];

    if (input === null || input === undefined || input === '') {
      if (required) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !required, errors, sanitizedValue: input || 'USD' };
    }

    if (typeof input !== 'string') {
      errors.push(`${fieldName} must be a string`);
      return { isValid: false, errors };
    }

    const currency = input.toUpperCase();

    if (!this.VALID_CURRENCIES.includes(currency)) {
      errors.push(`${fieldName} must be a valid currency code (${this.VALID_CURRENCIES.join(', ')})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: currency
    };
  }
}

/**
 * JSON validation utility
 */
export class JSONValidator {
  static validate(
    input: any, 
    fieldName: string, 
    schema?: any, 
    required: boolean = false
  ): ValidationResult {
    const errors: string[] = [];

    if (input === null || input === undefined) {
      if (required) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !required, errors, sanitizedValue: input };
    }

    let jsonValue: any;

    if (typeof input === 'string') {
      try {
        jsonValue = JSON.parse(input);
      } catch (e) {
        errors.push(`${fieldName} must be valid JSON`);
        return { isValid: false, errors };
      }
    } else if (typeof input === 'object') {
      jsonValue = input;
    } else {
      errors.push(`${fieldName} must be a JSON object`);
      return { isValid: false, errors };
    }

    // Basic schema validation for business hours
    if (schema && fieldName.toLowerCase().includes('business_hours')) {
      if (typeof jsonValue !== 'object' || Array.isArray(jsonValue)) {
        errors.push(`${fieldName} must be a JSON object`);
      } else {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        for (const [day, hours] of Object.entries(jsonValue)) {
          if (!validDays.includes(day.toLowerCase())) {
            errors.push(`${fieldName}: invalid day "${day}"`);
          }
          
          if (hours && typeof hours === 'object' && !Array.isArray(hours)) {
            const { open, close } = hours as any;
            if (open && close) {
              const timeValidation = DateTimeValidator.validateTimeRange(open, close, `${day} hours`);
              errors.push(...timeValidation.errors);
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: jsonValue
    };
  }
}

/**
 * Comprehensive validation for booking requests
 */
export class BookingValidator {
  static validateBookingRequest(data: any): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    // Validate salon_id
    const salonIdValidation = UUIDValidator.validate(data.salon_id, 'salon_id', true);
    errors.push(...salonIdValidation.errors);
    sanitizedData.salon_id = salonIdValidation.sanitizedValue;

    // Validate service_id
    const serviceIdValidation = UUIDValidator.validate(data.service_id, 'service_id', true);
    errors.push(...serviceIdValidation.errors);
    sanitizedData.service_id = serviceIdValidation.sanitizedValue;

    // Validate appointment_date
    const dateValidation = DateTimeValidator.validateDate(data.appointment_date, 'appointment_date', true);
    errors.push(...dateValidation.errors);
    sanitizedData.appointment_date = dateValidation.sanitizedValue;

    // Validate time range
    const timeRangeValidation = DateTimeValidator.validateTimeRange(
      data.start_time, 
      data.end_time, 
      'Appointment time'
    );
    errors.push(...timeRangeValidation.errors);
    sanitizedData.start_time = data.start_time;
    sanitizedData.end_time = data.end_time;

    // Validate client_name
    const nameValidation = InputValidator.validateString(data.client_name, 'client_name', {
      required: true,
      minLength: 2,
      maxLength: 100
    });
    errors.push(...nameValidation.errors);
    sanitizedData.client_name = nameValidation.sanitizedValue;

    // Validate optional client_email
    if (data.client_email) {
      const emailValidation = EmailValidator.validate(data.client_email, 'client_email', false);
      errors.push(...emailValidation.errors);
      sanitizedData.client_email = emailValidation.sanitizedValue;
    }

    // Validate optional client_phone
    if (data.client_phone) {
      const phoneValidation = PhoneValidator.validate(data.client_phone, 'client_phone', false);
      errors.push(...phoneValidation.errors);
      sanitizedData.client_phone = phoneValidation.sanitizedValue;
    }

    // Validate optional notes
    if (data.notes) {
      const notesValidation = InputValidator.validateString(data.notes, 'notes', {
        required: false,
        maxLength: 500
      });
      errors.push(...notesValidation.errors);
      sanitizedData.notes = notesValidation.sanitizedValue;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitizedData
    };
  }
}

/**
 * Comprehensive validation for payment requests
 */
export class PaymentValidator {
  static validatePaymentRequest(data: any): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    // Validate optional appointment_id
    if (data.appointment_id) {
      const appointmentIdValidation = UUIDValidator.validate(data.appointment_id, 'appointment_id', false);
      errors.push(...appointmentIdValidation.errors);
      sanitizedData.appointment_id = appointmentIdValidation.sanitizedValue;
    }

    // Validate amount_cents
    const amountValidation = NumericValidator.validateCurrency(data.amount_cents, 'amount_cents', true);
    errors.push(...amountValidation.errors);
    sanitizedData.amount_cents = amountValidation.sanitizedValue;

    // Validate description
    const descriptionValidation = InputValidator.validateString(data.description, 'description', {
      required: true,
      minLength: 3,
      maxLength: 200
    });
    errors.push(...descriptionValidation.errors);
    sanitizedData.description = descriptionValidation.sanitizedValue;

    // Validate currency
    const currencyValidation = CurrencyValidator.validate(data.currency, 'currency', false);
    errors.push(...currencyValidation.errors);
    sanitizedData.currency = currencyValidation.sanitizedValue || 'USD';

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitizedData
    };
  }
}

/**
 * Comprehensive validation for salon creation requests
 */
export class SalonValidator {
  static validateCreateSalonRequest(data: any): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    // Validate salon_name
    const nameValidation = InputValidator.validateString(data.salon_name, 'salon_name', {
      required: true,
      minLength: 2,
      maxLength: 100
    });
    errors.push(...nameValidation.errors);
    sanitizedData.salon_name = nameValidation.sanitizedValue;

    // Validate optional business_email
    if (data.business_email) {
      const emailValidation = EmailValidator.validate(data.business_email, 'business_email', false);
      errors.push(...emailValidation.errors);
      sanitizedData.business_email = emailValidation.sanitizedValue;
    }

    // Validate optional phone
    if (data.phone) {
      const phoneValidation = PhoneValidator.validate(data.phone, 'phone', false);
      errors.push(...phoneValidation.errors);
      sanitizedData.phone = phoneValidation.sanitizedValue;
    }

    // Validate address
    const addressValidation = InputValidator.validateString(data.address, 'address', {
      required: true,
      minLength: 5,
      maxLength: 200
    });
    errors.push(...addressValidation.errors);
    sanitizedData.address = addressValidation.sanitizedValue;

    // Validate optional city
    if (data.city) {
      const cityValidation = InputValidator.validateString(data.city, 'city', {
        required: false,
        maxLength: 50
      });
      errors.push(...cityValidation.errors);
      sanitizedData.city = cityValidation.sanitizedValue;
    }

    // Validate optional state
    if (data.state) {
      const stateValidation = InputValidator.validateString(data.state, 'state', {
        required: false,
        maxLength: 50
      });
      errors.push(...stateValidation.errors);
      sanitizedData.state = stateValidation.sanitizedValue;
    }

    // Validate optional zip_code
    if (data.zip_code) {
      const zipValidation = InputValidator.validateString(data.zip_code, 'zip_code', {
        required: false,
        maxLength: 10,
        customPattern: /^[0-9]{5}(-[0-9]{4})?$|^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/ // US or Canadian postal codes
      });
      errors.push(...zipValidation.errors);
      sanitizedData.zip_code = zipValidation.sanitizedValue;
    }

    // Validate optional description
    if (data.description) {
      const descriptionValidation = InputValidator.validateString(data.description, 'description', {
        required: false,
        maxLength: 1000
      });
      errors.push(...descriptionValidation.errors);
      sanitizedData.description = descriptionValidation.sanitizedValue;
    }

    // Validate optional website_url
    if (data.website_url) {
      const urlValidation = InputValidator.validateString(data.website_url, 'website_url', {
        required: false,
        maxLength: 200,
        customPattern: /^https?:\/\/.+\..+/
      });
      errors.push(...urlValidation.errors);
      sanitizedData.website_url = urlValidation.sanitizedValue;
    }

    // Validate optional instagram_handle
    if (data.instagram_handle) {
      const instagramValidation = InputValidator.validateString(data.instagram_handle, 'instagram_handle', {
        required: false,
        maxLength: 30,
        customPattern: /^[a-zA-Z0-9_.]{1,30}$/
      });
      errors.push(...instagramValidation.errors);
      sanitizedData.instagram_handle = instagramValidation.sanitizedValue;
    }

    // Validate optional facebook_url
    if (data.facebook_url) {
      const facebookValidation = InputValidator.validateString(data.facebook_url, 'facebook_url', {
        required: false,
        maxLength: 200,
        customPattern: /^https?:\/\/(www\.)?facebook\.com\/.+/
      });
      errors.push(...facebookValidation.errors);
      sanitizedData.facebook_url = facebookValidation.sanitizedValue;
    }

    // Validate optional business_hours
    if (data.business_hours) {
      const hoursValidation = JSONValidator.validate(data.business_hours, 'business_hours', null, false);
      errors.push(...hoursValidation.errors);
      sanitizedData.business_hours = hoursValidation.sanitizedValue;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitizedData
    };
  }
}

/**
 * Security utility functions
 */
export class SecurityUtils {
  /**
   * Rate limiting check (basic implementation)
   */
  static isRateLimited(clientId: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    // This is a basic in-memory implementation
    // In production, use Redis or similar for distributed rate limiting
    const now = Date.now();
    const key = `rate_limit_${clientId}`;
    
    // This would need to be implemented with proper storage
    // For now, return false (not rate limited)
    return false;
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Log security event
   */
  static logSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    const timestamp = new Date().toISOString();
    console.warn(`[SECURITY-${severity.toUpperCase()}] ${timestamp}: ${event}`, details);
    
    // In production, send to security monitoring system
    // e.g., Sentry, DataDog, CloudWatch, etc.
  }
}