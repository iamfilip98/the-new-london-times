import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const screenshotsDir = join(__dirname, 'screenshots');
try {
  mkdirSync(screenshotsDir, { recursive: true });
} catch (err) {}

async function captureScreenshots() {
  console.log('🎬 Starting simple screenshot capture...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const baseUrl = 'https://the-new-london-times.vercel.app';
  console.log(`📍 Using URL: ${baseUrl}`);

  try {
    // 1. Login Page
    console.log('📸 1/10 - Capturing login page...');
    await page.goto(`${baseUrl}/auth.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(screenshotsDir, '01-login-page.png') });
    console.log('✅ Login page captured');

    // 2. Login as Faidao
    console.log('🔐 Logging in...');
    await page.selectOption('#playerSelect', 'faidao');
    await page.fill('#passwordInput', 'sudoku2024');
    await page.click('.auth-button');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // 3. Dashboard
    console.log('📸 2/10 - Capturing dashboard...');
    await page.screenshot({ path: join(screenshotsDir, '02-dashboard.png'), fullPage: true });
    console.log('✅ Dashboard captured');

    // 4. Analytics (direct navigation)
    console.log('📸 3/10 - Capturing analytics...');
    await page.goto(`${baseUrl}/analytics.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(screenshotsDir, '03-analytics.png'), fullPage: true });
    console.log('✅ Analytics captured');

    // 5. Leaderboards
    console.log('📸 4/10 - Capturing leaderboards...');
    await page.goto(`${baseUrl}/leaderboards.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '04-leaderboards.png'), fullPage: true });
    console.log('✅ Leaderboards captured');

    // 6. Achievements
    console.log('📸 5/10 - Capturing achievements...');
    await page.goto(`${baseUrl}/achievements.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '05-achievements.png'), fullPage: true });
    console.log('✅ Achievements captured');

    // 7. FAQ
    console.log('📸 6/10 - Capturing FAQ...');
    await page.goto(`${baseUrl}/faq.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '06-faq.png'), fullPage: true });
    console.log('✅ FAQ captured');

    // 8. Sudoku page (difficulty selection)
    console.log('📸 7/10 - Capturing Sudoku page...');
    await page.goto(`${baseUrl}/sudoku.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '07-sudoku-page.png'), fullPage: true });
    console.log('✅ Sudoku page captured');

    // 9. Mobile Dashboard
    console.log('📸 8/10 - Capturing mobile dashboard...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '08-mobile-dashboard.png'), fullPage: true });
    console.log('✅ Mobile dashboard captured');

    // 10. Mobile FAQ
    console.log('📸 9/10 - Capturing mobile FAQ...');
    await page.goto(`${baseUrl}/faq.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '09-mobile-faq.png'), fullPage: true });
    console.log('✅ Mobile FAQ captured');

    // 11. Desktop Dashboard at wider view
    console.log('📸 10/10 - Capturing wide dashboard...');
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '10-wide-dashboard.png'), fullPage: false });
    console.log('✅ Wide dashboard captured');

    console.log('🎉 All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error.message);
    console.log('📸 Partial screenshots may have been saved');
  } finally {
    await browser.close();
  }
}

captureScreenshots()
  .then(() => {
    console.log('✨ Screenshot capture complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Screenshot capture failed:', error.message);
    process.exit(1);
  });
