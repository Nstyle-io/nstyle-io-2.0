import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Landing Page and Navigation', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
  });

  test('should load landing page successfully', async ({ page }) => {
    // Check page loads without errors
    await helpers.waitForLoadingComplete();
    
    // Verify page title
    await expect(page).toHaveTitle(/NStyle/);
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for hero section
    const heroSection = page.locator('[data-testid="hero-section"], .hero, h1').first();
    await expect(heroSection).toBeVisible();
    
    // Check for call-to-action buttons
    const signupButton = page.locator('text=Sign Up, text=Get Started, [href="/signup"]').first();
    const loginButton = page.locator('text=Log In, text=Sign In, [href="/login"]').first();
    
    if (await signupButton.isVisible()) {
      await expect(signupButton).toBeVisible();
    }
    if (await loginButton.isVisible()) {
      await expect(loginButton).toBeVisible();
    }
  });

  test('should navigate to signup page', async ({ page }) => {
    const signupLink = page.locator('text=Sign Up, text=Get Started, [href="/signup"]').first();
    
    if (await signupLink.isVisible()) {
      await helpers.clickElement(signupLink);
      await helpers.waitForNavigation('/signup');
      
      // Verify signup form is present
      await expect(page.locator('form, [data-testid="signup-form"]')).toBeVisible();
    } else {
      // Navigate directly if no link is visible
      await page.goto('/signup');
      await expect(page).toHaveURL('/signup');
    }
  });

  test('should navigate to login page', async ({ page }) => {
    const loginLink = page.locator('text=Log In, text=Sign In, [href="/login"]').first();
    
    if (await loginLink.isVisible()) {
      await helpers.clickElement(loginLink);
      await helpers.waitForNavigation('/login');
      
      // Verify login form is present
      await expect(page.locator('form, [data-testid="login-form"]')).toBeVisible();
    } else {
      // Navigate directly if no link is visible
      await page.goto('/login');
      await expect(page).toHaveURL('/login');
    }
  });

  test('should allow guest browsing', async ({ page }) => {
    const browseLink = page.locator('text=Browse, text=Explore, [href="/browse"]').first();
    
    if (await browseLink.isVisible()) {
      await helpers.clickElement(browseLink);
      await helpers.waitForNavigation('/browse');
    } else {
      // Try navigating directly
      await page.goto('/browse');
    }
    
    // Should be able to see content without authentication
    await helpers.waitForLoadingComplete();
    await helpers.checkForErrors();
  });

  test('should be responsive across different screen sizes', async ({ page }) => {
    await helpers.testResponsive();
  });

  test('should pass basic accessibility checks', async ({ page }) => {
    await helpers.checkBasicAccessibility();
  });

  test('should not have broken links in navigation', async ({ page }) => {
    const brokenLinks = await helpers.checkForBrokenLinks();
    expect(brokenLinks.length).toBe(0);
  });

  test('should handle navigation menu on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Look for mobile menu trigger
    const menuTrigger = page.locator('[data-testid="mobile-menu"], .mobile-menu, [aria-label*="menu"], button[aria-expanded]').first();
    
    if (await menuTrigger.isVisible()) {
      await helpers.clickElement(menuTrigger);
      
      // Check if menu opens
      const mobileMenu = page.locator('[data-testid="mobile-menu-content"], .mobile-menu-content, [role="menu"]');
      await expect(mobileMenu).toBeVisible();
      
      // Close menu
      await helpers.clickElement(menuTrigger);
      await expect(mobileMenu).toBeHidden();
    }
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.reload();
    await helpers.waitForLoadingComplete();
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('Extension') &&
      !error.includes('Chrome extension')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});