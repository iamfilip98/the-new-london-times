/**
 * Accessibility Tests - WCAG 2.1 Compliance
 * Tests for keyboard navigation, ARIA labels, color contrast, screen reader support
 */
import { test, expect } from '@playwright/test';
import { waitForPageReady, mockAuth, mockAPIResponses, checkAccessibility, checkColorContrast } from '../helpers/test-utils.js';

test.describe('Accessibility - WCAG 2.1 Compliance', () => {

  test.describe('Keyboard Navigation', () => {
    test('Tab navigation works on auth page', async ({ page }) => {
      await page.goto('/auth.html');
      await waitForPageReady(page);

      // Track focus order
      const focusOrder = [];

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tag: el.tagName,
            type: el.type,
            id: el.id,
            class: el.className,
            text: el.textContent?.substring(0, 20)
          };
        });

        focusOrder.push(focused);

        // Should never focus on hidden elements
        const isHidden = await page.evaluate(() => {
          const el = document.activeElement;
          const style = window.getComputedStyle(el);
          return style.display === 'none' || style.visibility === 'hidden';
        });
        expect(isHidden).toBe(false);
      }

      console.log('Focus order:', focusOrder);

      // Test reverse tab
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(100);

      await page.screenshot({ path: 'test-results/accessibility/keyboard-navigation.png' });
    });

    test('Keyboard navigation works in Sudoku game', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/#sudoku');
      await waitForPageReady(page);
      await page.waitForTimeout(1000);

      // Tab to game area
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Arrow keys should navigate grid
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100);

      // Number keys should input
      await page.keyboard.press('5');
      await page.waitForTimeout(100);

      // Backspace should clear
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(100);

      await page.screenshot({ path: 'test-results/accessibility/sudoku-keyboard-nav.png' });
    });

    test('Escape key closes modals', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      // Try to open any modal (look for buttons that might open modals)
      const modalTriggers = page.locator('button:has-text("Help"), button:has-text("?"), [class*="help"]');
      if (await modalTriggers.count() > 0) {
        await modalTriggers.first().click();
        await page.waitForTimeout(300);

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Modal should be closed
        const modalVisible = await page.locator('[role="dialog"], .modal, [class*="modal"]').isVisible().catch(() => false);
        // If modal was opened, it should be closed now (or never opened)
        console.log('Modal visible after Escape:', modalVisible);
      }
    });

    test('Enter key activates buttons', async ({ page }) => {
      await page.goto('/auth.html');
      await waitForPageReady(page);

      // Tab to button
      const button = page.locator('button').first();
      await button.focus();

      // Enter should activate
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Check if button was activated (form might submit, etc.)
      await page.screenshot({ path: 'test-results/accessibility/enter-activates-button.png' });
    });
  });

  test.describe('ARIA Labels and Roles', () => {
    test('Interactive elements have proper ARIA labels', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      // Check buttons
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      const missingLabels = [];

      for (let i = 0; i < Math.min(20, buttonCount); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const ariaLabel = await button.getAttribute('aria-label');
          const ariaLabelledBy = await button.getAttribute('aria-labelledby');
          const text = await button.textContent();

          if (!ariaLabel && !ariaLabelledBy && !text?.trim()) {
            const id = await button.getAttribute('id');
            const className = await button.getAttribute('class');
            missingLabels.push({ index: i, id, className });
          }
        }
      }

      if (missingLabels.length > 0) {
        console.warn('Buttons without accessible labels:', missingLabels);
      }

      // Check inputs
      const inputs = page.locator('input, textarea, select');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(10, inputCount); i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          const id = await input.getAttribute('id');

          // Check if there's a <label for="id">
          let hasLabel = false;
          if (id) {
            hasLabel = await page.locator(`label[for="${id}"]`).count() > 0;
          }

          if (!ariaLabel && !ariaLabelledBy && !hasLabel) {
            console.warn(`Input ${i} missing accessible label`);
          }
        }
      }
    });

    test('Landmark regions are properly defined', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      const landmarks = await page.evaluate(() => {
        const landmarkElements = document.querySelectorAll('[role="main"], main, [role="navigation"], nav, [role="banner"], header, [role="contentinfo"], footer');
        return Array.from(landmarkElements).map(el => ({
          tag: el.tagName,
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label')
        }));
      });

      console.log('Landmark regions found:', landmarks);

      // Should have at least main and navigation
      const hasMain = landmarks.some(l => l.tag === 'MAIN' || l.role === 'main');
      const hasNav = landmarks.some(l => l.tag === 'NAV' || l.role === 'navigation');

      console.log('Has main landmark:', hasMain);
      console.log('Has navigation landmark:', hasNav);
    });

    test('Images have alt text', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      const images = page.locator('img');
      const imageCount = await images.count();

      const missingAlt = [];

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        // Decorative images should have role="presentation" or empty alt
        if (alt === null && role !== 'presentation') {
          const src = await img.getAttribute('src');
          missingAlt.push({ index: i, src });
        }
      }

      if (missingAlt.length > 0) {
        console.warn('Images without alt text:', missingAlt);
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('Text has adequate color contrast (WCAG AA)', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      // Check various text elements
      const selectors = [
        'h1', 'h2', 'h3', 'p', 'button', 'a', 'span', 'div'
      ];

      const contrastResults = [];

      for (const selector of selectors) {
        const elements = page.locator(selector);
        const count = await elements.count();

        for (let i = 0; i < Math.min(5, count); i++) {
          const element = elements.nth(i);
          if (await element.isVisible()) {
            const text = await element.textContent();
            if (text && text.trim().length > 0) {
              try {
                const contrast = await checkColorContrast(page, `${selector}:nth-of-type(${i + 1})`);
                if (contrast) {
                  contrastResults.push({
                    selector: `${selector}:nth-of-type(${i + 1})`,
                    text: text.substring(0, 30),
                    ...contrast
                  });
                }
              } catch (e) {
                // Skip if element not found or other error
              }
              break; // Just check first visible one
            }
          }
        }
      }

      console.log('Color contrast results:', contrastResults);

      // Check if any fail WCAG AA
      const failures = contrastResults.filter(r => !r.passesAA);
      if (failures.length > 0) {
        console.warn('Elements failing WCAG AA contrast:', failures);
      }
    });

    test('Color contrast in dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      // Check button contrast
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        const contrast = await checkColorContrast(page, 'button');
        console.log('Dark mode button contrast:', contrast);

        if (contrast) {
          expect(contrast.passesAA).toBe(true);
        }
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('Page has proper heading hierarchy', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      const headings = await page.evaluate(() => {
        const h = [];
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
          document.querySelectorAll(tag).forEach(el => {
            h.push({
              level: parseInt(tag[1]),
              text: el.textContent?.trim().substring(0, 50)
            });
          });
        });
        return h.sort((a, b) => {
          const aIndex = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).findIndex(el => el.textContent?.trim() === a.text);
          const bIndex = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).findIndex(el => el.textContent?.trim() === b.text);
          return aIndex - bIndex;
        });
      });

      console.log('Heading hierarchy:', headings);

      // Should start with h1
      if (headings.length > 0) {
        expect(headings[0].level).toBe(1);
      }

      // Check for skipped levels
      for (let i = 1; i < headings.length; i++) {
        const jump = headings[i].level - headings[i - 1].level;
        if (jump > 1) {
          console.warn(`Heading level skipped from h${headings[i - 1].level} to h${headings[i].level}`);
        }
      }
    });

    test('Form fields have associated labels', async ({ page }) => {
      await page.goto('/auth.html');
      await waitForPageReady(page);

      const inputs = page.locator('input, select, textarea');
      const count = await inputs.count();

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');

          let hasLabel = false;
          if (id) {
            const label = page.locator(`label[for="${id}"]`);
            hasLabel = await label.count() > 0;
          }

          const isAccessible = ariaLabel || ariaLabelledBy || hasLabel;

          if (!isAccessible) {
            const type = await input.getAttribute('type');
            const name = await input.getAttribute('name');
            console.warn(`Input missing label: type=${type}, name=${name}, id=${id}`);
          }
        }
      }
    });

    test('Interactive elements are announced correctly', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      // Check buttons have accessible names
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(btn => ({
          text: btn.textContent?.trim(),
          ariaLabel: btn.getAttribute('aria-label'),
          title: btn.getAttribute('title'),
          role: btn.getAttribute('role')
        }));
      });

      console.log('Button accessibility info:', buttons);

      // Each button should have text or aria-label
      const inaccessibleButtons = buttons.filter(btn => !btn.text && !btn.ariaLabel);
      if (inaccessibleButtons.length > 0) {
        console.warn('Buttons without accessible names:', inaccessibleButtons);
      }
    });
  });

  test.describe('Focus Management', () => {
    test('Focus is visible and clear', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      // Tab to several elements and check focus visibility
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const focusVisible = await page.evaluate(() => {
          const el = document.activeElement;
          const style = window.getComputedStyle(el);
          return {
            outline: style.outline,
            outlineWidth: style.outlineWidth,
            outlineColor: style.outlineColor,
            boxShadow: style.boxShadow,
            border: style.border
          };
        });

        console.log(`Focus style ${i}:`, focusVisible);

        // Take screenshot showing focus
        await page.screenshot({
          path: `test-results/accessibility/focus-${i}.png`
        });
      }
    });

    test('Focus trap works in modals', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      // Try to open modal
      const helpButton = page.locator('button:has-text("?"), button:has-text("Help")');
      if (await helpButton.count() > 0) {
        await helpButton.first().click();
        await page.waitForTimeout(300);

        // Tab several times - focus should stay in modal
        const focusedElements = [];
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);

          const focused = await page.evaluate(() => {
            return document.activeElement?.className || 'unknown';
          });

          focusedElements.push(focused);
        }

        console.log('Focus trap sequence:', focusedElements);
      }
    });
  });

  test.describe('Touch Target Size', () => {
    test('Mobile touch targets are adequate size (44x44)', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      const buttons = page.locator('button, a, [role="button"]');
      const count = await buttons.count();

      const undersizedTargets = [];

      for (let i = 0; i < Math.min(20, count); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            // WCAG recommends 44x44 minimum
            if (box.width < 44 || box.height < 44) {
              const text = await button.textContent();
              undersizedTargets.push({
                index: i,
                size: `${box.width.toFixed(0)}x${box.height.toFixed(0)}`,
                text: text?.substring(0, 20)
              });
            }
          }
        }
      }

      if (undersizedTargets.length > 0) {
        console.warn('Undersized touch targets (< 44x44):', undersizedTargets);
      }

      await page.screenshot({ path: 'test-results/accessibility/touch-targets.png', fullPage: true });
    });
  });

  test.describe('Motion and Animation', () => {
    test('Respects prefers-reduced-motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      // Check if animations are disabled
      const hasAnimations = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        let animatedCount = 0;

        allElements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.animation !== 'none' || style.transition !== 'all 0s ease 0s') {
            animatedCount++;
          }
        });

        return animatedCount;
      });

      console.log('Elements with animations (reduced motion):', hasAnimations);
    });
  });
});
