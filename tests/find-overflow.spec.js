const { test } = require('@playwright/test');

/**
 * Detailed Overflow Detection Test
 * Finds exact elements causing horizontal scroll
 */

test('Find elements causing horizontal overflow on small desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });

  // Mock auth
  await page.evaluate(() => {
    sessionStorage.setItem('sudokuAuth', 'authenticated');
    sessionStorage.setItem('currentPlayer', 'filip');
  });

  await page.goto('file://' + __dirname + '/../index.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Find all elements wider than viewport
  const overflowingElements = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const allElements = document.querySelectorAll('*');
    const overflowing = [];

    allElements.forEach(el => {
      const rect = el.getBoundingBox();
      const computedStyle = window.getComputedStyle(el);

      // Check if element extends beyond viewport
      if (rect.right > viewportWidth) {
        const overflow = rect.right - viewportWidth;

        // Only report significant overflows (> 5px)
        if (overflow > 5) {
          overflowing.push({
            tag: el.tagName,
            class: el.className,
            id: el.id,
            width: rect.width,
            right: rect.right,
            overflow: overflow,
            position: computedStyle.position,
            display: computedStyle.display,
            selector: `${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ').join('.') : ''}`,
          });
        }
      }
    });

    // Sort by overflow amount (most problematic first)
    return overflowing.sort((a, b) => b.overflow - a.overflow).slice(0, 20);
  });

  console.log('\n===========================================');
  console.log('🔍 ELEMENTS CAUSING HORIZONTAL OVERFLOW');
  console.log('===========================================\n');
  console.log(`Viewport width: 1024px\n`);

  overflowingElements.forEach((el, i) => {
    console.log(`${i + 1}. ${el.selector}`);
    console.log(`   Width: ${el.width}px`);
    console.log(`   Right edge: ${el.right}px`);
    console.log(`   Overflow: ${el.overflow}px`);
    console.log(`   Position: ${el.position}, Display: ${el.display}`);
    console.log('');
  });

  // Check specific problematic areas
  const sudokuCheck = await page.evaluate(() => {
    const sudokuGame = document.querySelector('.sudoku-game');
    const sudokuGrid = document.querySelector('.sudoku-grid');
    const sudokuContainer = document.querySelector('.sudoku-grid-container');
    const gameControls = document.querySelector('.game-controls');
    const actionButtons = document.querySelector('.action-buttons');

    const getData = (el, name) => {
      if (!el) return { name, exists: false };
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        name,
        exists: true,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        minWidth: style.minWidth,
        maxWidth: style.maxWidth,
        padding: style.padding,
        margin: style.margin,
      };
    };

    return {
      sudokuGame: getData(sudokuGame, 'sudoku-game'),
      sudokuGrid: getData(sudokuGrid, 'sudoku-grid'),
      sudokuContainer: getData(sudokuContainer, 'sudoku-grid-container'),
      gameControls: getData(gameControls, 'game-controls'),
      actionButtons: getData(actionButtons, 'action-buttons'),
    };
  });

  console.log('\n===========================================');
  console.log('📊 SUDOKU GAME ELEMENT DIMENSIONS');
  console.log('===========================================\n');
  console.log(JSON.stringify(sudokuCheck, null, 2));

  // Take a screenshot
  await page.screenshot({
    path: 'tests/screenshots/overflow-analysis.png',
    fullPage: true
  });
});
