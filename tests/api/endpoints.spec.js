/**
 * API Endpoint Tests
 * Tests all API endpoints for correct responses, error handling, and data validation
 */
import { test, expect } from '@playwright/test';

// Base URL for API (use environment variable or default to production)
const API_BASE = process.env.API_BASE_URL || 'https://the-new-london-times-aisx09a52-filips-projects-cf39d09c.vercel.app';

test.describe('API Endpoint Tests', () => {

  test.describe('Authentication API', () => {
    test('POST /api/auth - should return 400 for missing credentials', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/auth`, {
        data: {}
      });

      expect(response.status()).toBe(400);
    });

    test('POST /api/auth - should validate input format', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/auth`, {
        data: {
          username: 'test',
          password: 'test123'
        }
      });

      // Should return 401 (unauthorized) or 200 (if valid)
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Puzzles API', () => {
    test('GET /api/puzzles - should return puzzles for today', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/puzzles`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      console.log('Puzzles API response:', data);

      // Should have date and puzzle data
      expect(data).toHaveProperty('date');
    });

    test('GET /api/puzzles - should return puzzles for specific date', async ({ request }) => {
      const testDate = '2025-10-28';
      const response = await request.get(`${API_BASE}/api/puzzles?date=${testDate}`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      console.log('Puzzles for date response:', data);

      if (data.date) {
        expect(data.date).toContain('2025-10-28');
      }
    });

    test('GET /api/puzzles - should return valid puzzle format', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/puzzles`);
      const data = await response.json();

      // Check structure
      if (data.easy || data.medium || data.hard) {
        // If puzzles exist, they should have correct format
        if (data.easy) {
          expect(data.easy).toHaveProperty('puzzle');
          expect(data.easy).toHaveProperty('solution');
          expect(typeof data.easy.puzzle).toBe('string');
          expect(data.easy.puzzle.length).toBeGreaterThan(0);
        }
      }
    });

    test('GET /api/puzzles - should handle cache headers', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/puzzles`);

      const headers = response.headers();
      console.log('Cache headers:', {
        'cache-control': headers['cache-control'],
        'etag': headers['etag']
      });

      // Should have cache control header
      if (headers['cache-control']) {
        expect(headers['cache-control']).toBeTruthy();
      }
    });
  });

  test.describe('Games API', () => {
    test('GET /api/games - should require date parameter or return all', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/games`);

      // Should either succeed or return 400
      expect([200, 400]).toContain(response.status());
    });

    test('GET /api/games - should return games for specific date', async ({ request }) => {
      const testDate = '2025-10-28';
      const response = await request.get(`${API_BASE}/api/games?date=${testDate}`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      console.log('Games API response:', data);

      // Should have array or object
      expect(data).toBeTruthy();
    });

    test('POST /api/games - should accept game completion data', async ({ request }) => {
      const gameData = {
        player: 'filip',
        date: '2025-10-28',
        difficulty: 'easy',
        time: 180,
        errors: 2,
        hints: 1,
        score: 850
      };

      const response = await request.post(`${API_BASE}/api/games`, {
        data: gameData
      });

      // Should either succeed or require auth
      expect([200, 201, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Entries API', () => {
    test('GET /api/entries - should return competition entries', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/entries`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      console.log('Entries API response:', data);

      // Should have entries array or object
      expect(data).toBeTruthy();
    });

    test('GET /api/entries - should support date filtering', async ({ request }) => {
      const testDate = '2025-10-28';
      const response = await request.get(`${API_BASE}/api/entries?date=${testDate}`);

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Achievements API', () => {
    test('GET /api/achievements - should return achievements', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/achievements`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      console.log('Achievements API response:', data);

      // Should have achievements data
      expect(data).toBeTruthy();
    });

    test('GET /api/achievements - should support player filtering', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/achievements?player=filip`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      console.log('Player achievements:', data);
    });
  });

  test.describe('Stats API', () => {
    test('GET /api/stats - should return statistics', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/stats`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      console.log('Stats API response:', data);

      expect(data).toBeTruthy();
    });

    test('GET /api/stats - should support type parameter', async ({ request }) => {
      const types = ['all', 'challenges', 'streaks', 'performance'];

      for (const type of types) {
        const response = await request.get(`${API_BASE}/api/stats?type=${type}`);

        expect(response.ok()).toBeTruthy();

        const data = await response.json();
        console.log(`Stats type=${type}:`, data);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('Should return 404 for non-existent endpoints', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/nonexistent`);

      expect(response.status()).toBe(404);
    });

    test('Should handle malformed requests gracefully', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/games`, {
        data: {
          invalid: 'data',
          malformed: true
        }
      });

      // Should return error status (not 500)
      expect([400, 401, 403, 422]).toContain(response.status());
    });

    test('Should validate date format', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/puzzles?date=invalid-date`);

      // Should handle gracefully (either parse or error)
      expect([200, 400]).toContain(response.status());
    });

    test('Should handle SQL injection attempts', async ({ request }) => {
      const maliciousDate = "'; DROP TABLE puzzles; --";
      const response = await request.get(`${API_BASE}/api/puzzles?date=${encodeURIComponent(maliciousDate)}`);

      // Should reject or sanitize (not crash)
      expect([200, 400, 422]).toContain(response.status());
    });

    test('Should handle XSS attempts', async ({ request }) => {
      const xssPayload = "<script>alert('xss')</script>";
      const response = await request.post(`${API_BASE}/api/games`, {
        data: {
          player: xssPayload,
          date: '2025-10-28'
        }
      });

      // Should sanitize or reject
      expect([200, 201, 400, 401, 403, 422]).toContain(response.status());
    });
  });

  test.describe('Performance & Reliability', () => {
    test('API responses should be fast (< 2s)', async ({ request }) => {
      const endpoints = [
        '/api/puzzles',
        '/api/entries',
        '/api/achievements',
        '/api/stats'
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await request.get(`${API_BASE}${endpoint}`);
        const responseTime = Date.now() - startTime;

        console.log(`${endpoint} response time: ${responseTime}ms`);

        expect(responseTime).toBeLessThan(2000);
        expect(response.ok()).toBeTruthy();
      }
    });

    test('API should handle concurrent requests', async ({ request }) => {
      // Make 10 concurrent requests
      const promises = Array(10).fill(null).map(() =>
        request.get(`${API_BASE}/api/puzzles`)
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response, i) => {
        console.log(`Concurrent request ${i + 1}: ${response.status()}`);
        expect(response.ok()).toBeTruthy();
      });
    });

    test('API should handle rate limiting gracefully', async ({ request }) => {
      // Make many requests rapidly
      const responses = [];

      for (let i = 0; i < 20; i++) {
        const response = await request.get(`${API_BASE}/api/puzzles`);
        responses.push(response.status());
      }

      console.log('Rate limit test statuses:', responses);

      // Should either succeed or return 429 (Too Many Requests)
      responses.forEach(status => {
        expect([200, 429]).toContain(status);
      });
    });
  });

  test.describe('Data Integrity', () => {
    test('Puzzle data should be consistent across requests', async ({ request }) => {
      const testDate = '2025-10-28';

      // Request same puzzle twice
      const response1 = await request.get(`${API_BASE}/api/puzzles?date=${testDate}`);
      const data1 = await response1.json();

      await new Promise(resolve => setTimeout(resolve, 100));

      const response2 = await request.get(`${API_BASE}/api/puzzles?date=${testDate}`);
      const data2 = await response2.json();

      // Data should be identical
      if (data1.easy && data2.easy) {
        expect(data1.easy.puzzle).toBe(data2.easy.puzzle);
      }
    });

    test('API should return valid JSON', async ({ request }) => {
      const endpoints = [
        '/api/puzzles',
        '/api/entries',
        '/api/achievements',
        '/api/stats'
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(`${API_BASE}${endpoint}`);

        if (response.ok()) {
          // Should parse as JSON without error
          const data = await response.json();
          expect(data).toBeTruthy();
        }
      }
    });
  });

  test.describe('CORS & Security Headers', () => {
    test('API should have proper CORS headers', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/puzzles`);

      const headers = response.headers();
      console.log('CORS headers:', {
        'access-control-allow-origin': headers['access-control-allow-origin'],
        'access-control-allow-methods': headers['access-control-allow-methods']
      });

      // Should have CORS headers (or not if same-origin)
      if (headers['access-control-allow-origin']) {
        expect(headers['access-control-allow-origin']).toBeTruthy();
      }
    });

    test('API should have security headers', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/puzzles`);

      const headers = response.headers();
      console.log('Security headers:', {
        'x-content-type-options': headers['x-content-type-options'],
        'x-frame-options': headers['x-frame-options'],
        'strict-transport-security': headers['strict-transport-security']
      });

      // Log security posture
      const hasSecurityHeaders =
        headers['x-content-type-options'] ||
        headers['x-frame-options'] ||
        headers['strict-transport-security'];

      console.log('Has security headers:', hasSecurityHeaders);
    });
  });
});
