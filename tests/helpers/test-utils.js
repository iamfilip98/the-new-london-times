/**
 * Test Utilities - Shared helper functions for all tests
 */
import { expect } from '@playwright/test';

/**
 * Wait for page to be fully loaded and stable
 */
export async function waitForPageReady(page) {
  await page.waitForLoadState('load');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
}

/**
 * Mock authentication for testing
 */
export async function mockAuth(page, username = 'filip') {
  await page.addInitScript((user) => {
    sessionStorage.setItem('sudokuAuth', 'authenticated');
    sessionStorage.setItem('currentPlayer', user);
  }, username);
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page, selector) {
  const element = await page.locator(selector);
  const box = await element.boundingBox();
  if (!box) return false;

  const viewport = page.viewportSize();
  return (
    box.y >= 0 &&
    box.x >= 0 &&
    box.y + box.height <= viewport.height &&
    box.x + box.width <= viewport.width
  );
}

/**
 * Check for horizontal overflow
 */
export async function hasHorizontalOverflow(page) {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
}

/**
 * Take full page screenshot with name
 */
export async function takeFullScreenshot(page, name, options = {}) {
  return await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
    ...options
  });
}

/**
 * Get all elements that overflow viewport
 */
export async function getOverflowingElements(page) {
  return await page.evaluate(() => {
    const elements = [];
    const viewportWidth = document.documentElement.clientWidth;

    document.querySelectorAll('*').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth) {
        elements.push({
          tag: el.tagName,
          id: el.id,
          class: el.className,
          width: rect.width,
          right: rect.right,
          overflow: rect.right - viewportWidth
        });
      }
    });

    return elements;
  });
}

/**
 * Mock API responses for testing without backend
 */
export async function mockAPIResponses(page) {
  // Mock puzzle API
  await page.route('**/api/puzzles*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        date: '2025-10-28',
        easy: { puzzle: '0'.repeat(81), solution: '1'.repeat(81) },
        medium: { puzzle: '0'.repeat(81), solution: '1'.repeat(81) },
        hard: { puzzle: '0'.repeat(81), solution: '1'.repeat(81) }
      })
    });
  });

  // Mock games API
  await page.route('**/api/games*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ games: [] })
    });
  });

  // Mock entries API
  await page.route('**/api/entries*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ entries: [] })
    });
  });

  // Mock stats API
  await page.route('**/api/stats*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ stats: {} })
    });
  });

  // Mock achievements API
  await page.route('**/api/achievements*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ achievements: [] })
    });
  });
}

/**
 * Check accessibility of element
 */
export async function checkAccessibility(page, selector) {
  const element = await page.locator(selector);

  // Check if element has proper ARIA labels
  const ariaLabel = await element.getAttribute('aria-label');
  const ariaLabelledBy = await element.getAttribute('aria-labelledby');
  const role = await element.getAttribute('role');

  return {
    hasAriaLabel: !!ariaLabel || !!ariaLabelledBy,
    role: role,
    isVisible: await element.isVisible(),
    isFocusable: await element.isEnabled()
  };
}

/**
 * Measure page performance
 */
export async function measurePerformance(page) {
  return await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');

    return {
      loadTime: perf.loadEventEnd - perf.loadEventStart,
      domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      domInteractive: perf.domInteractive,
      totalTime: perf.loadEventEnd - perf.fetchStart
    };
  });
}

/**
 * Simulate slow network for performance testing
 */
export async function simulateSlowNetwork(page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
    uploadThroughput: 750 * 1024 / 8, // 750 Kbps
    latency: 40 // 40ms
  });
}

/**
 * Check if element has proper contrast ratio
 */
export async function checkColorContrast(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;

    const style = window.getComputedStyle(element);
    const bgColor = style.backgroundColor;
    const color = style.color;

    // Convert RGB to relative luminance
    function getLuminance(rgb) {
      const [r, g, b] = rgb.match(/\d+/g).map(Number);
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    const l1 = getLuminance(color);
    const l2 = getLuminance(bgColor);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio: ratio.toFixed(2),
      passesAA: ratio >= 4.5,
      passesAAA: ratio >= 7
    };
  }, selector);
}
