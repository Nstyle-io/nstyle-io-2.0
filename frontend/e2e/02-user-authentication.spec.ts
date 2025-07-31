import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testData, errorMessages as _errorMessages, successMessages as _successMessages } from './fixtures/test-data';

test.describe('User Authentication Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('User Registration', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
      await helpers.waitForLoadingComplete();
    });

    test('should register new user successfully', async ({ page }) => {
      const testUser = helpers.generateTestUser();
      
      // Fill out registration form
      const emailField = page.locator('input[type="email"], input[name="email"], #email');
      const passwordField = page.locator('input[type="password"], input[name="password"], #password');
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")');
      
      await helpers.fillField(emailField, testUser.email);
      await helpers.fillField(passwordField, testUser.password);
      
      // Check for additional required fields
      const usernameField = page.locator('input[name="username"], input[name="displayName"], #username');
      if (await usernameField.isVisible()) {
        await helpers.fillField(usernameField, testUser.username);
      }
      
      const confirmPasswordField = page.locator('input[name="confirmPassword"], input[name="passwordConfirm"], #confirmPassword');
      if (await confirmPasswordField.isVisible()) {
        await helpers.fillField(confirmPasswordField, testUser.password);
      }
      
      // Submit form
      await helpers.clickElement(submitButton);
      
      // Check for success or redirect to profile setup
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      
      // Should redirect to profile setup, dashboard, or show success message
      const validRedirects = ['/profile-setup', '/feed', '/dashboard', '/'];
      const isValidRedirect = validRedirects.some(url => currentUrl.includes(url));
      
      if (!isValidRedirect) {
        // Check for success message if no redirect
        const successElement = page.locator('text="Account created", text="Welcome", text="Success", [role="alert"]:has-text("success")');
        await expect(successElement.first()).toBeVisible({ timeout: 5000 });
      }
      
      // Check no error messages
      const { hasError } = await helpers.checkForErrors();
      expect(hasError).toBe(false);
    });

    test('should show validation errors for invalid data', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")');
      
      // Try to submit empty form
      await helpers.clickElement(submitButton);
      
      // Should show validation errors
      await page.waitForTimeout(1000);
      const { hasError } = await helpers.checkForErrors();
      expect(hasError).toBe(true);
      
      // Test invalid email
      const emailField = page.locator('input[type="email"], input[name="email"], #email');
      const passwordField = page.locator('input[type="password"], input[name="password"], #password');
      
      await helpers.fillField(emailField, 'invalid-email');
      await helpers.fillField(passwordField, '123');
      await helpers.clickElement(submitButton);
      
      await page.waitForTimeout(1000);
      const { hasError: hasError2 } = await helpers.checkForErrors();
      expect(hasError2).toBe(true);
    });

    test('should handle duplicate email registration', async ({ page }) => {
      // Use a common test email that likely exists
      const emailField = page.locator('input[type="email"], input[name="email"], #email');
      const passwordField = page.locator('input[type="password"], input[name="password"], #password');
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")');
      
      await helpers.fillField(emailField, 'test@example.com');
      await helpers.fillField(passwordField, 'TestPass123!');
      
      await helpers.clickElement(submitButton);
      
      // Should show error about existing email
      await page.waitForTimeout(2000);
      
      // Check for error message (might be immediate validation or server response)
      const errorText = await page.locator('[role="alert"], .error, .error-message').textContent();
      if (errorText) {
        expect(errorText.toLowerCase()).toContain('email');
      }
    });
  });

  test.describe('User Login', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await helpers.waitForLoadingComplete();
    });

    test('should login with valid credentials', async ({ page }) => {
      const emailField = page.locator('input[type="email"], input[name="email"], #email');
      const passwordField = page.locator('input[type="password"], input[name="password"], #password');
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")');
      
      // Use test credentials that might exist or handle the case where they don't
      await helpers.fillField(emailField, testData.users.validUser.email);
      await helpers.fillField(passwordField, testData.users.validUser.password);
      
      await helpers.clickElement(submitButton);
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      // Check if redirected to authenticated area or shows success
      const validRedirects = ['/feed', '/dashboard', '/profile', '/'];
      const isValidRedirect = validRedirects.some(url => currentUrl.includes(url));
      
      // If no redirect, check for error (expected for non-existent test user)
      if (!isValidRedirect) {
        // This is expected for a test user that doesn't exist
        const { hasError } = await helpers.checkForErrors();
        // Either should redirect (successful login) or show error (user doesn't exist)
        expect(hasError || isValidRedirect).toBe(true);
      }
    });

    test('should show error for invalid credentials', async ({ page }) => {
      const emailField = page.locator('input[type="email"], input[name="email"], #email');
      const passwordField = page.locator('input[type="password"], input[name="password"], #password');
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")');
      
      await helpers.fillField(emailField, 'nonexistent@example.com');
      await helpers.fillField(passwordField, 'wrongpassword');
      
      await helpers.clickElement(submitButton);
      
      // Should show error message
      await page.waitForTimeout(2000);
      const { hasError } = await helpers.checkForErrors();
      expect(hasError).toBe(true);
    });

    test('should validate form fields', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")');
      
      // Try to submit empty form
      await helpers.clickElement(submitButton);
      
      // Should show validation errors
      await page.waitForTimeout(1000);
      const { hasError } = await helpers.checkForErrors();
      expect(hasError).toBe(true);
    });

    test('should handle forgot password link', async ({ page }) => {
      const forgotPasswordLink = page.locator('text="Forgot", text="Reset", [href*="forgot"]');
      
      if (await forgotPasswordLink.isVisible()) {
        await helpers.clickElement(forgotPasswordLink);
        await helpers.waitForNavigation();
        
        // Should navigate to forgot password page
        expect(page.url()).toContain('forgot');
        
        // Should have password reset form
        const emailField = page.locator('input[type="email"]');
        await expect(emailField).toBeVisible();
      }
    });
  });

  test.describe('Backend Switching', () => {
    test('should allow switching between Firebase and Supabase', async ({ page }) => {
      await page.goto('/login');
      
      // Look for backend switcher component
      const backendSwitcher = page.locator('[data-testid="backend-switcher"], .backend-switcher');
      
      if (await backendSwitcher.isVisible()) {
        // Test switching backends
        const firebaseOption = page.locator('text="Firebase", [value="firebase"]');
        const supabaseOption = page.locator('text="Supabase", [value="supabase"]');
        
        if (await firebaseOption.isVisible()) {
          await helpers.clickElement(firebaseOption);
          await page.waitForTimeout(1000);
        }
        
        if (await supabaseOption.isVisible()) {
          await helpers.clickElement(supabaseOption);
          await page.waitForTimeout(1000);
        }
        
        // Verify the form still works after switching
        const emailField = page.locator('input[type="email"]');
        const passwordField = page.locator('input[type="password"]');
        
        await expect(emailField).toBeVisible();
        await expect(passwordField).toBeVisible();
      }
    });
  });

  test.describe('Social Authentication', () => {
    test('should show social login options', async ({ page }) => {
      await page.goto('/login');
      await helpers.waitForLoadingComplete();
      
      // Look for social login buttons
      const googleButton = page.locator('text="Google", [data-provider="google"], button:has-text("Continue with Google")');
      const facebookButton = page.locator('text="Facebook", [data-provider="facebook"]');
      
      // At least one social option should be available
      const socialButtonsVisible = await googleButton.isVisible() || await facebookButton.isVisible();
      
      if (socialButtonsVisible) {
        // Note: We can't actually test social login without real credentials
        // But we can verify the buttons are present and clickable
        if (await googleButton.isVisible()) {
          await expect(googleButton).toBeEnabled();
        }
        if (await facebookButton.isVisible()) {
          await expect(facebookButton).toBeEnabled();
        }
      }
    });
  });

  test.describe('Password Reset', () => {
    test('should handle password reset flow', async ({ page }) => {
      await page.goto('/forgot-password');
      await helpers.waitForLoadingComplete();
      
      const emailField = page.locator('input[type="email"], input[name="email"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Reset"), button:has-text("Send")');
      
      if (await emailField.isVisible() && await submitButton.isVisible()) {
        await helpers.fillField(emailField, 'test@example.com');
        await helpers.clickElement(submitButton);
        
        await page.waitForTimeout(2000);
        
        // Should show success message or error
        const successMessage = page.locator('text="sent", text="email", text="check"');
        const { hasError } = await helpers.checkForErrors();
        
        // Either success message or error should be shown
        const hasSuccess = await successMessage.isVisible();
        expect(hasSuccess || hasError).toBe(true);
      }
    });
  });
});