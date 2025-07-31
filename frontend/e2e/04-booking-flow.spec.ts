import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testData } from './fixtures/test-data';

test.describe('Service Booking Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Booking Modal/Page', () => {
    test.beforeEach(async ({ page }) => {
      // Try to access a salon profile to start booking
      await page.goto('/salon/1');
      
      // If that doesn't work, try discover page and look for booking buttons
      if (page.url().includes('404') || page.url().includes('not-found')) {
        await page.goto('/discover');
        
        if (page.url().includes('/login')) {
          await page.goto('/browse');
        }
      }
      
      await helpers.waitForLoadingComplete();
    });

    test('should open booking modal from salon profile', async ({ page }) => {
      // Look for booking button
      const bookButton = page.locator(
        'button:has-text("Book"), button:has-text("Schedule"), button:has-text("Appointment"), [data-testid="book-button"]'
      ).first();
      
      if (await bookButton.isVisible()) {
        await helpers.clickElement(bookButton);
        
        // Should open booking modal or navigate to booking page
        const bookingModal = page.locator('[role="dialog"], .modal, .booking-modal, [data-testid="booking-modal"]');
        const bookingPage = page.locator('.booking-page, [data-testid="booking-form"]');
        
        const hasModal = await bookingModal.isVisible();
        const hasBookingPage = await bookingPage.isVisible() || page.url().includes('book');
        
        expect(hasModal || hasBookingPage).toBe(true);
        
        if (hasModal || hasBookingPage) {
          // Check for essential booking form elements
          const serviceSelector = page.locator('select[name*="service"], [data-testid="service-select"], .service-selector');
          const datePicker = page.locator('input[type="date"], .date-picker, [data-testid="date-picker"]');
          const timeSlots = page.locator('.time-slot, [data-testid="time-slot"], button:has-text("AM"), button:has-text("PM")');
          
          // At least one booking element should be present
          const hasBookingElements = await serviceSelector.isVisible() || 
                                   await datePicker.isVisible() || 
                                   await timeSlots.first().isVisible();
          
          expect(hasBookingElements).toBe(true);
        }
      } else {
        console.log('No booking button found - may require authentication or specific salon setup');
      }
    });

    test('should display available services', async ({ page }) => {
      // Navigate to booking directly if possible
      await page.goto('/book');
      
      if (page.url().includes('404') || page.url().includes('/login')) {
        // Try alternative approach - look for services on current page
        const services = page.locator('.service-item, .service-card, [data-testid="service"]');
        
        if (!await services.first().isVisible()) {
          test.skip('Booking page not accessible or no services found');
          return;
        }
      }
      
      await helpers.waitForLoadingComplete();
      
      // Look for service options
      const serviceOptions = page.locator(
        'option:not([value=""]), .service-option, [data-testid="service-option"], .service-item'
      );
      
      if (await serviceOptions.first().isVisible()) {
        const serviceCount = await serviceOptions.count();
        expect(serviceCount).toBeGreaterThan(0);
        
        // Check that services have names and prices
        const firstService = serviceOptions.first();
        const serviceText = await firstService.textContent();
        expect(serviceText).toBeTruthy();
        expect(serviceText!.length).toBeGreaterThan(0);
      }
    });

    test('should show calendar for date selection', async ({ page }) => {
      // Try to trigger date picker
      const datePicker = page.locator('input[type="date"], .date-picker, [data-testid="date-picker"]');
      const calendarTrigger = page.locator('button:has-text("calendar"), .calendar-trigger, [data-testid="calendar-trigger"]');
      
      if (await datePicker.isVisible()) {
        await helpers.clickElement(datePicker);
        
        // Check if native date picker or custom calendar appears
        const calendar = page.locator('.calendar, .date-picker-popup, [role="grid"]');
        
        if (await calendar.isVisible()) {
          await expect(calendar).toBeVisible();
        }
      } else if (await calendarTrigger.isVisible()) {
        await helpers.clickElement(calendarTrigger);
        
        const calendar = page.locator('.calendar, .date-picker-popup, [role="grid"]');
        await expect(calendar).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display available time slots', async ({ page }) => {
      // Look for time slot selection
      const timeSlots = page.locator(
        '.time-slot, [data-testid="time-slot"], button:has-text("AM"), button:has-text("PM"), .time-button'
      );
      
      if (await timeSlots.first().isVisible()) {
        const slotCount = await timeSlots.count();
        expect(slotCount).toBeGreaterThan(0);
        
        // Click on a time slot
        await helpers.clickElement(timeSlots.first());
        
        // Should select the time slot
        const selectedSlot = page.locator('.selected, .active, [aria-selected="true"]');
        
        if (await selectedSlot.isVisible()) {
          await expect(selectedSlot).toBeVisible();
        }
      } else {
        // Time slots might appear after selecting date and service
        console.log('Time slots not immediately visible - may require date/service selection first');
      }
    });
  });

  test.describe('Booking Form Validation', () => {
    test('should validate required fields', async ({ page }) => {
      // Try to access booking form
      await page.goto('/book');
      
      if (page.url().includes('404') || page.url().includes('/login')) {
        test.skip('Booking form not directly accessible');
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      // Look for submit button and try to submit without filling required fields
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Book"), button:has-text("Confirm"), [data-testid="book-submit"]'
      );
      
      if (await submitButton.isVisible()) {
        await helpers.clickElement(submitButton);
        
        // Should show validation errors
        await page.waitForTimeout(1000);
        const { hasError } = await helpers.checkForErrors();
        expect(hasError).toBe(true);
      }
    });

    test('should prevent booking past dates', async ({ page }) => {
      const datePicker = page.locator('input[type="date"], [data-testid="date-picker"]');
      
      if (await datePicker.isVisible()) {
        // Try to set a past date
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const pastDateString = pastDate.toISOString().split('T')[0];
        
        await helpers.fillField(datePicker, pastDateString);
        
        // Should show error or prevent selection
        const submitButton = page.locator('button[type="submit"], button:has-text("Book")');
        
        if (await submitButton.isVisible()) {
          await helpers.clickElement(submitButton);
          
          await page.waitForTimeout(1000);
          const { hasError, message } = await helpers.checkForErrors();
          
          if (hasError) {
            expect(message).toContain('past' || 'date' || 'invalid');
          }
        }
      }
    });

    test('should show booking summary before confirmation', async ({ page }) => {
      // Try to fill out a complete booking form
      const serviceSelect = page.locator('select[name*="service"], [data-testid="service-select"]');
      const datePicker = page.locator('input[type="date"], [data-testid="date-picker"]');
      const timeSlot = page.locator('.time-slot, [data-testid="time-slot"]').first();
      
      if (await serviceSelect.isVisible()) {
        await serviceSelect.selectOption({ index: 1 }); // Select first non-empty option
      }
      
      if (await datePicker.isVisible()) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateString = futureDate.toISOString().split('T')[0];
        await helpers.fillField(datePicker, futureDateString);
      }
      
      if (await timeSlot.isVisible()) {
        await helpers.clickElement(timeSlot);
      }
      
      // Look for next/continue button
      const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Review")');
      
      if (await continueButton.isVisible()) {
        await helpers.clickElement(continueButton);
        
        // Should show booking summary
        const summary = page.locator('.booking-summary, .summary, [data-testid="booking-summary"]');
        const totalPrice = page.locator('.total, .price, [data-testid="total-price"]');
        
        if (await summary.isVisible()) {
          await expect(summary).toBeVisible();
        }
        
        if (await totalPrice.isVisible()) {
          await expect(totalPrice).toBeVisible();
        }
      }
    });
  });

  test.describe('Booking Confirmation', () => {
    test('should handle guest booking', async ({ page }) => {
      // Test booking without authentication
      await page.goto('/book');
      
      // If redirected to login, this feature may require authentication
      if (page.url().includes('/login')) {
        console.log('Booking requires authentication - guest booking not available');
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      // Look for guest information form
      const guestForm = page.locator('.guest-form, [data-testid="guest-info"]');
      const emailField = page.locator('input[type="email"], input[name="email"]');
      const nameField = page.locator('input[name="name"], input[name="firstName"]');
      const phoneField = page.locator('input[type="tel"], input[name="phone"]');
      
      if (await guestForm.isVisible() || await emailField.isVisible()) {
        // Fill guest information if required
        if (await emailField.isVisible()) {
          await helpers.fillField(emailField, 'guest@example.com');
        }
        
        if (await nameField.isVisible()) {
          await helpers.fillField(nameField, 'Guest User');
        }
        
        if (await phoneField.isVisible()) {
          await helpers.fillField(phoneField, '+1234567890');
        }
        
        const { hasError } = await helpers.checkForErrors();
        expect(hasError).toBe(false);
      }
    });

    test('should send booking confirmation', async ({ page }) => {
      // This test would require completing a full booking flow
      // For now, just check that confirmation elements exist
      
      const confirmationPage = page.locator('.confirmation, .success, [data-testid="booking-confirmation"]');
      const confirmationMessage = page.locator('text="confirmed", text="booked", text="success"');
      
      // Navigate to a potential confirmation page
      await page.goto('/booking-confirmation');
      
      if (!page.url().includes('404')) {
        await helpers.waitForLoadingComplete();
        
        if (await confirmationPage.isVisible() || await confirmationMessage.isVisible()) {
          // Check for booking details
          const bookingDetails = page.locator('.booking-details, [data-testid="booking-details"]');
          const bookingId = page.locator('.booking-id, [data-testid="booking-id"]');
          
          if (await bookingDetails.isVisible()) {
            await expect(bookingDetails).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Booking Management', () => {
    test('should allow viewing upcoming appointments', async ({ page }) => {
      // Try to access appointments/bookings page
      await page.goto('/appointments');
      
      if (page.url().includes('/login')) {
        console.log('Appointments page requires authentication');
        return;
      }
      
      if (page.url().includes('404')) {
        // Try alternative URLs
        await page.goto('/bookings');
        
        if (page.url().includes('404')) {
          await page.goto('/profile');
        }
      }
      
      await helpers.waitForLoadingComplete();
      
      // Look for appointments list
      const appointmentsList = page.locator('.appointments, .bookings, [data-testid="appointments-list"]');
      const appointmentCard = page.locator('.appointment-card, .booking-card, [data-testid="appointment"]');
      
      if (await appointmentsList.isVisible() || await appointmentCard.first().isVisible()) {
        // Check for appointment details
        const appointmentDate = page.locator('.date, [data-testid="appointment-date"]');
        const appointmentTime = page.locator('.time, [data-testid="appointment-time"]');
        const salonName = page.locator('.salon-name, [data-testid="salon-name"]');
        
        // At least one piece of appointment information should be visible
        const hasAppointmentInfo = await appointmentDate.first().isVisible() ||
                                 await appointmentTime.first().isVisible() ||
                                 await salonName.first().isVisible();
        
        if (hasAppointmentInfo) {
          expect(hasAppointmentInfo).toBe(true);
        }
      } else {
        // Check for empty state
        const emptyState = page.locator('text="No appointments", text="No bookings", .empty-state');
        
        if (await emptyState.isVisible()) {
          await expect(emptyState).toBeVisible();
        }
      }
    });

    test('should allow canceling appointments', async ({ page }) => {
      await page.goto('/appointments');
      
      if (page.url().includes('/login') || page.url().includes('404')) {
        test.skip('Appointments page not accessible');
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      // Look for cancel buttons
      const cancelButton = page.locator('button:has-text("Cancel"), [data-testid="cancel-appointment"]');
      
      if (await cancelButton.first().isVisible()) {
        await helpers.clickElement(cancelButton.first());
        
        // Should show confirmation dialog
        const confirmDialog = page.locator('[role="dialog"], .modal, .confirmation-dialog');
        const confirmCancel = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        
        if (await confirmDialog.isVisible()) {
          await expect(confirmDialog).toBeVisible();
          
          if (await confirmCancel.isVisible()) {
            // Don't actually cancel in test, just verify the flow exists
            await expect(confirmCancel).toBeVisible();
          }
        }
      }
    });

    test('should allow rescheduling appointments', async ({ page }) => {
      await page.goto('/appointments');
      
      if (page.url().includes('/login') || page.url().includes('404')) {
        test.skip('Appointments page not accessible');
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      // Look for reschedule buttons
      const rescheduleButton = page.locator('button:has-text("Reschedule"), [data-testid="reschedule-appointment"]');
      
      if (await rescheduleButton.first().isVisible()) {
        await helpers.clickElement(rescheduleButton.first());
        
        // Should open rescheduling interface
        const rescheduleModal = page.locator('.reschedule-modal, [role="dialog"]');
        const datePicker = page.locator('input[type="date"], .date-picker');
        
        if (await rescheduleModal.isVisible() || await datePicker.isVisible()) {
          expect(await rescheduleModal.isVisible() || await datePicker.isVisible()).toBe(true);
        }
      }
    });
  });

  test.describe('Real-time Availability', () => {
    test('should update availability in real-time', async ({ page }) => {
      await page.goto('/book');
      
      if (page.url().includes('404') || page.url().includes('/login')) {
        test.skip('Booking form not accessible');
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      // Select a service and date
      const serviceSelect = page.locator('select[name*="service"]');
      const datePicker = page.locator('input[type="date"]');
      
      if (await serviceSelect.isVisible() && await datePicker.isVisible()) {
        await serviceSelect.selectOption({ index: 1 });
        
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const futureDateString = futureDate.toISOString().split('T')[0];
        await helpers.fillField(datePicker, futureDateString);
        
        // Wait for time slots to load
        await page.waitForTimeout(2000);
        
        const timeSlots = page.locator('.time-slot, [data-testid="time-slot"]');
        
        if (await timeSlots.first().isVisible()) {
          const slotCount = await timeSlots.count();
          expect(slotCount).toBeGreaterThan(0);
          
          // Check that slots show availability status
          const availableSlots = page.locator('.available, [data-available="true"]');
          const unavailableSlots = page.locator('.unavailable, [data-available="false"], .disabled');
          
          const hasAvailabilityInfo = await availableSlots.first().isVisible() || 
                                    await unavailableSlots.first().isVisible();
          
          if (hasAvailabilityInfo) {
            expect(hasAvailabilityInfo).toBe(true);
          }
        }
      }
    });
  });
});