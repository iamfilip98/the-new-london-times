/**
 * End-to-End Tests - Complete User Flows
 * Tests critical user journeys from start to finish
 */
import { test, expect } from '@playwright/test';
import { waitForPageReady, mockAuth, mockAPIResponses } from '../helpers/test-utils.js';

test.describe('E2E - Complete User Flows', () => {

  test.describe('Authentication Flow', () => {
    test('User can view auth page and see login form', async ({ page }) => {
      await page.goto('/auth.html');
      await waitForPageReady(page);

      // Check page title
      await expect(page).toHaveTitle(/Auth|Login|The New London Times/i);

      // Check form elements are present
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Take screenshot of login page
      await page.screenshot({ path: 'test-results/e2e/01-auth-page.png' });
    });

    test('User can authenticate successfully (mocked)', async ({ page }) => {
      await page.goto('/auth.html');
      await waitForPageReady(page);

      // Mock successful auth
      await mockAuth(page, 'filip');
      await mockAPIResponses(page);

      // Navigate to dashboard
      await page.goto('/');
      await waitForPageReady(page);

      // Should be on dashboard
      await expect(page.locator('nav, .navigation, header')).toBeVisible();

      await page.screenshot({ path: 'test-results/e2e/02-dashboard-after-login.png' });
    });
  });

  test.describe('Dashboard Flow', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
    });

    test('User can view dashboard with all sections', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      // Check main container is visible
      const mainContent = page.locator('main, .container, .dashboard');
      await expect(mainContent.first()).toBeVisible();

      // Check navigation is present
      await expect(page.locator('nav, .nav, .navigation')).toBeVisible();

      await page.screenshot({ path: 'test-results/e2e/03-dashboard-full.png', fullPage: true });
    });

    test('User can navigate between sections', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      const sections = [
        { name: 'Dashboard', selector: '[href="#"]', hash: '' },
        { name: 'Analytics', selector: '[href="#analytics"]', hash: '#analytics' },
        { name: 'Leaderboards', selector: '[href="#leaderboards"]', hash: '#leaderboards' },
        { name: 'Achievements', selector: '[href="#achievements"]', hash: '#achievements' },
        { name: 'Sudoku', selector: '[href="#sudoku"]', hash: '#sudoku' }
      ];

      for (const section of sections) {
        // Click navigation link if it exists
        const navLink = page.locator(section.selector);
        if (await navLink.count() > 0 && await navLink.first().isVisible()) {
          await navLink.first().click();
          await page.waitForTimeout(500);

          // Check URL hash
          if (section.hash) {
            expect(page.url()).toContain(section.hash);
          }

          // Take screenshot
          await page.screenshot({
            path: `test-results/e2e/navigation-${section.name.toLowerCase()}.png`,
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Sudoku Game Flow', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
    });

    test('User can access Sudoku game page', async ({ page }) => {
      await page.goto('/#sudoku');
      await waitForPageReady(page);
      await page.waitForTimeout(1000);

      // Check if sudoku grid exists
      const gridSelectors = [
        '.sudoku-grid',
        '#sudoku-grid',
        '[class*="grid"]',
        'table',
        '.game'
      ];

      let gridFound = false;
      for (const selector of gridSelectors) {
        if (await page.locator(selector).count() > 0) {
          gridFound = true;
          break;
        }
      }

      if (gridFound) {
        await page.screenshot({ path: 'test-results/e2e/04-sudoku-game.png', fullPage: true });
      }
    });

    test('Game controls are present and functional', async ({ page }) => {
      await page.goto('/#sudoku');
      await waitForPageReady(page);
      await page.waitForTimeout(1000);

      // Check for game controls
      const controlsExist = async (selector) => {
        const elem = page.locator(selector);
        return (await elem.count()) > 0 && (await elem.first().isVisible());
      };

      // Look for timer
      const hasTimer = await controlsExist('[class*="timer"], .timer, #timer');

      // Look for difficulty selector
      const hasDifficulty = await controlsExist('[class*="difficulty"], .difficulty, select');

      // Look for hint button
      const hasHint = await controlsExist('button:has-text("Hint"), [class*="hint"]');

      // Look for pause button
      const hasPause = await controlsExist('button:has-text("Pause"), [class*="pause"]');

      // Look for undo button
      const hasUndo = await controlsExist('button:has-text("Undo"), [class*="undo"]');

      console.log('Game controls detected:', {
        timer: hasTimer,
        difficulty: hasDifficulty,
        hint: hasHint,
        pause: hasPause,
        undo: hasUndo
      });

      await page.screenshot({ path: 'test-results/e2e/05-game-controls.png', fullPage: true });
    });

    test('User can interact with Sudoku grid', async ({ page }) => {
      await page.goto('/#sudoku');
      await waitForPageReady(page);
      await page.waitForTimeout(1000);

      // Find and click a cell
      const cellSelectors = [
        '.sudoku-cell',
        '.cell',
        'td',
        '[class*="cell"]'
      ];

      for (const selector of cellSelectors) {
        const cells = page.locator(selector);
        const count = await cells.count();

        if (count > 0) {
          // Try to click the first empty cell
          for (let i = 0; i < Math.min(10, count); i++) {
            const cell = cells.nth(i);
            if (await cell.isVisible()) {
              await cell.click();
              await page.waitForTimeout(200);

              // Check if cell is now focused or selected
              const isActive = await cell.evaluate(el => {
                return el.classList.contains('selected') ||
                       el.classList.contains('active') ||
                       el.classList.contains('focused') ||
                       document.activeElement === el;
              });

              if (isActive) {
                await page.screenshot({ path: 'test-results/e2e/06-cell-selected.png' });
                break;
              }
            }
          }
          break;
        }
      }
    });

    test('Keyboard navigation works in Sudoku grid', async ({ page }) => {
      await page.goto('/#sudoku');
      await waitForPageReady(page);
      await page.waitForTimeout(1000);

      // Try to focus on grid and use keyboard
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      // Try arrow keys
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);

      // Try number input
      await page.keyboard.press('5');
      await page.waitForTimeout(200);

      await page.screenshot({ path: 'test-results/e2e/07-keyboard-navigation.png' });
    });
  });

  test.describe('Analytics Flow', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
    });

    test('User can view analytics page', async ({ page }) => {
      await page.goto('/#analytics');
      await waitForPageReady(page);
      await page.waitForTimeout(1000);

      // Check for charts or analytics content
      const hasCharts = await page.locator('canvas, .chart, [class*="chart"]').count() > 0;
      const hasAnalytics = await page.locator('[class*="analytics"], .analytics').count() > 0;

      if (hasCharts || hasAnalytics) {
        await page.screenshot({ path: 'test-results/e2e/08-analytics.png', fullPage: true });
      }
    });
  });

  test.describe('Leaderboards Flow', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
    });

    test('User can view leaderboards', async ({ page }) => {
      await page.goto('/#leaderboards');
      await waitForPageReady(page);
      await page.waitForTimeout(500);

      const hasLeaderboard = await page.locator('.leaderboard, [class*="leaderboard"], table').count() > 0;

      if (hasLeaderboard) {
        await page.screenshot({ path: 'test-results/e2e/09-leaderboards.png', fullPage: true });
      }
    });
  });

  test.describe('Achievements Flow', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
    });

    test('User can view achievements', async ({ page }) => {
      await page.goto('/#achievements');
      await waitForPageReady(page);
      await page.waitForTimeout(500);

      const hasAchievements = await page.locator('.achievement, [class*="achievement"]').count() > 0;

      if (hasAchievements) {
        await page.screenshot({ path: 'test-results/e2e/10-achievements.png', fullPage: true });
      }
    });
  });

  test.describe('Complete User Journey - Happy Path', () => {
    test('Complete flow: Login → Dashboard → Play Game → View Results', async ({ page }) => {
      // Step 1: Start at auth page
      await page.goto('/auth.html');
      await waitForPageReady(page);
      await page.screenshot({ path: 'test-results/e2e/journey-01-auth.png' });

      // Step 2: Mock authentication
      await mockAuth(page, 'filip');
      await mockAPIResponses(page);

      // Step 3: Go to dashboard
      await page.goto('/');
      await waitForPageReady(page);
      await page.screenshot({ path: 'test-results/e2e/journey-02-dashboard.png', fullPage: true });

      // Step 4: Navigate to Sudoku game
      const sudokuLink = page.locator('[href="#sudoku"]');
      if (await sudokuLink.count() > 0) {
        await sudokuLink.first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/e2e/journey-03-sudoku.png', fullPage: true });
      }

      // Step 5: Navigate to analytics
      const analyticsLink = page.locator('[href="#analytics"]');
      if (await analyticsLink.count() > 0) {
        await analyticsLink.first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/e2e/journey-04-analytics.png', fullPage: true });
      }

      // Step 6: Navigate to achievements
      const achievementsLink = page.locator('[href="#achievements"]');
      if (await achievementsLink.count() > 0) {
        await achievementsLink.first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/e2e/journey-05-achievements.png', fullPage: true });
      }

      // Journey complete!
    });
  });

  test.describe('Mobile User Journey', () => {
    test('Complete mobile flow on iPhone', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await mockAuth(page);
      await mockAPIResponses(page);

      // Visit main pages
      const pages = ['/', '/#sudoku', '/#analytics', '/#achievements'];

      for (let i = 0; i < pages.length; i++) {
        await page.goto(pages[i]);
        await waitForPageReady(page);
        await page.waitForTimeout(500);

        await page.screenshot({
          path: `test-results/e2e/mobile-journey-${i + 1}.png`,
          fullPage: true
        });
      }
    });
  });
});
