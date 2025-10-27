import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create screenshots directory if it doesn't exist
const screenshotsDir = join(__dirname, 'screenshots');
try {
  mkdirSync(screenshotsDir, { recursive: true });
} catch (err) {
  // Directory already exists
}

async function captureScreenshots() {
  console.log('🎬 Starting screenshot capture...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Use production URL
  const baseUrl = 'https://the-new-london-times.vercel.app';
  console.log(`📍 Using URL: ${baseUrl}`);

  try {
    // 1. Login Page
    console.log('📸 Capturing login page...');
    await page.goto(`${baseUrl}/auth.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: join(screenshotsDir, '01-login-page.png'),
      fullPage: false
    });
    console.log('✅ Login page captured');

    // 2. Login as Faidao
    console.log('🔐 Logging in as Faidao...');
    await page.selectOption('#playerSelect', 'faidao');
    await page.fill('#passwordInput', 'sudoku2024');
    await page.click('.auth-button');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for data to load
    console.log('✅ Logged in successfully');

    // 3. Dashboard
    console.log('📸 Capturing dashboard...');
    await page.screenshot({
      path: join(screenshotsDir, '02-dashboard.png'),
      fullPage: true
    });
    console.log('✅ Dashboard captured');

    // 4. Navigation to Sudoku
    console.log('🎮 Navigating to Sudoku game...');
    await page.goto(`${baseUrl}/sudoku.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 5. Select Easy Difficulty
    console.log('📸 Capturing difficulty selection...');
    await page.screenshot({
      path: join(screenshotsDir, '03-difficulty-selection.png'),
      fullPage: false
    });
    console.log('✅ Difficulty selection captured');

    await page.click('button:has-text("Easy")');
    await page.waitForTimeout(3000); // Wait for puzzle to load

    // 6. Sudoku Game Interface
    console.log('📸 Capturing game interface...');
    await page.screenshot({
      path: join(screenshotsDir, '04-sudoku-game.png'),
      fullPage: true
    });
    console.log('✅ Game interface captured');

    // 7. Make a few moves for demonstration
    console.log('🎮 Making sample moves...');
    const cells = await page.locator('.sudoku-cell:not(.given)').all();
    if (cells.length > 0) {
      await cells[0].click();
      await page.keyboard.press('5');
      await page.waitForTimeout(500);
      if (cells.length > 1) {
        await cells[1].click();
        await page.keyboard.press('3');
        await page.waitForTimeout(500);
      }
    }

    // 8. Game in Progress
    console.log('📸 Capturing game in progress...');
    await page.screenshot({
      path: join(screenshotsDir, '05-game-in-progress.png'),
      fullPage: true
    });
    console.log('✅ Game in progress captured');

    // 9. Navigate to Analytics
    console.log('📊 Navigating to analytics...');
    await page.goto(`${baseUrl}/analytics.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for charts to render
    await page.screenshot({
      path: join(screenshotsDir, '06-analytics.png'),
      fullPage: true
    });
    console.log('✅ Analytics captured');

    // 10. Navigate to Leaderboards
    console.log('🏆 Navigating to leaderboards...');
    await page.goto(`${baseUrl}/leaderboards.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(screenshotsDir, '07-leaderboards.png'),
      fullPage: true
    });
    console.log('✅ Leaderboards captured');

    // 11. Navigate to Achievements
    console.log('⭐ Navigating to achievements...');
    await page.goto(`${baseUrl}/achievements.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(screenshotsDir, '08-achievements.png'),
      fullPage: true
    });
    console.log('✅ Achievements captured');

    // 12. Mobile View - Dashboard
    console.log('📱 Capturing mobile views...');
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(screenshotsDir, '09-mobile-dashboard.png'),
      fullPage: true
    });
    console.log('✅ Mobile dashboard captured');

    // 13. Mobile View - Sudoku
    await page.goto(`${baseUrl}/sudoku.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(screenshotsDir, '10-mobile-sudoku.png'),
      fullPage: true
    });
    console.log('✅ Mobile sudoku captured');

    console.log('🎉 All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    throw error;
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
    console.error('💥 Screenshot capture failed:', error);
    process.exit(1);
  });
