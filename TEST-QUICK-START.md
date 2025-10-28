# 🚀 Testing Quick Start Guide

## One-Time Setup
```bash
npm install
npm run test:install
```

## Run Tests Locally

### Quick Smoke Test (5 min)
```bash
npm run test:critical
```

### Full Test Suite (20 min)
```bash
npm test
```

### By Category
```bash
npm run test:visual          # UI screenshots across devices
npm run test:e2e             # User flow testing
npm run test:accessibility   # WCAG compliance
npm run test:performance     # Speed & bundle size
npm run test:api             # Backend endpoints
```

### By Browser
```bash
npm run test:chromium        # Chrome
npm run test:firefox         # Firefox
npm run test:webkit          # Safari
npm run test:mobile          # Mobile devices
```

### Debug Mode
```bash
npm run test:debug           # Step through tests
npm run test:ui              # Visual test runner
```

## View Results
```bash
npm run test:report          # Open HTML report
```

Results are in `test-results/` folder.

## GitHub Actions

Tests run automatically on:
- Every push to main/develop/feat/fix branches
- Every pull request
- Daily at 6 AM UTC
- Manual trigger from Actions tab

## Common Issues

### "Cannot find module"
```bash
npm install
```

### "Browsers not found"
```bash
npm run test:install
```

### Tests failing locally
```bash
# Clear cache
rm -rf test-results/ playwright-report/

# Reinstall
npm run test:install
```

### Slow tests
```bash
# Run in parallel (default)
npm test

# Run single browser only
npm run test:chromium
```

## Test Files Location
```
tests/
├── visual/           # UI testing
├── e2e/              # User flows
├── accessibility/    # WCAG tests
├── performance/      # Speed tests
├── api/              # Backend tests
└── helpers/          # Shared utilities
```

## Key Files
- `playwright.config.js` - Test configuration
- `.github/workflows/test.yml` - CI/CD automation
- `TESTING.md` - Full documentation

## Performance Budgets
- Page load: < 3s
- First Paint: < 1.5s
- JS bundle: < 2MB
- CSS bundle: < 500KB
- API response: < 2s

## Need Help?
See [TESTING.md](TESTING.md) for full documentation.
