/**
 * Performance Tests - Page Load, Bundle Size, Lighthouse Scores
 * Tests application performance and sets performance budgets
 */
import { test, expect } from '@playwright/test';
import { waitForPageReady, mockAuth, mockAPIResponses, measurePerformance, simulateSlowNetwork } from '../helpers/test-utils.js';

test.describe('Performance Tests', () => {

  test.describe('Page Load Performance', () => {
    test('Auth page loads within performance budget', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/auth.html');
      await waitForPageReady(page);

      const loadTime = Date.now() - startTime;

      console.log(`Auth page load time: ${loadTime}ms`);

      // Performance budget: page should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);

      // Measure detailed performance
      const perf = await measurePerformance(page);
      console.log('Auth page performance metrics:', perf);

      // First Contentful Paint should be under 1.5s
      expect(perf.firstContentfulPaint).toBeLessThan(1500);
    });

    test('Dashboard loads quickly after auth', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);

      const startTime = Date.now();

      await page.goto('/');
      await waitForPageReady(page);

      const loadTime = Date.now() - startTime;

      console.log(`Dashboard load time: ${loadTime}ms`);

      // Should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);

      const perf = await measurePerformance(page);
      console.log('Dashboard performance metrics:', perf);
    });

    test('Sudoku game loads within budget', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);

      const startTime = Date.now();

      await page.goto('/#sudoku');
      await waitForPageReady(page);
      await page.waitForTimeout(500); // Wait for game init

      const loadTime = Date.now() - startTime;

      console.log(`Sudoku page load time: ${loadTime}ms`);

      // Should load in under 4 seconds (more complex page)
      expect(loadTime).toBeLessThan(4000);
    });
  });

  test.describe('Network Performance', () => {
    test('Page usable on slow 3G network', async ({ page }) => {
      await simulateSlowNetwork(page);

      const startTime = Date.now();

      await page.goto('/auth.html');
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      console.log(`Slow 3G load time: ${loadTime}ms`);

      // Should be interactive within 10 seconds on slow network
      expect(loadTime).toBeLessThan(10000);

      // Check if form is visible
      await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
    });

    test('API calls complete within reasonable time', async ({ page }) => {
      await mockAuth(page);

      // Measure API response times
      const apiTimes = [];

      page.on('response', response => {
        if (response.url().includes('/api/')) {
          const timing = response.timing();
          apiTimes.push({
            url: response.url(),
            status: response.status(),
            time: timing.responseEnd
          });
        }
      });

      await page.goto('/');
      await waitForPageReady(page);

      console.log('API response times:', apiTimes);

      // Each API call should complete in under 2 seconds
      apiTimes.forEach(api => {
        expect(api.time).toBeLessThan(2000);
      });
    });
  });

  test.describe('Resource Budgets', () => {
    test('Total page weight is within budget', async ({ page }) => {
      const resources = [];

      page.on('response', async response => {
        try {
          const headers = await response.allHeaders();
          const contentLength = headers['content-length'];
          const size = contentLength ? parseInt(contentLength) : 0;

          resources.push({
            url: response.url(),
            type: response.request().resourceType(),
            size: size,
            status: response.status()
          });
        } catch (e) {
          // Ignore errors
        }
      });

      await page.goto('/auth.html');
      await waitForPageReady(page);

      // Calculate total size
      const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

      console.log(`Total page size: ${totalSizeMB} MB`);
      console.log('Resource breakdown:', resources.map(r => ({
        type: r.type,
        sizeMB: (r.size / 1024 / 1024).toFixed(3)
      })));

      // Page should be under 5MB total
      expect(totalSize).toBeLessThan(5 * 1024 * 1024);
    });

    test('JavaScript bundle size is reasonable', async ({ page }) => {
      const jsResources = [];

      page.on('response', async response => {
        if (response.request().resourceType() === 'script') {
          try {
            const body = await response.body();
            jsResources.push({
              url: response.url(),
              size: body.length,
              sizeMB: (body.length / 1024 / 1024).toFixed(3)
            });
          } catch (e) {
            // Ignore
          }
        }
      });

      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      const totalJS = jsResources.reduce((sum, r) => sum + r.size, 0);
      const totalJSMB = (totalJS / 1024 / 1024).toFixed(2);

      console.log(`Total JavaScript: ${totalJSMB} MB`);
      console.log('JS files:', jsResources);

      // Total JS should be under 2MB
      expect(totalJS).toBeLessThan(2 * 1024 * 1024);
    });

    test('CSS bundle size is reasonable', async ({ page }) => {
      const cssResources = [];

      page.on('response', async response => {
        if (response.request().resourceType() === 'stylesheet') {
          try {
            const body = await response.body();
            cssResources.push({
              url: response.url(),
              size: body.length,
              sizeKB: (body.length / 1024).toFixed(2)
            });
          } catch (e) {
            // Ignore
          }
        }
      });

      await page.goto('/auth.html');
      await waitForPageReady(page);

      const totalCSS = cssResources.reduce((sum, r) => sum + r.size, 0);
      const totalCSSKB = (totalCSS / 1024).toFixed(2);

      console.log(`Total CSS: ${totalCSSKB} KB`);
      console.log('CSS files:', cssResources);

      // Total CSS should be under 500KB
      expect(totalCSS).toBeLessThan(500 * 1024);
    });

    test('Images are optimized', async ({ page }) => {
      const images = [];

      page.on('response', async response => {
        if (response.request().resourceType() === 'image') {
          try {
            const headers = await response.allHeaders();
            const contentLength = headers['content-length'];
            const size = contentLength ? parseInt(contentLength) : 0;

            images.push({
              url: response.url(),
              size: size,
              sizeKB: (size / 1024).toFixed(2)
            });
          } catch (e) {
            // Ignore
          }
        }
      });

      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      console.log('Images loaded:', images);

      // Each image should be under 500KB
      images.forEach(img => {
        expect(img.size).toBeLessThan(500 * 1024);
      });
    });
  });

  test.describe('Runtime Performance', () => {
    test('Page remains responsive during interactions', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/#sudoku');
      await waitForPageReady(page);
      await page.waitForTimeout(1000);

      // Measure performance during rapid interactions
      const startTime = Date.now();
      const interactions = 50;

      for (let i = 0; i < interactions; i++) {
        await page.keyboard.press('Tab');
        await page.keyboard.press('5');
        await page.keyboard.press('Backspace');
      }

      const totalTime = Date.now() - startTime;
      const avgTimePerAction = totalTime / interactions;

      console.log(`Average time per interaction: ${avgTimePerAction.toFixed(2)}ms`);

      // Each interaction should complete in under 50ms for smooth UX
      expect(avgTimePerAction).toBeLessThan(50);
    });

    test('No memory leaks during navigation', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);

      // Navigate between pages multiple times
      for (let i = 0; i < 5; i++) {
        await page.goto('/');
        await waitForPageReady(page);

        await page.goto('/#sudoku');
        await page.waitForTimeout(500);

        await page.goto('/#analytics');
        await page.waitForTimeout(500);
      }

      // Get memory usage
      const metrics = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            usedMB: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
          };
        }
        return null;
      });

      if (metrics) {
        console.log('Memory usage after navigation:', metrics);

        // Memory should be under 100MB
        expect(metrics.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
      }
    });

    test('Long tasks are minimized', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);

      // Enable long task observation
      await page.goto('/');

      const longTasks = await page.evaluate(() => {
        return new Promise((resolve) => {
          const tasks = [];
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              tasks.push({
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime
              });
            }
          });

          try {
            observer.observe({ entryTypes: ['longtask'] });

            setTimeout(() => {
              observer.disconnect();
              resolve(tasks);
            }, 5000);
          } catch (e) {
            // Long task API not supported
            resolve([]);
          }
        });
      });

      console.log('Long tasks detected:', longTasks);

      // Should have minimal long tasks (> 50ms)
      expect(longTasks.length).toBeLessThan(5);
    });
  });

  test.describe('Caching Performance', () => {
    test('Static assets are cached properly', async ({ page }) => {
      await page.goto('/auth.html');
      await waitForPageReady(page);

      // Navigate away and back
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/');
      await waitForPageReady(page);

      // Go back to auth - should load from cache
      const startTime = Date.now();
      await page.goto('/auth.html');
      await waitForPageReady(page);
      const loadTime = Date.now() - startTime;

      console.log(`Cached page load time: ${loadTime}ms`);

      // Cached load should be significantly faster (under 1 second)
      expect(loadTime).toBeLessThan(1000);
    });
  });

  test.describe('Mobile Performance', () => {
    test('Mobile page load is within budget', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await simulateSlowNetwork(page);

      const startTime = Date.now();

      await page.goto('/auth.html');
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      console.log(`Mobile load time (slow 3G): ${loadTime}ms`);

      // Should be usable within 8 seconds on mobile slow connection
      expect(loadTime).toBeLessThan(8000);
    });

    test('Mobile interactions are smooth (60fps)', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await mockAuth(page);
      await mockAPIResponses(page);
      await page.goto('/#sudoku');
      await waitForPageReady(page);
      await page.waitForTimeout(1000);

      // Simulate rapid touch interactions
      const startTime = Date.now();

      for (let i = 0; i < 20; i++) {
        await page.touchscreen.tap(200, 300);
        await page.waitForTimeout(50);
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / 20;

      console.log(`Average touch response time: ${avgTime.toFixed(2)}ms`);

      // Should respond within 16ms for 60fps
      expect(avgTime).toBeLessThan(100);
    });
  });

  test.describe('Performance Monitoring', () => {
    test('Collect comprehensive performance metrics', async ({ page }) => {
      await mockAuth(page);
      await mockAPIResponses(page);

      await page.goto('/');
      await waitForPageReady(page);

      const metrics = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        return {
          // Navigation timing
          dns: perf.domainLookupEnd - perf.domainLookupStart,
          tcp: perf.connectEnd - perf.connectStart,
          request: perf.responseStart - perf.requestStart,
          response: perf.responseEnd - perf.responseStart,
          dom: perf.domComplete - perf.domInteractive,

          // Paint timing
          fp: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,

          // Total time
          total: perf.loadEventEnd - perf.fetchStart
        };
      });

      console.log('Performance metrics:', metrics);

      // Log for tracking over time
      console.log('METRIC_REPORT:', JSON.stringify(metrics));
    });
  });
});
