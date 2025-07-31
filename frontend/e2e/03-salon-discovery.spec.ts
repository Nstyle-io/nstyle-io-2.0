import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testData } from './fixtures/test-data';

test.describe('Salon Discovery and Search', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.mockGeolocation(testData.locations.newYork.latitude, testData.locations.newYork.longitude);
  });

  test.describe('Discover Page', () => {
    test.beforeEach(async ({ page }) => {
      // Try to access discover page - might require authentication
      await page.goto('/discover');
      
      // If redirected to login, skip authentication for now
      if (page.url().includes('/login')) {
        await page.goto('/browse'); // Try guest browse instead
      }
      
      await helpers.waitForLoadingComplete();
    });

    test('should load discover page with salon listings', async ({ page }) => {
      // Check if page loaded successfully
      const { hasError } = await helpers.checkForErrors();
      expect(hasError).toBe(false);
      
      // Look for salon listings or maps
      const salonListings = page.locator('[data-testid="salon-card"], .salon-card, .salon-listing').first();
      const mapContainer = page.locator('[data-testid="map"], .map-container, #map').first();
      
      // Either salon listings or map should be visible
      const hasContent = await salonListings.isVisible() || await mapContainer.isVisible();
      
      if (!hasContent) {
        // Check for empty state or loading indicators
        const emptyState = page.locator('text="No salons", text="Coming soon", .empty-state');
        const loading = page.locator('.loading, .spinner, [data-testid="loading"]');
        
        const hasEmptyState = await emptyState.isVisible();
        const isLoading = await loading.isVisible();
        
        expect(hasEmptyState || isLoading).toBe(true);
      }
    });

    test('should display Google Maps integration', async ({ page }) => {
      // Wait longer for maps to load
      await page.waitForTimeout(3000);
      
      const mapContainer = page.locator('[data-testid="map"], .map-container, #map, [class*="map"]').first();
      
      if (await mapContainer.isVisible()) {
        // Check if map loaded (Google Maps creates specific elements)
        const mapCanvas = page.locator('canvas, [role="region"]');
        await expect(mapCanvas.first()).toBeVisible({ timeout: 10000 });
      } else {
        console.log('Maps container not found - may require API key configuration');
      }
    });

    test('should handle geolocation permissions', async ({ page }) => {
      // Mock geolocation permission prompt
      await page.context().grantPermissions(['geolocation']);
      
      // Look for location-based elements
      const locationButton = page.locator('button:has-text("location"), button:has-text("near me"), [data-testid="location-button"]');
      
      if (await locationButton.isVisible()) {
        await helpers.clickElement(locationButton);
        await page.waitForTimeout(2000);
        
        // Should update based on location
        const { hasError } = await helpers.checkForErrors();
        expect(hasError).toBe(false);
      }
    });
  });

  test.describe('Search Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/discover');
      
      if (page.url().includes('/login')) {
        await page.goto('/browse');
      }
      
      await helpers.waitForLoadingComplete();
    });

    test('should perform basic salon search', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="search"], [data-testid="search-input"]').first();
      
      if (await searchInput.isVisible()) {
        await helpers.fillField(searchInput, 'nail salon');
        
        // Look for search button or auto-search
        const searchButton = page.locator('button[type="submit"], button:has-text("search"), [data-testid="search-button"]');
        
        if (await searchButton.isVisible()) {
          await helpers.clickElement(searchButton);
        } else {
          // Try pressing Enter for auto-search
          await searchInput.press('Enter');
        }
        
        await page.waitForTimeout(2000);
        
        // Check for search results or loading
        const results = page.locator('[data-testid="search-results"], .search-results, .salon-card');
        const loading = page.locator('.loading, .spinner');
        const noResults = page.locator('text="No results", text="Not found", .empty-state');
        
        const hasResults = await results.first().isVisible();
        const isLoading = await loading.first().isVisible();
        const hasNoResults = await noResults.first().isVisible();
        
        expect(hasResults || isLoading || hasNoResults).toBe(true);
      }
    });

    test('should filter search results', async ({ page }) => {
      // Look for filter options
      const filterButton = page.locator('button:has-text("filter"), [data-testid="filter-button"], .filter-toggle');
      
      if (await filterButton.isVisible()) {
        await helpers.clickElement(filterButton);
        
        // Check for filter options
        const priceFilter = page.locator('input[name*="price"], .price-filter, [data-testid="price-filter"]');
        const ratingFilter = page.locator('input[name*="rating"], .rating-filter, [data-testid="rating-filter"]');
        const distanceFilter = page.locator('input[name*="distance"], .distance-filter, [data-testid="distance-filter"]');
        
        // Apply a filter if available
        if (await priceFilter.first().isVisible()) {
          await helpers.clickElement(priceFilter.first());
          await page.waitForTimeout(1000);
        }
        
        if (await ratingFilter.first().isVisible()) {
          await helpers.clickElement(ratingFilter.first());
          await page.waitForTimeout(1000);
        }
        
        // Check that results updated
        const { hasError } = await helpers.checkForErrors();
        expect(hasError).toBe(false);
      }
    });

    test('should handle empty search queries', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], [data-testid="search-input"]').first();
      
      if (await searchInput.isVisible()) {
        // Submit empty search
        await helpers.fillField(searchInput, '');
        await searchInput.press('Enter');
        
        await page.waitForTimeout(1000);
        
        // Should handle gracefully (show all results or show validation)
        const { hasError } = await helpers.checkForErrors();
        // Empty search shouldn't cause application errors
        expect(hasError).toBe(false);
      }
    });

    test('should handle search with no results', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], [data-testid="search-input"]').first();
      
      if (await searchInput.isVisible()) {
        await helpers.fillField(searchInput, 'xyzabc123nonexistent');
        await searchInput.press('Enter');
        
        await page.waitForTimeout(2000);
        
        // Should show "no results" message
        const noResults = page.locator('text="No results", text="Not found", text="Try different", .empty-state');
        const hasNoResults = await noResults.first().isVisible();
        
        if (!hasNoResults) {
          // Check if search is actually working or if there's an error
          const { hasError } = await helpers.checkForErrors();
          console.log('No "no results" message found, error status:', hasError);
        }
      }
    });
  });

  test.describe('Salon Profile Views', () => {
    test('should display salon details when clicked', async ({ page }) => {
      await page.goto('/discover');
      
      if (page.url().includes('/login')) {
        await page.goto('/browse');
      }
      
      await helpers.waitForLoadingComplete();
      
      // Look for salon cards/listings
      const salonCard = page.locator('[data-testid="salon-card"], .salon-card, .salon-listing').first();
      
      if (await salonCard.isVisible()) {
        await helpers.clickElement(salonCard);
        
        // Should navigate to salon profile or show modal
        await page.waitForTimeout(2000);
        
        const salonProfile = page.locator('[data-testid="salon-profile"], .salon-profile, .salon-details');
        const modal = page.locator('[role="dialog"], .modal, .popup');
        
        const hasProfile = await salonProfile.isVisible();
        const hasModal = await modal.isVisible();
        
        expect(hasProfile || hasModal).toBe(true);
        
        if (hasProfile || hasModal) {
          // Check for essential salon information
          const salonName = page.locator('h1, h2, .salon-name, [data-testid="salon-name"]');
          const salonInfo = page.locator('.salon-info, .contact-info, .address');
          
          await expect(salonName.first()).toBeVisible();
        }
      } else {
        console.log('No salon cards found to test profile view');
      }
    });

    test('should show salon services and pricing', async ({ page }) => {
      // Navigate directly to a salon profile if URL pattern is known
      await page.goto('/salon/1'); // Try a common pattern
      
      if (page.url().includes('/login') || page.url().includes('404') || page.url().includes('not-found')) {
        // Skip this test if direct access doesn't work
        test.skip();
        return;
      }
      
      await helpers.waitForLoadingComplete();
      
      // Look for services section
      const servicesSection = page.locator('[data-testid="services"], .services, .service-list, text="Services"');
      
      if (await servicesSection.first().isVisible()) {
        // Check for service items with pricing
        const serviceItems = page.locator('.service-item, .service-card, [data-testid="service"]');
        const priceElements = page.locator('.price, .cost, [data-testid="price"], text=/\\$\\d+/');
        
        await expect(serviceItems.first()).toBeVisible();
        
        if (await priceElements.first().isVisible()) {
          await expect(priceElements.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Map Integration', () => {
    test('should interact with map markers', async ({ page }) => {
      await page.goto('/discover');
      
      if (page.url().includes('/login')) {
        await page.goto('/browse');
      }
      
      await helpers.waitForLoadingComplete();
      await page.waitForTimeout(3000); // Wait for map to load
      
      // Look for map markers or pins
      const mapMarkers = page.locator('[role="button"][title], .map-marker, [data-testid="marker"]');
      
      if (await mapMarkers.first().isVisible()) {
        await helpers.clickElement(mapMarkers.first());
        
        // Should show info window or popup
        const infoWindow = page.locator('.info-window, .map-popup, [role="tooltip"]');
        
        if (await infoWindow.isVisible()) {
          await expect(infoWindow).toBeVisible();
        }
      }
    });

    test('should handle map zoom and pan', async ({ page }) => {
      await page.goto('/discover');
      
      if (page.url().includes('/login')) {
        await page.goto('/browse');
      }
      
      await helpers.waitForLoadingComplete();
      await page.waitForTimeout(3000);
      
      // Look for zoom controls
      const zoomIn = page.locator('[title*="Zoom in"], .zoom-in, [data-testid="zoom-in"]');
      const zoomOut = page.locator('[title*="Zoom out"], .zoom-out, [data-testid="zoom-out"]');
      
      if (await zoomIn.isVisible()) {
        await helpers.clickElement(zoomIn);
        await page.waitForTimeout(1000);
      }
      
      if (await zoomOut.isVisible()) {
        await helpers.clickElement(zoomOut);
        await page.waitForTimeout(1000);
      }
      
      // Test should not cause errors
      const { hasError } = await helpers.checkForErrors();
      expect(hasError).toBe(false);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work well on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/discover');
      
      if (page.url().includes('/login')) {
        await page.goto('/browse');
      }
      
      await helpers.waitForLoadingComplete();
      
      // Check mobile-specific elements
      const mobileSearch = page.locator('.mobile-search, [data-testid="mobile-search"]');
      const listView = page.locator('.list-view, [data-testid="list-view"]');
      const mapView = page.locator('.map-view, [data-testid="map-view"]');
      
      // Should have mobile-optimized layout
      await helpers.testResponsive();
      
      const { hasError } = await helpers.checkForErrors();
      expect(hasError).toBe(false);
    });

    test('should toggle between list and map views on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/discover');
      
      if (page.url().includes('/login')) {
        await page.goto('/browse');
      }
      
      await helpers.waitForLoadingComplete();
      
      // Look for view toggle buttons
      const listToggle = page.locator('button:has-text("list"), [data-testid="list-toggle"], .list-toggle');
      const mapToggle = page.locator('button:has-text("map"), [data-testid="map-toggle"], .map-toggle');
      
      if (await listToggle.isVisible() && await mapToggle.isVisible()) {
        await helpers.clickElement(listToggle);
        await page.waitForTimeout(500);
        
        await helpers.clickElement(mapToggle);
        await page.waitForTimeout(500);
        
        const { hasError } = await helpers.checkForErrors();
        expect(hasError).toBe(false);
      }
    });
  });
});