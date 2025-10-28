# 🧪 Testing Documentation

## Overview

This project uses a **comprehensive, production-grade testing system** with Playwright to ensure quality across all devices, browsers, and use cases.

## Test Categories

### 1. 📸 **Visual Regression Tests** (`tests/visual/`)
Tests UI appearance and responsiveness across **12+ devices** (mobile, tablet, desktop).

**Devices Tested:**
- Mobile: iPhone SE, iPhone 12, iPhone 14 Pro Max, Pixel 5, Galaxy S20
- Tablet: iPad Mini, iPad Pro
- Desktop: 1280x720, 1366x768, 1920x1080, 2560x1440

**Features:**
- Screenshot comparison across devices
- Dark mode testing
- Landscape orientation testing
- Horizontal overflow detection
- Touch target size validation

### 2. 🎯 **End-to-End Tests** (`tests/e2e/`)
Tests complete user journeys from authentication to game completion.

**Flows Tested:**
- Authentication → Dashboard → Game → Analytics
- Navigation between sections
- Sudoku game interactions
- Keyboard navigation
- Mobile user journeys

### 3. ♿ **Accessibility Tests** (`tests/accessibility/`)
Ensures WCAG 2.1 Level AA compliance.

**Checks:**
- Keyboard navigation (Tab, Arrow keys, Escape)
- ARIA labels and roles
- Color contrast ratios (4.5:1 minimum)
- Screen reader support
- Touch target size (44x44px minimum)
- Focus management
- Heading hierarchy

### 4. ⚡ **Performance Tests** (`tests/performance/`)
Monitors page load times, bundle sizes, and runtime performance.

**Metrics:**
- Page load time (< 3s target)
- First Contentful Paint (< 1.5s)
- JavaScript bundle (< 2MB)
- CSS bundle (< 500KB)
- API response time (< 2s)
- Slow 3G performance
- Memory leaks detection

### 5. 🔌 **API Tests** (`tests/api/`)
Validates all API endpoints for correctness and security.

**Coverage:**
- `/api/auth` - Authentication
- `/api/puzzles` - Puzzle retrieval
- `/api/games` - Game state
- `/api/entries` - Competition entries
- `/api/achievements` - Achievement tracking
- `/api/stats` - Statistics

**Validation:**
- Response status codes
- Data format validation
- Error handling
- Security (SQL injection, XSS)
- Performance (concurrent requests)
- CORS headers

## Running Tests

### Install Dependencies
```bash
npm install
npm run test:install  # Install Playwright browsers
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
npm run test:visual          # Visual regression tests
npm run test:e2e             # End-to-end user flows
npm run test:accessibility   # Accessibility compliance
npm run test:performance     # Performance benchmarks
npm run test:api             # API endpoint tests
```

### Run on Specific Browsers
```bash
npm run test:chromium   # Chrome/Edge
npm run test:firefox    # Firefox
npm run test:webkit     # Safari
npm run test:mobile     # Mobile Chrome + Safari
```

### Run Critical Tests Only (Fast)
```bash
npm run test:critical   # Quick smoke tests
```

### Debug Tests
```bash
npm run test:debug      # Interactive debugging
npm run test:ui         # Playwright UI mode
```

### View Test Report
```bash
npm run test:report     # Open HTML report
```

## GitHub Actions CI/CD

Tests run automatically on:
- ✅ Every push to `main`, `develop`, `feat/**`, `fix/**`
- ✅ Every pull request
- ✅ Daily at 6 AM UTC (scheduled)
- ✅ Manual trigger via Actions tab

### CI/CD Features
- **Matrix Testing**: Parallel execution across 5 browsers
- **Artifact Upload**: Screenshots, videos, traces saved for 30 days
- **PR Comments**: Automated test results posted on pull requests
- **Test Reports**: HTML reports with visual diffs
- **Failure Screenshots**: Auto-captured on test failures
- **Video Recording**: Failed tests recorded for debugging

### CI/CD Jobs
1. 📸 **Visual Regression** - All devices and browsers
2. 🎯 **E2E Tests** - Matrix across 5 browser configurations
3. ♿ **Accessibility** - WCAG compliance checks
4. ⚡ **Performance** - Load time and bundle size monitoring
5. 🔌 **API Tests** - Endpoint validation
6. 📋 **Test Report** - Consolidated results
7. 💬 **PR Comment** - Results posted to pull requests

## Test Results & Artifacts

