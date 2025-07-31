import { Page, expect, Locator } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for element to be visible and stable before interacting
   */
  async waitForElementStable(locator: Locator, timeout = 5000) {
    await locator.waitFor({ state: 'visible', timeout });
    // Wait for animations to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill form field with proper validation
   */
  async fillField(locator: Locator, value: string, options?: {
    clear?: boolean;
    pressEnter?: boolean;
  }) {
    await this.waitForElementStable(locator);
    if (options?.clear) {
      await locator.clear();
    }
    await locator.fill(value);
    if (options?.pressEnter) {
      await locator.press('Enter');
    }
  }

  /**
   * Click element with proper waiting and validation
   */
  async clickElement(locator: Locator, options?: {
    force?: boolean;
    timeout?: number;
  }) {
    await this.waitForElementStable(locator, options?.timeout);
    await locator.click({ force: options?.force });
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(expectedUrl?: string) {
    await this.page.waitForLoadState('networkidle');
    if (expectedUrl) {
      await expect(this.page).toHaveURL(expectedUrl);
    }
  }

  /**
   * Check for error messages
   */
  async checkForErrors() {
    const errorSelectors = [
      '[role="alert"]',
      '.error',
      '.error-message',
      '[data-testid="error"]',
      '.text-red-500',
      '.text-destructive'
    ];

    for (const selector of errorSelectors) {
      const errorElement = this.page.locator(selector);
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.warn(`Error found: ${errorText}`);
        return { hasError: true, message: errorText };
      }
    }
    return { hasError: false, message: null };
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete() {
    // Wait for various loading indicators to disappear
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '.skeleton',
      '[aria-label="Loading"]'
    ];

    for (const selector of loadingSelectors) {
      const loadingElement = this.page.locator(selector);
      if (await loadingElement.isVisible()) {
        await loadingElement.waitFor({ state: 'hidden', timeout: 10000 });
      }
    }
  }

  /**
   * Generate test user credentials
   */
  generateTestUser() {
    const timestamp = Date.now();
    return {
      email: `test-user-${timestamp}@example.com`,
      password: 'TestPass123!',
      username: `testuser${timestamp}`,
      displayName: `Test User ${timestamp}`
    };
  }

  /**
   * Generate test salon data
   */
  generateTestSalon() {
    const timestamp = Date.now();
    return {
      name: `Test Salon ${timestamp}`,
      email: `salon-${timestamp}@example.com`,
      phone: '+1234567890',
      address: '123 Test Street, Test City, TC 12345',
      description: 'A beautiful test salon for nail art and beauty services.'
    };
  }

  /**
   * Mock geolocation for testing
   */
  async mockGeolocation(latitude = 40.7128, longitude = -74.0060) {
    await this.page.context().setGeolocation({ latitude, longitude });
    await this.page.context().grantPermissions(['geolocation']);
  }

  /**
   * Check accessibility basics
   */
  async checkBasicAccessibility() {
    // Check for alt texts on images
    const images = this.page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      if (!alt && src && !src.startsWith('data:')) {
        console.warn(`Image without alt text: ${src}`);
      }
    }

    // Check for proper heading hierarchy
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    if (headings.length === 0) {
      console.warn('No headings found on page');
    }

    // Check for form labels
    const inputs = this.page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate((el) => {
        const id = el.getAttribute('id');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        return !!(ariaLabel || ariaLabelledBy || label);
      });
      
      if (!hasLabel) {
        const name = await input.getAttribute('name') || 'unnamed';
        console.warn(`Input without proper label: ${name}`);
      }
    }
  }

  /**
   * Test responsive design at different viewport sizes
   */
  async testResponsive() {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500); // Allow time for responsive changes
      
      // Check for horizontal scrollbars (usually indicates responsive issues)
      const hasHorizontalScroll = await this.page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      if (hasHorizontalScroll) {
        console.warn(`Horizontal scroll detected at ${viewport.name} (${viewport.width}x${viewport.height})`);
      }
    }
  }

  /**
   * Check for broken links and images
   */
  async checkForBrokenLinks() {
    const links = this.page.locator('a[href]');
    const linkCount = await links.count();
    const brokenLinks: string[] = [];

    for (let i = 0; i < Math.min(linkCount, 20); i++) { // Limit to first 20 links
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        try {
          const response = await this.page.request.get(href);
          if (!response.ok()) {
            brokenLinks.push(`${href} (${response.status()})`);
          }
        } catch (error) {
          brokenLinks.push(`${href} (Network error)`);
        }
      }
    }

    if (brokenLinks.length > 0) {
      console.warn('Broken links found:', brokenLinks);
    }

    return brokenLinks;
  }
}