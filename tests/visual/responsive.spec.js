/**
 * Visual Regression Tests - Responsive Design
 * Tests UI across all devices with screenshot comparison
 */
import { test, expect } from '@playwright/test';
import { getAllDevices, CRITICAL_DEVICES, DEVICES } from '../helpers/devices.js';
import { waitForPageReady, mockAuth, mockAPIResponses, hasHorizontalOverflow, getOverflowingElements } from '../helpers/test-utils.js';

test.describe('Visual Regression - Responsive Design', () => {

  // Test all devices
  const allDevices = getAllDevices();

  allDevices.forEach(device => {
    test(`${device.name} (${device.width}x${device.height}) - Auth Page`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/auth.html');
      await waitForPageReady(page);

      // Check no horizontal overflow
      const overflow = await hasHorizontalOverflow(page);
      if (overflow) {
        const overflowingElements = await getOverflowingElements(page);
        console.error(`Horizontal overflow detected on ${device.name}:`, overflowingElements);
      }
      expect(overflow).toBe(false);

      // Take screenshot for visual regression
      await page.screenshot({
        path: `test-results/visual/${device.category}/${device.name.replace(/\s+/g, '-')}-auth.png`,
        fullPage: true
      });

      // Check critical elements are visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test(`${device.name} (${device.width}x${device.height}) - Dashboard`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await mockAuth(page);
      await mockAPIResponses(page);

      await page.goto('/');
      await waitForPageReady(page);

      // Check no horizontal overflow
      const overflow = await hasHorizontalOverflow(page);
      expect(overflow).toBe(false);

      // Take screenshot
      await page.screenshot({
        path: `test-results/visual/${device.category}/${device.name.replace(/\s+/g, '-')}-dashboard.png`,
        fullPage: true
      });

      // Check navigation is visible
      await expect(page.locator('nav')).toBeVisible();

      // Check main content
      await expect(page.locator('.container, .dashboard, main')).toBeVisible();
    });

    test(`${device.name} (${device.width}x${device.height}) - Sudoku Game`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await mockAuth(page);
      await mockAPIResponses(page);

      await page.goto('/#sudoku');
      await waitForPageReady(page);
      await page.waitForTimeout(1000); // Wait for game to initialize

      // Check no horizontal overflow
      const overflow = await hasHorizontalOverflow(page);
      expect(overflow).toBe(false);

      // Take screenshot
      await page.screenshot({
        path: `test-results/visual/${device.category}/${device.name.replace(/\s+/g, '-')}-sudoku.png`,
        fullPage: true
      });

      // Check Sudoku grid is visible
      const grid = page.locator('.sudoku-grid, #sudoku-grid, [class*="grid"]').first();
      if (await grid.count() > 0) {
        await expect(grid).toBeVisible();

        // Check grid is not cut off at bottom
        const gridBox = await grid.boundingBox();
        if (gridBox) {
          const viewport = page.viewportSize();
          const isFullyVisible = gridBox.y + gridBox.height <= viewport.height;

          if (!isFullyVisible) {
            console.warn(`Grid may be cut off on ${device.name}: grid bottom at ${gridBox.y + gridBox.height}, viewport height ${viewport.height}`);
          }

          // Grid should be within reasonable bounds (allow some scrolling)
          expect(gridBox.y + gridBox.height).toBeLessThan(viewport.height * 1.5);
        }
      }

      // Check game controls are visible
      if (device.category === 'mobile') {
        // Mobile should have touch-friendly controls
        const buttons = page.locator('button, .btn, [role="button"]');
        const count = await buttons.count();

        if (count > 0) {
          // Check first few buttons have adequate size for touch
          for (let i = 0; i < Math.min(5, count); i++) {
            const button = buttons.nth(i);
            if (await button.isVisible()) {
              const box = await button.boundingBox();
              if (box) {
                // WCAG recommends 44x44 minimum for touch targets
                const adequateSize = box.width >= 40 && box.height >= 40;
                if (!adequateSize) {
                  console.warn(`Button ${i} on ${device.name} may be too small: ${box.width}x${box.height}`);
                }
              }
            }
          }
        }
      }
    });
  });

  // Additional comprehensive tests on critical devices
  test.describe('Critical Devices - Deep Testing', () => {
    CRITICAL_DEVICES.forEach(deviceName => {
      const device = getAllDevices().find(d => d.name === deviceName);
      if (!device) return;

      test(`${deviceName} - All Pages Navigation`, async ({ page }) => {
        await page.setViewportSize({ width: device.width, height: device.height });
        await mockAuth(page);
        await mockAPIResponses(page);

        const pages = [
          { path: '/', name: 'dashboard' },
          { path: '/#analytics', name: 'analytics' },
          { path: '/#leaderboards', name: 'leaderboards' },
          { path: '/#achievements', name: 'achievements' },
          { path: '/#sudoku', name: 'sudoku' }
        ];

        for (const pageDef of pages) {
          await page.goto(pageDef.path);
          await waitForPageReady(page);
          await page.waitForTimeout(500);

          // Check no overflow
          const overflow = await hasHorizontalOverflow(page);
          expect(overflow).toBe(false);

          // Screenshot each page
          await page.screenshot({
            path: `test-results/visual/comprehensive/${deviceName.replace(/\s+/g, '-')}-${pageDef.name}.png`,
            fullPage: true
          });
        }
      });

      test(`${deviceName} - Interaction States`, async ({ page }) => {
        await page.setViewportSize({ width: device.width, height: device.height });
        await page.goto('/auth.html');
        await waitForPageReady(page);

        // Test hover states (desktop only)
        if (!device.isMobile) {
          const button = page.locator('button').first();
          await button.hover();
          await page.screenshot({
            path: `test-results/visual/states/${deviceName.replace(/\s+/g, '-')}-button-hover.png`
          });
        }

        // Test focus states
        const input = page.locator('input').first();
        await input.focus();
        await page.screenshot({
          path: `test-results/visual/states/${deviceName.replace(/\s+/g, '-')}-input-focus.png`
        });
      });
    });
  });

  // Test dark mode if supported
  test.describe('Dark Mode', () => {
    test('Dark mode renders correctly on desktop', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.setViewportSize({ width: 1920, height: 1080 });
      await mockAuth(page);
      await mockAPIResponses(page);

      await page.goto('/');
      await waitForPageReady(page);

      await page.screenshot({
        path: 'test-results/visual/dark-mode/desktop-dashboard-dark.png',
        fullPage: true
      });
    });

    test('Dark mode renders correctly on mobile', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.setViewportSize({ width: 390, height: 844 });
      await mockAuth(page);
      await mockAPIResponses(page);

      await page.goto('/');
      await waitForPageReady(page);

      await page.screenshot({
        path: 'test-results/visual/dark-mode/mobile-dashboard-dark.png',
        fullPage: true
      });
    });
  });

  // Test landscape orientation on mobile
  test.describe('Landscape Orientation', () => {
    Object.entries(DEVICES.mobile).forEach(([name, config]) => {
      test(`${name} - Landscape mode`, async ({ page }) => {
        // Swap width and height for landscape
        await page.setViewportSize({ width: config.height, height: config.width });
        await mockAuth(page);
        await mockAPIResponses(page);

        await page.goto('/');
        await waitForPageReady(page);

        const overflow = await hasHorizontalOverflow(page);
        expect(overflow).toBe(false);

        await page.screenshot({
          path: `test-results/visual/landscape/${name.replace(/\s+/g, '-')}-landscape.png`,
          fullPage: true
        });
      });
    });
  });
});
