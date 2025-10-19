const { test, expect } = require('@playwright/test');

/**
 * Comprehensive Responsive Design Testing Suite
 * Tests actual viewport rendering and identifies layout issues
 */

const BASE_URL = 'file://' + __dirname + '/../auth.html';

// Test viewports based on real-world screen sizes
const viewports = {
  smallDesktop: { width: 1024, height: 768, name: 'Small Desktop (1024x768)' },
  laptop: { width: 1366, height: 768, name: 'Laptop (1366x768)' },
  tablet: { width: 768, height: 1024, name: 'Tablet Portrait (768x1024)' },
  mobile: { width: 375, height: 667, name: 'iPhone SE (375x667)' },
  largeMobile: { width: 414, height: 896, name: 'iPhone XR (414x896)' },
};

test.describe('Responsive Design Audit', () => {

  // Test each viewport
  for (const [key, viewport] of Object.entries(viewports)) {
    test.describe(`${viewport.name}`, () => {

      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      test('should load auth page without horizontal scroll', async ({ page }) => {
        await page.goto(BASE_URL);

        // Check for horizontal scrollbar
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const windowWidth = await page.evaluate(() => window.innerWidth);

        console.log(`[${viewport.name}] Body width: ${bodyWidth}px, Window width: ${windowWidth}px`);
        expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 1); // Allow 1px tolerance
      });

      test('should have visible and clickable auth buttons', async ({ page }) => {
        await page.goto(BASE_URL);

        const faidaoBtn = page.locator('button:has-text("Faidao")');
        const filipBtn = page.locator('button:has-text("Filip")');

        await expect(faidaoBtn).toBeVisible();
        await expect(filipBtn).toBeVisible();

        const faidaoBBox = await faidaoBtn.boundingBox();
        const filipBBox = await filipBtn.boundingBox();

        console.log(`[${viewport.name}] Faidao button: ${JSON.stringify(faidaoBBox)}`);
        console.log(`[${viewport.name}] Filip button: ${JSON.stringify(filipBBox)}`);

        // Buttons should not be cut off
        expect(faidaoBBox.y).toBeGreaterThanOrEqual(0);
        expect(filipBBox.y).toBeGreaterThanOrEqual(0);
      });
    });
  }

  // Specific Sudoku page tests
  test.describe('Sudoku Game Page', () => {

    test('Small Desktop (1024x768) - Game elements visibility', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto(BASE_URL);

      // Mock authentication
      await page.evaluate(() => {
        sessionStorage.setItem('sudokuAuth', 'authenticated');
        sessionStorage.setItem('currentPlayer', 'filip');
      });

      await page.goto('file://' + __dirname + '/../index.html');
      await page.waitForLoadState('networkidle');

      // Click on Play Sudoku
      await page.click('[data-page="sudoku"]');
      await page.waitForTimeout(500);

      // Take screenshot for manual inspection
      await page.screenshot({
        path: 'tests/screenshots/small-desktop-sudoku.png',
        fullPage: true
      });

      // Check viewport dimensions
      const viewportInfo = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
        hasVerticalScroll: document.documentElement.scrollHeight > window.innerHeight,
      }));

      console.log('Small Desktop Viewport Info:', JSON.stringify(viewportInfo, null, 2));

      // Report issues
      if (viewportInfo.hasHorizontalScroll) {
        console.error('❌ ISSUE: Horizontal scrollbar detected on small desktop!');
      }
    });

    test('Check Sudoku grid size on different viewports', async ({ page }) => {
      const gridSizes = {};

      for (const [key, viewport] of Object.entries(viewports)) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(BASE_URL);

        await page.evaluate(() => {
          sessionStorage.setItem('sudokuAuth', 'authenticated');
          sessionStorage.setItem('currentPlayer', 'filip');
        });

        await page.goto('file://' + __dirname + '/../index.html');
        await page.waitForLoadState('networkidle');

        // Wait for sudoku engine to initialize
        await page.waitForTimeout(1000);

        // Check if sudoku grid exists
        const gridExists = await page.evaluate(() => {
          return !!document.querySelector('.sudoku-grid');
        });

        if (gridExists) {
          const gridInfo = await page.evaluate(() => {
            const grid = document.querySelector('.sudoku-grid');
            const container = document.querySelector('.sudoku-grid-container');

            if (!grid || !container) return null;

            const gridRect = grid.getBoundingClientRect();
            const containerRect = container.getBoundingBox();

            return {
              gridWidth: gridRect.width,
              gridHeight: gridRect.height,
              gridVisible: gridRect.width > 0 && gridRect.height > 0,
              gridTop: gridRect.top,
              gridLeft: gridRect.left,
              viewportWidth: window.innerWidth,
              viewportHeight: window.innerHeight,
              fitsInViewport: gridRect.right <= window.innerWidth && gridRect.bottom <= window.innerHeight,
            };
          });

          gridSizes[viewport.name] = gridInfo;
          console.log(`[${viewport.name}] Grid info:`, JSON.stringify(gridInfo, null, 2));
        } else {
          console.log(`[${viewport.name}] No sudoku grid found`);
        }
      }

      console.log('\n=== SUDOKU GRID SIZES SUMMARY ===');
      console.log(JSON.stringify(gridSizes, null, 2));
    });
  });

  // Navigation visibility tests
  test.describe('Navigation Bar', () => {

    test('Navigation should be accessible on all viewports', async ({ page }) => {
      for (const [key, viewport] of Object.entries(viewports)) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(BASE_URL);

        await page.evaluate(() => {
          sessionStorage.setItem('sudokuAuth', 'authenticated');
          sessionStorage.setItem('currentPlayer', 'filip');
        });

        await page.goto('file://' + __dirname + '/../index.html');
        await page.waitForLoadState('networkidle');

        const navVisible = await page.isVisible('.main-nav');
        const navLinks = await page.$$('.nav-link');

        console.log(`[${viewport.name}] Nav visible: ${navVisible}, Links count: ${navLinks.length}`);

        if (!navVisible) {
          console.error(`❌ ISSUE: Navigation not visible on ${viewport.name}!`);
        }
      }
    });
  });

  // Content overflow tests
  test.describe('Content Overflow Detection', () => {

    test('Detect horizontal overflow on dashboard', async ({ page }) => {
      for (const [key, viewport] of Object.entries(viewports)) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(BASE_URL);

        await page.evaluate(() => {
          sessionStorage.setItem('sudokuAuth', 'authenticated');
          sessionStorage.setItem('currentPlayer', 'filip');
        });

        await page.goto('file://' + __dirname + '/../index.html');
        await page.waitForLoadState('networkidle');

        // Check all major sections for overflow
        const overflowCheck = await page.evaluate(() => {
          const sections = [
            '.dashboard-header',
            '.win-streaks-section',
            '.sudoku-game-selection',
            '.battle-results',
            '.today-progress'
          ];

          const results = {};
          sections.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
              const rect = el.getBoundingClientRect();
              results[selector] = {
                width: rect.width,
                right: rect.right,
                viewportWidth: window.innerWidth,
                overflows: rect.right > window.innerWidth,
              };
            }
          });

          return results;
        });

        console.log(`\n[${viewport.name}] Overflow check:`);
        Object.entries(overflowCheck).forEach(([selector, data]) => {
          if (data.overflows) {
            console.error(`  ❌ ${selector} overflows by ${data.right - data.viewportWidth}px`);
          } else {
            console.log(`  ✅ ${selector} fits (${data.width}px)`);
          }
        });
      }
    });
  });
});
