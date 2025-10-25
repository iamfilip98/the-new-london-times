const { test, expect } = require('@playwright/test');

test.describe('Timer Layout Shift Fix', () => {
  test('timer should not cause layout shift when ticking', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForSelector('#difficultyModal');

    // Select easy difficulty and start game
    await page.click('button:has-text("Easy")');
    await page.waitForSelector('.sudoku-grid');

    // Get initial timer element position
    const timerDisplay = page.locator('#timerDisplay');
    await timerDisplay.waitFor({ state: 'visible' });

    const initialBox = await timerDisplay.boundingBox();
    const initialText = await timerDisplay.textContent();

    console.log(`Initial timer: "${initialText}" at x=${initialBox.x}, width=${initialBox.width}`);

    // Wait for timer to tick several times
    await page.waitForTimeout(3000);

    const afterBox = await timerDisplay.boundingBox();
    const afterText = await timerDisplay.textContent();

    console.log(`After ticking: "${afterText}" at x=${afterBox.x}, width=${afterBox.width}`);

    // Verify the timer position and width didn't change
    expect(afterBox.x).toBe(initialBox.x);
    expect(afterBox.width).toBe(initialBox.width);

    console.log('✅ Timer position stable - no layout shift');
  });

  test('timer should maintain stable width when going from 9:XX to 10:XX', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForSelector('#difficultyModal');

    // Select easy difficulty and start game
    await page.click('button:has-text("Easy")');
    await page.waitForSelector('.sudoku-grid');

    const timerDisplay = page.locator('#timerDisplay');

    // Manually set timer to 9:58 using JavaScript
    await page.evaluate(() => {
      window.game.timer = 598; // 9:58
      document.getElementById('timerDisplay').textContent = window.game.formatTime(598);
    });

    const box9min = await timerDisplay.boundingBox();
    const text9min = await timerDisplay.textContent();
    console.log(`At 9:58: "${text9min}" width=${box9min.width}`);

    // Wait for timer to tick to 10:00
    await page.waitForTimeout(3000);

    const box10min = await timerDisplay.boundingBox();
    const text10min = await timerDisplay.textContent();
    console.log(`After 10:00: "${text10min}" width=${box10min.width}`);

    // Verify width is stable across single->double digit minutes
    expect(box10min.x).toBe(box9min.x);
    expect(box10min.width).toBe(box9min.width);

    console.log('✅ Timer width stable across 9:XX → 10:XX transition');
  });

  test('timer element should have min-width CSS property', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.waitForSelector('#difficultyModal');
    await page.click('button:has-text("Easy")');
    await page.waitForSelector('.sudoku-grid');

    const timerDisplay = page.locator('#timerDisplay');

    // Check computed styles
    const minWidth = await timerDisplay.evaluate((el) => {
      return window.getComputedStyle(el).minWidth;
    });

    console.log(`Timer min-width: ${minWidth}`);

    // Should not be 'auto' or '0px'
    expect(minWidth).not.toBe('auto');
    expect(minWidth).not.toBe('0px');

    console.log('✅ Timer has min-width set');
  });
});
