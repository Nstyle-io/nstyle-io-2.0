/**
 * Test script for validation utilities
 * Run with: deno run --allow-all validation-test.ts
 */

import {
  InputValidator,
  UUIDValidator,
  EmailValidator,
  PhoneValidator,
  DateTimeValidator,
  NumericValidator,
  CurrencyValidator,
  JSONValidator,
  BookingValidator,
  PaymentValidator,
  SalonValidator,
  SecurityUtils
} from "./validation.ts";

// Test colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function logTest(name: string, passed: boolean, details?: string) {
  const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
  console.log(`${status} ${name}${details ? ` - ${details}` : ''}`);
}

function runValidationTests() {
  console.log(`${colors.blue}🔒 Running Security Validation Tests${colors.reset}\n`);

  // Test InputValidator
  console.log(`${colors.yellow}Testing InputValidator:${colors.reset}`);
  
  let result = InputValidator.validateString("valid name", "name", { required: true, minLength: 2, maxLength: 50 });
  logTest("Valid string", result.isValid && result.sanitizedValue === "valid name");
  
  result = InputValidator.validateString("<script>alert('xss')</script>", "malicious", { required: true });
  logTest("XSS prevention", result.isValid && !result.sanitizedValue!.includes("<script>"));
  
  result = InputValidator.validateString("", "empty", { required: true });
  logTest("Required field validation", !result.isValid);
  
  result = InputValidator.validateString("SELECT * FROM users", "sql", { required: true });
  logTest("SQL injection detection", !result.isValid);

  // Test UUIDValidator
  console.log(`\n${colors.yellow}Testing UUIDValidator:${colors.reset}`);
  
  result = UUIDValidator.validate("550e8400-e29b-41d4-a716-446655440000", "uuid", true);
  logTest("Valid UUID", result.isValid);
  
  result = UUIDValidator.validate("invalid-uuid", "uuid", true);
  logTest("Invalid UUID", !result.isValid);

  // Test EmailValidator
  console.log(`\n${colors.yellow}Testing EmailValidator:${colors.reset}`);
  
  result = EmailValidator.validate("test@example.com", "email", true);
  logTest("Valid email", result.isValid);
  
  result = EmailValidator.validate("invalid-email", "email", true);
  logTest("Invalid email", !result.isValid);

  // Test PhoneValidator
  console.log(`\n${colors.yellow}Testing PhoneValidator:${colors.reset}`);
  
  result = PhoneValidator.validate("+1234567890", "phone", true);
  logTest("Valid phone", result.isValid);
  
  result = PhoneValidator.validate("123", "phone", true);
  logTest("Invalid phone", !result.isValid);

  // Test DateTimeValidator
  console.log(`\n${colors.yellow}Testing DateTimeValidator:${colors.reset}`);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  result = DateTimeValidator.validateDate(tomorrowStr, "date", true);
  logTest("Valid future date", result.isValid);
  
  result = DateTimeValidator.validateDate("2020-01-01", "date", true);
  logTest("Past date rejection", !result.isValid);
  
  result = DateTimeValidator.validateTime("14:30", "time", true);
  logTest("Valid time", result.isValid);
  
  result = DateTimeValidator.validateTime("25:70", "time", true);
  logTest("Invalid time", !result.isValid);

  // Test NumericValidator
  console.log(`\n${colors.yellow}Testing NumericValidator:${colors.reset}`);
  
  result = NumericValidator.validateInteger(100, "number", 0, 1000, true);
  logTest("Valid integer", result.isValid);
  
  result = NumericValidator.validateCurrency(1000, "amount", true);
  logTest("Valid currency amount", result.isValid);
  
  result = NumericValidator.validateCurrency(25, "amount", true);
  logTest("Too small currency amount", !result.isValid);

  // Test CurrencyValidator
  console.log(`\n${colors.yellow}Testing CurrencyValidator:${colors.reset}`);
  
  result = CurrencyValidator.validate("USD", "currency", true);
  logTest("Valid currency", result.isValid);
  
  result = CurrencyValidator.validate("XYZ", "currency", true);
  logTest("Invalid currency", !result.isValid);

  // Test JSONValidator
  console.log(`\n${colors.yellow}Testing JSONValidator:${colors.reset}`);
  
  result = JSONValidator.validate('{"key": "value"}', "json", null, true);
  logTest("Valid JSON", result.isValid);
  
  result = JSONValidator.validate('{invalid json}', "json", null, true);
  logTest("Invalid JSON", !result.isValid);

  // Test BookingValidator
  console.log(`\n${colors.yellow}Testing BookingValidator:${colors.reset}`);
  
  const validBooking = {
    salon_id: "550e8400-e29b-41d4-a716-446655440000",
    service_id: "660e8400-e29b-41d4-a716-446655440000",
    appointment_date: tomorrowStr,
    start_time: "14:00",
    end_time: "15:00",
    client_name: "John Doe",
    client_email: "john@example.com",
    client_phone: "+1234567890"
  };
  
  result = BookingValidator.validateBookingRequest(validBooking);
  logTest("Valid booking request", result.isValid);
  
  const invalidBooking = {
    salon_id: "invalid-uuid",
    service_id: "660e8400-e29b-41d4-a716-446655440000",
    appointment_date: "2020-01-01",
    start_time: "15:00",
    end_time: "14:00", // End before start
    client_name: "<script>alert('xss')</script>",
    client_email: "invalid-email"
  };
  
  result = BookingValidator.validateBookingRequest(invalidBooking);
  logTest("Invalid booking request", !result.isValid);

  // Test PaymentValidator
  console.log(`\n${colors.yellow}Testing PaymentValidator:${colors.reset}`);
  
  const validPayment = {
    amount_cents: 5000,
    description: "Nail service payment",
    currency: "USD"
  };
  
  result = PaymentValidator.validatePaymentRequest(validPayment);
  logTest("Valid payment request", result.isValid);
  
  const invalidPayment = {
    amount_cents: -100,
    description: "<script>alert('xss')</script>".repeat(100),
    currency: "INVALID"
  };
  
  result = PaymentValidator.validatePaymentRequest(invalidPayment);
  logTest("Invalid payment request", !result.isValid);

  // Test SalonValidator
  console.log(`\n${colors.yellow}Testing SalonValidator:${colors.reset}`);
  
  const validSalon = {
    salon_name: "Beautiful Nails Spa",
    address: "123 Main St, City, State",
    phone: "+1234567890",
    business_email: "info@beautifulnails.com"
  };
  
  result = SalonValidator.validateCreateSalonRequest(validSalon);
  logTest("Valid salon request", result.isValid);
  
  const invalidSalon = {
    salon_name: "<script>alert('xss')</script>",
    address: "x", // Too short
    phone: "invalid-phone",
    business_email: "invalid-email"
  };
  
  result = SalonValidator.validateCreateSalonRequest(invalidSalon);
  logTest("Invalid salon request", !result.isValid);

  // Test SecurityUtils
  console.log(`\n${colors.yellow}Testing SecurityUtils:${colors.reset}`);
  
  const token = SecurityUtils.generateSecureToken(32);
  logTest("Token generation", token.length === 32);
  
  // Test security logging (doesn't throw)
  try {
    SecurityUtils.logSecurityEvent("Test event", { test: true }, "low");
    logTest("Security logging", true);
  } catch (error) {
    logTest("Security logging", false, error.message);
  }

  console.log(`\n${colors.blue}🔒 Security Validation Tests Complete${colors.reset}`);
}

// Run tests
if (import.meta.main) {
  runValidationTests();
}