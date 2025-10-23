const { test } = require('@playwright/test');

test('Debug game-info-panel height breakdown', async ({ page }) => {
  // Test on mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('https://the-new-london-times.vercel.app/sudoku.html');
  await page.waitForLoadState('networkidle');

  const analysis = await page.evaluate(() => {
    const panel = document.querySelector('.game-info-panel');
    if (!panel) return { error: 'Panel not found' };

    const panelStyles = window.getComputedStyle(panel);
    const panelRect = panel.getBoundingClientRect();

    // Get all child sections
    const timer = document.querySelector('.timer-section');
    const stats = document.querySelector('.stats-section');
    const controls = document.querySelector('.game-controls');
    const buttons = Array.from(document.querySelectorAll('.game-controls .icon-btn'));

    return {
      panel: {
        totalHeight: Math.round(panelRect.height),
        paddingTop: panelStyles.paddingTop,
        paddingBottom: panelStyles.paddingBottom,
        paddingLeft: panelStyles.paddingLeft,
        paddingRight: panelStyles.paddingRight,
        gap: panelStyles.gap,
        alignItems: panelStyles.alignItems,
        display: panelStyles.display,
        minHeight: panelStyles.minHeight,
        maxHeight: panelStyles.maxHeight,
      },
      timer: timer ? {
        height: Math.round(timer.getBoundingClientRect().height),
        paddingTop: window.getComputedStyle(timer).paddingTop,
        paddingBottom: window.getComputedStyle(timer).paddingBottom,
        gap: window.getComputedStyle(timer).gap,
      } : null,
      stats: stats ? {
        height: Math.round(stats.getBoundingClientRect().height),
        paddingTop: window.getComputedStyle(stats).paddingTop,
        paddingBottom: window.getComputedStyle(stats).paddingBottom,
        gap: window.getComputedStyle(stats).gap,
      } : null,
      controls: controls ? {
        height: Math.round(controls.getBoundingClientRect().height),
        paddingTop: window.getComputedStyle(controls).paddingTop,
        paddingBottom: window.getComputedStyle(controls).paddingBottom,
        gap: window.getComputedStyle(controls).gap,
      } : null,
      buttons: buttons.map(btn => ({
        height: Math.round(btn.getBoundingClientRect().height),
        width: Math.round(btn.getBoundingClientRect().width),
      })),
    };
  });

  console.log('\n==========================================================');
  console.log('GAME-INFO-PANEL HEIGHT BREAKDOWN (Mobile 390px)');
  console.log('==========================================================\n');

  console.log('📏 PANEL DIMENSIONS:');
  console.log(`   Total Height: ${analysis.panel.totalHeight}px`);
  console.log(`   Padding Top: ${analysis.panel.paddingTop}`);
  console.log(`   Padding Bottom: ${analysis.panel.paddingBottom}`);
  console.log(`   Padding Left: ${analysis.panel.paddingLeft}`);
  console.log(`   Padding Right: ${analysis.panel.paddingRight}`);
  console.log(`   Gap: ${analysis.panel.gap}`);
  console.log(`   Align Items: ${analysis.panel.alignItems}`);
  console.log(`   Display: ${analysis.panel.display}`);
  console.log(`   Min Height: ${analysis.panel.minHeight}`);
  console.log(`   Max Height: ${analysis.panel.maxHeight}`);
  console.log('');

  console.log('⏱  TIMER SECTION:');
  console.log(`   Height: ${analysis.timer.height}px`);
  console.log(`   Padding Top: ${analysis.timer.paddingTop}`);
  console.log(`   Padding Bottom: ${analysis.timer.paddingBottom}`);
  console.log(`   Gap: ${analysis.timer.gap}`);
  console.log('');

  console.log('📊 STATS SECTION:');
  console.log(`   Height: ${analysis.stats.height}px`);
  console.log(`   Padding Top: ${analysis.stats.paddingTop}`);
  console.log(`   Padding Bottom: ${analysis.stats.paddingBottom}`);
  console.log(`   Gap: ${analysis.stats.gap}`);
  console.log('');

  console.log('🎮 CONTROLS SECTION:');
  console.log(`   Height: ${analysis.controls.height}px`);
  console.log(`   Padding Top: ${analysis.controls.paddingTop}`);
  console.log(`   Padding Bottom: ${analysis.controls.paddingBottom}`);
  console.log(`   Gap: ${analysis.controls.gap}`);
  console.log('');

  console.log('🔘 BUTTONS:');
  analysis.buttons.forEach((btn, i) => {
    console.log(`   Button ${i + 1}: ${btn.width}x${btn.height}px`);
  });
  console.log('');

  console.log('🧮 HEIGHT CALCULATION:');
  const expectedContentHeight = Math.max(
    analysis.timer.height,
    analysis.stats.height,
    analysis.controls.height
  );
  const paddingTop = parseFloat(analysis.panel.paddingTop);
  const paddingBottom = parseFloat(analysis.panel.paddingBottom);
  const expectedTotal = expectedContentHeight + paddingTop + paddingBottom;

  console.log(`   Tallest content: ${expectedContentHeight}px`);
  console.log(`   + Padding top: ${paddingTop}px`);
  console.log(`   + Padding bottom: ${paddingBottom}px`);
  console.log(`   = Expected: ${Math.round(expectedTotal)}px`);
  console.log(`   Actual: ${analysis.panel.totalHeight}px`);
  console.log(`   Difference: ${Math.round(analysis.panel.totalHeight - expectedTotal)}px`);
  console.log('');
});
