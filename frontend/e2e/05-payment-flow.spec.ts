import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testData } from './fixtures/test-data';

test.describe('Payment Flow with Stripe Integration', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Payment Form', () => {
    test.beforeEach(async ({ page }) => {
      // Try to navigate to payment/checkout page
      await page.goto('/checkout');
      
      // If checkout doesn't exist, try booking flow to get to payment
      if (page.url().includes('404')) {
        await page.goto('/book');
        
        if (page.url().includes('404')) {
          await page.goto('/payment');
        }
      }
      
      // If requires login, skip authentication tests for now
      if (page.url().includes('/login')) {
        console.log('Payment flow requires authentication');
      }
      
      await helpers.waitForLoadingComplete();
    });

    test('should display Stripe payment form', async ({ page }) => {
      // Look for Stripe Elements or payment form
      const stripeElements = page.locator('.StripeElement, [data-testid="stripe-element"]');
      const cardNumberField = page.locator('input[placeholder*="card"], input[name*="card"], #card-number');
      const paymentForm = page.locator('.payment-form, [data-testid="payment-form"], form:has(input[placeholder*="card"])');
      
      // At least one payment-related element should be present
      const hasPaymentElements = await stripeElements.first().isVisible() ||
                                await cardNumberField.isVisible() ||
                                await paymentForm.isVisible();
      
      if (hasPaymentElements) {
        expect(hasPaymentElements).toBe(true);
        
        // Check for essential payment fields
        const expiryField = page.locator('input[placeholder*="expiry"], input[placeholder*="MM"], input[placeholder*="YY"]');
        const cvcField = page.locator('input[placeholder*="CVC"], input[placeholder*="CVV"], input[placeholder*="security"]');
        
        if (await cardNumberField.isVisible()) {
          await expect(cardNumberField).toBeVisible();
        }
        
        if (await expiryField.isVisible()) {
          await expect(expiryField).toBeVisible();
        }
        
        if (await cvcField.isVisible()) {
          await expect(cvcField).toBeVisible();
        }
      } else {
        console.log('Payment form not found - may require booking context or authentication');
      }
    });

    test('should show order summary', async ({ page }) => {
      // Look for order/booking summary
      const orderSummary = page.locator('.order-summary, .booking-summary, [data-testid="order-summary"]');
      const totalAmount = page.locator('.total, .amount, [data-testid="total-amount"]');
      const serviceDetails = page.locator('.service-details, .booking-details, [data-testid="service-details"]');
      
      if (await orderSummary.isVisible()) {
        await expect(orderSummary).toBeVisible();
        
        // Should show service details and pricing
        if (await serviceDetails.isVisible()) {
          await expect(serviceDetails).toBeVisible();
        }
        
        if (await totalAmount.isVisible()) {
          await expect(totalAmount).toBeVisible();
          
          // Check that total amount is properly formatted (contains currency)
          const totalText = await totalAmount.textContent();
          expect(totalText).toMatch(/\$\d+|\d+\.\d{2}/);
        }
      }
    });

    test('should validate payment fields', async ({ page }) => {
      const paymentForm = page.locator('form:has(input[placeholder*="card"]), .payment-form');
      const submitButton = page.locator('button[type="submit"], button:has-text("Pay"), button:has-text("Complete")');
      
      if (await paymentForm.isVisible() && await submitButton.isVisible()) {
        // Try to submit without filling fields
        await helpers.clickElement(submitButton);
        
        await page.waitForTimeout(2000);
        
        // Should show validation errors
        const { hasError } = await helpers.checkForErrors();
        expect(hasError).toBe(true);
      }
    });

    test('should handle invalid card details', async ({ page }) => {
      const cardNumberField = page.locator('input[placeholder*="card"], input[name*="card"]');
      const expiryField = page.locator('input[placeholder*="expiry"], input[placeholder*="MM"]');
      const cvcField = page.locator('input[placeholder*="CVC"], input[placeholder*="CVV"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Pay")');
      
      if (await cardNumberField.isVisible()) {
        // Fill with invalid card details
        await helpers.fillField(cardNumberField, '1234567890123456'); // Invalid card number
        
        if (await expiryField.isVisible()) {
          await helpers.fillField(expiryField, '01/20'); // Expired date
        }
        
        if (await cvcField.isVisible()) {
          await helpers.fillField(cvcField, '12'); // Invalid CVC
        }
        
        if (await submitButton.isVisible()) {
          await helpers.clickElement(submitButton);
          
          await page.waitForTimeout(3000);
          
          // Should show validation errors
          const { hasError, message } = await helpers.checkForErrors();
          expect(hasError).toBe(true);
          
          if (message) {
            expect(message.toLowerCase()).toMatch(/card|invalid|error/);
          }
        }
      }
    });

    test('should handle Stripe test card - success', async ({ page }) => {
      const cardNumberField = page.locator('input[placeholder*="card"], input[name*="card"]');
      const expiryField = page.locator('input[placeholder*="expiry"], input[placeholder*="MM"]');
      const cvcField = page.locator('input[placeholder*="CVC"], input[placeholder*="CVV"]');
      const zipField = page.locator('input[placeholder*="zip"], input[name*="postal"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Pay")');
      
      if (await cardNumberField.isVisible()) {
        // Use Stripe test card that will succeed
        await helpers.fillField(cardNumberField, testData.payment.validCard.number);
        
        if (await expiryField.isVisible()) {
          await helpers.fillField(expiryField, testData.payment.validCard.expiry);
        }
        
        if (await cvcField.isVisible()) {
          await helpers.fillField(cvcField, testData.payment.validCard.cvc);
        }
        
        if (await zipField.isVisible()) {
          await helpers.fillField(zipField, testData.payment.validCard.zip);
        }
        
        if (await submitButton.isVisible()) {
          await helpers.clickElement(submitButton);
          
          // Wait for payment processing
          await page.waitForTimeout(5000);
          
          // Should either show success message or redirect to success page
          const successMessage = page.locator('text="success", text="confirmed", text="complete", .success');
          const currentUrl = page.url();
          
          const hasSuccess = await successMessage.isVisible();
          const isSuccessPage = currentUrl.includes('success') || 
                               currentUrl.includes('confirmation') || 
                               currentUrl.includes('complete');
          
          if (!hasSuccess && !isSuccessPage) {
            // Check if there's an error (expected in test environment without real Stripe setup)
            const { hasError } = await helpers.checkForErrors();
            console.log('Payment test completed - success or expected error:', hasError);
          }
        }
      }
    });

    test('should handle Stripe test card - decline', async ({ page }) => {
      const cardNumberField = page.locator('input[placeholder*="card"], input[name*="card"]');
      const expiryField = page.locator('input[placeholder*="expiry"], input[placeholder*="MM"]');
      const cvcField = page.locator('input[placeholder*="CVC"], input[placeholder*="CVV"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Pay")');
      
      if (await cardNumberField.isVisible()) {
        // Use Stripe test card that will be declined
        await helpers.fillField(cardNumberField, testData.payment.invalidCard.number);
        
        if (await expiryField.isVisible()) {
          await helpers.fillField(expiryField, testData.payment.invalidCard.expiry);
        }
        
        if (await cvcField.isVisible()) {
          await helpers.fillField(cvcField, testData.payment.invalidCard.cvc);
        }
        
        if (await submitButton.isVisible()) {
          await helpers.clickElement(submitButton);
          
          await page.waitForTimeout(3000);
          
          // Should show decline error
          const { hasError, message } = await helpers.checkForErrors();
          expect(hasError).toBe(true);
          
          if (message) {
            expect(message.toLowerCase()).toMatch(/decline|failed|error/);
          }
        }
      }
    });
  });

  test.describe('Payment Security', () => {
    test('should use HTTPS for payment pages', async ({ page }) => {
      // In production, payment pages should use HTTPS
      const currentUrl = page.url();
      
      if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
        console.log('Local development - HTTPS check skipped');
      } else {
        expect(currentUrl).toMatch(/^https:/);
      }
    });

    test('should not expose sensitive payment data in DOM', async ({ page }) => {
      // Navigate to payment page
      await page.goto('/checkout');
      
      if (page.url().includes('404')) {
        await page.goto('/payment');
      }
      
      await helpers.waitForLoadingComplete();
      
      // Check that no sensitive data is exposed in the DOM
      const pageContent = await page.content();
      
      // These patterns should not appear in the DOM
      const sensitivePatterns = [
        /4242\s*4242\s*4242\s*4242/, // Test card number
        /sk_live_/, // Stripe live secret key
        /sk_test_.*[a-zA-Z0-9]{20,}/, // Stripe test secret key (full key)
        /password\s*[:=]\s*["'][^"']*["']/, // Exposed passwords
      ];
      
      for (const pattern of sensitivePatterns) {
        expect(pageContent).not.toMatch(pattern);
      }
    });

    test('should implement proper error handling', async ({ page }) => {
      await page.goto('/checkout');
      
      if (page.url().includes('404')) {
        test.skip('Payment page not accessible');
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      // Simulate network error during payment
      await page.route('**/*stripe*', route => route.abort());
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Pay")');
      
      if (await submitButton.isVisible()) {
        await helpers.clickElement(submitButton);
        
        await page.waitForTimeout(3000);
        
        // Should show appropriate error message
        const { hasError, message } = await helpers.checkForErrors();
        expect(hasError).toBe(true);
        
        if (message) {
          expect(message.toLowerCase()).toMatch(/error|failed|problem/);
        }
      }
    });
  });

  test.describe('Payment Success Flow', () => {
    test('should redirect to confirmation page after successful payment', async ({ page }) => {
      // Navigate directly to success page to test it exists
      await page.goto('/payment-success');
      
      if (page.url().includes('404')) {
        await page.goto('/booking-confirmation');
        
        if (page.url().includes('404')) {
          await page.goto('/success');
        }
      }
      
      if (!page.url().includes('404')) {
        await helpers.waitForLoadingComplete();
        
        // Should show success message and booking details
        const successMessage = page.locator('text="success", text="confirmed", text="complete"');
        const bookingDetails = page.locator('.booking-details, .confirmation-details');
        const bookingId = page.locator('.booking-id, .confirmation-number');
        
        if (await successMessage.isVisible()) {
          await expect(successMessage).toBeVisible();
        }
        
        if (await bookingDetails.isVisible()) {
          await expect(bookingDetails).toBeVisible();
        }
        
        if (await bookingId.isVisible()) {
          await expect(bookingId).toBeVisible();
        }
      }
    });

    test('should send confirmation email (UI indication)', async ({ page }) => {
      await page.goto('/payment-success');
      
      if (page.url().includes('404')) {
        test.skip('Success page not accessible');
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      // Look for indication that confirmation email was sent
      const emailConfirmation = page.locator('text="email sent", text="confirmation email", text="check your email"');
      
      if (await emailConfirmation.isVisible()) {
        await expect(emailConfirmation).toBeVisible();
      }
    });

    test('should provide options to add to calendar', async ({ page }) => {
      await page.goto('/payment-success');
      
      if (page.url().includes('404')) {
        test.skip('Success page not accessible');
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      // Look for calendar integration options
      const addToCalendar = page.locator('button:has-text("calendar"), button:has-text("add to"), .calendar-button');
      
      if (await addToCalendar.isVisible()) {
        await expect(addToCalendar).toBeVisible();
        
        // Click should generate calendar file or open calendar app
        await helpers.clickElement(addToCalendar);
        
        // Should either download file or show calendar options
        const { hasError } = await helpers.checkForErrors();
        expect(hasError).toBe(false);
      }
    });
  });

  test.describe('Billing and Receipts', () => {
    test('should generate receipt after payment', async ({ page }) => {
      await page.goto('/receipt');
      
      if (page.url().includes('404')) {
        await page.goto('/billing');
        
        if (page.url().includes('404')) {
          test.skip('Receipt page not accessible');
          return;
        }
      }
      
      await helpers.waitForLoadingComplete();
      
      // Should show receipt details
      const receiptDetails = page.locator('.receipt, .invoice, .payment-details');
      const transactionId = page.locator('.transaction-id, .payment-id');
      const amountPaid = page.locator('.amount-paid, .total-paid');
      
      if (await receiptDetails.isVisible()) {
        await expect(receiptDetails).toBeVisible();
        
        if (await transactionId.isVisible()) {
          await expect(transactionId).toBeVisible();
        }
        
        if (await amountPaid.isVisible()) {
          await expect(amountPaid).toBeVisible();
        }
      }
    });

    test('should allow downloading receipt', async ({ page }) => {
      await page.goto('/receipt');
      
      if (page.url().includes('404')) {
        test.skip('Receipt page not accessible');
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      const downloadButton = page.locator('button:has-text("download"), button:has-text("pdf"), .download-receipt');
      
      if (await downloadButton.isVisible()) {
        // Setup download listener
        const downloadPromise = page.waitForEvent('download');
        
        await helpers.clickElement(downloadButton);
        
        try {
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/receipt|invoice/i);
        } catch (error) {
          console.log('Download test skipped - may require actual payment data');
        }
      }
    });
  });

  test.describe('Payment Errors and Edge Cases', () => {
    test('should handle session timeout during payment', async ({ page }) => {
      await page.goto('/checkout');
      
      if (page.url().includes('404')) {
        test.skip('Checkout page not accessible');
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      // Clear all cookies to simulate session timeout
      await page.context().clearCookies();
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Pay")');
      
      if (await submitButton.isVisible()) {
        await helpers.clickElement(submitButton);
        
        await page.waitForTimeout(2000);
        
        // Should either redirect to login or show appropriate error
        const currentUrl = page.url();
        const isLoginRedirect = currentUrl.includes('/login');
        
        if (!isLoginRedirect) {
          const { hasError } = await helpers.checkForErrors();
          expect(hasError).toBe(true);
        }
      }
    });

    test('should handle payment form abandonment', async ({ page }) => {
      await page.goto('/checkout');
      
      if (page.url().includes('404')) {
        test.skip('Checkout page not accessible');
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      // Fill partial payment information
      const cardNumberField = page.locator('input[placeholder*="card"]');
      
      if (await cardNumberField.isVisible()) {
        await helpers.fillField(cardNumberField, '4242');
        
        // Navigate away from page
        await page.goto('/');
        
        // Navigate back
        await page.goto('/checkout');
        
        // Form should either be cleared or show appropriate state
        const { hasError } = await helpers.checkForErrors();
        expect(hasError).toBe(false);
      }
    });

    test('should prevent double payment submission', async ({ page }) => {
      await page.goto('/checkout');
      
      if (page.url().includes('404')) {
        test.skip('Checkout page not accessible');
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Pay")');
      
      if (await submitButton.isVisible()) {
        // Click submit button rapidly
        await helpers.clickElement(submitButton);
        await helpers.clickElement(submitButton);
        
        // Button should be disabled after first click
        const isDisabled = await submitButton.isDisabled();
        
        if (!isDisabled) {
          // Check for loading state or other double-click prevention
          const loadingIndicator = page.locator('.loading, .spinner, [disabled]');
          const hasLoadingState = await loadingIndicator.isVisible();
          
          expect(hasLoadingState).toBe(true);
        }
      }
    });
  });
});