### Local Testing
Results are saved to `test-results/`:
```
test-results/
├── visual/           # Screenshots by device/category
├── e2e/              # E2E test screenshots
├── accessibility/    # A11y test results
├── artifacts/        # Videos, traces
└── html-report/      # Interactive HTML report
```

### CI/CD Artifacts
Available in GitHub Actions for 30 days:
- `visual-test-results` - Visual regression screenshots
- `e2e-results-{browser}` - E2E results per browser
- `accessibility-results` - A11y test reports
- `performance-results` - Performance metrics
- `api-test-results` - API test logs
- `all-test-results-combined` - Everything combined

## Writing New Tests

### Test Structure
```javascript
import { test, expect } from '@playwright/test';
import { waitForPageReady, mockAuth, mockAPIResponses } from '../helpers/test-utils.js';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Setup
    await mockAuth(page);
    await mockAPIResponses(page);

    // Navigate
    await page.goto('/');
    await waitForPageReady(page);

    // Test
    await expect(page.locator('.element')).toBeVisible();

    // Screenshot
    await page.screenshot({ path: 'test-results/feature.png' });
  });
});
```

### Helper Functions
Use helpers from `tests/helpers/test-utils.js`:
- `waitForPageReady(page)` - Wait for page load
- `mockAuth(page, username)` - Mock authentication
- `mockAPIResponses(page)` - Mock API calls
- `hasHorizontalOverflow(page)` - Check overflow
- `isInViewport(page, selector)` - Check visibility
- `checkColorContrast(page, selector)` - Check WCAG compliance
- `measurePerformance(page)` - Get performance metrics

### Device Configuration
Use devices from `tests/helpers/devices.js`:
```javascript
import { getAllDevices, CRITICAL_DEVICES, DEVICES } from '../helpers/devices.js';

const allDevices = getAllDevices();
const mobileDevices = DEVICES.mobile;
```

## Best Practices

### 1. **Use Descriptive Test Names**
```javascript
// Good
test('User can complete Sudoku game and view score on iPhone 12', ...)

// Bad
test('test1', ...)
```

### 2. **Mock API Calls for Isolation**
```javascript
await mockAPIResponses(page);  // Don't depend on backend
```

### 3. **Take Screenshots on Important Steps**
```javascript
await page.screenshot({ path: 'test-results/step-1-login.png' });
```

### 4. **Use continue-on-error for Non-Critical Tests**
Visual regression and some edge cases should not block deployment.

### 5. **Keep Tests Fast**
- Use `test.describe.parallel()` where possible
- Mock slow operations
- Set reasonable timeouts

### 6. **Test on Multiple Devices**
Mobile-first issues are common - always test mobile viewports.

## Performance Budgets

Tests will fail if:
- Page load > 3 seconds
- First Contentful Paint > 1.5 seconds
- JavaScript bundle > 2MB
- CSS bundle > 500KB
- API response > 2 seconds
- Image > 500KB

## Accessibility Requirements

Tests will fail if:
- Color contrast < 4.5:1 (WCAG AA)
- Touch targets < 44x44px
- Missing ARIA labels on interactive elements
- Keyboard navigation broken
- Improper heading hierarchy

## Troubleshooting

### Tests Failing Locally
```bash
# Update browsers
npm run test:install

# Clear cache
rm -rf test-results/ playwright-report/

# Run with debug mode
npm run test:debug
```

### Tests Passing Locally but Failing in CI
- Check viewport sizes (CI uses default sizes)
- Check timing (CI may be slower)
- Check environment variables
- Look at CI artifacts for screenshots/videos

### Flaky Tests
- Increase timeouts: `test.setTimeout(90000)`
- Add explicit waits: `await page.waitForTimeout(500)`
- Use `waitForLoadState('networkidle')`
- Enable retries in CI (already configured)

## Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Visual Regression | 12+ devices | 12+ devices ✅ |
| E2E User Flows | Core journeys | All journeys |
| Accessibility | WCAG AA | WCAG AA ✅ |
| Performance | Key metrics | Full metrics ✅ |
| API Endpoints | All endpoints | All endpoints ✅ |
| Browser Coverage | Chrome, Firefox, Safari | All major ✅ |

## Continuous Improvement

### Monitoring Test Health
- Review CI results weekly
- Update performance budgets quarterly
- Add tests for new features immediately
- Fix flaky tests as top priority

### Adding New Tests
1. Create test file in appropriate directory
2. Use existing helpers and devices
3. Add to CI workflow if needed
4. Document in this file

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Performance Best Practices](https://web.dev/performance/)

---

**Test System Version**: 1.0
**Last Updated**: October 2025
**Maintained By**: Development Team
