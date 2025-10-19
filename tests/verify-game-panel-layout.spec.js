const { test } = require('@playwright/test');

/**
 * Visual verification of game-info-panel layout on mobile
 * Tests the actual rendering after button size changes
 */

test.describe('Game Info Panel Layout Verification', () => {

  test('Verify game-info-panel layout on mobile viewports', async ({ page }) => {
    const mobileViewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 12/13' },
      { width: 414, height: 896, name: 'iPhone XR/11' },
    ];

    for (const viewport of mobileViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('file://' + __dirname + '/../index.html');
      await page.waitForLoadState('networkidle');

      // Navigate to Sudoku page
      await page.click('[data-page="sudoku"]');
      await page.waitForTimeout(1000);

      // Analyze layout
      const layoutAnalysis = await page.evaluate(() => {
        const panel = document.querySelector('.game-info-panel');
        const timerSection = document.querySelector('.timer-section');
        const statsSection = document.querySelector('.stats-section');
        const gameControls = document.querySelector('.game-controls');
        const buttons = Array.from(document.querySelectorAll('.game-controls .icon-btn'));

        if (!panel) return { error: 'Panel not found' };

        const panelRect = panel.getBoundingClientRect();
        const panelStyle = window.getComputedStyle(panel);

        const getElementInfo = (el, name) => {
          if (!el) return { name, exists: false };
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return {
            name,
            exists: true,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            overflowsViewport: rect.right > window.innerWidth,
            overflowsParent: rect.right > panelRect.right,
            display: style.display,
            flexGrow: style.flexGrow,
            flexShrink: style.flexShrink,
            minWidth: style.minWidth,
            maxWidth: style.maxWidth,
          };
        };

        const buttonDetails = buttons.map((btn, i) => {
          const rect = btn.getBoundingClientRect();
          const style = window.getComputedStyle(btn);
          return {
            index: i,
            id: btn.id,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            overflowsViewport: rect.right > window.innerWidth,
            overflowsParent: rect.right > panelRect.right,
            fontSize: style.fontSize,
          };
        });

        return {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          panel: {
            ...getElementInfo(panel, 'game-info-panel'),
            display: panelStyle.display,
            flexWrap: panelStyle.flexWrap,
            gap: panelStyle.gap,
            padding: panelStyle.padding,
            justifyContent: panelStyle.justifyContent,
            overflowX: panelStyle.overflowX,
          },
          timerSection: getElementInfo(timerSection, 'timer-section'),
          statsSection: getElementInfo(statsSection, 'stats-section'),
          gameControls: {
            ...getElementInfo(gameControls, 'game-controls'),
            gap: gameControls ? window.getComputedStyle(gameControls).gap : 'N/A',
          },
          buttons: buttonDetails,
          issues: [],
        };
      });

      // Analyze issues
      const issues = [];

      // Check if panel overflows
      if (layoutAnalysis.panel.overflowsViewport) {
        issues.push(`❌ Panel overflows viewport by ${layoutAnalysis.panel.right - layoutAnalysis.viewport.width}px`);
      }

      // Check if any button overflows
      layoutAnalysis.buttons.forEach(btn => {
        if (btn.overflowsViewport) {
          issues.push(`❌ ${btn.id} overflows viewport (right: ${btn.right}px, viewport: ${layoutAnalysis.viewport.width}px)`);
        }
        if (btn.overflowsParent) {
          issues.push(`⚠️  ${btn.id} overflows parent panel`);
        }
      });

      // Check if controls overflow parent
      if (layoutAnalysis.gameControls.overflowsParent) {
        issues.push(`⚠️  game-controls overflows panel`);
      }

      // Calculate total width needed
      const totalButtonWidth = layoutAnalysis.buttons.reduce((sum, btn) => sum + btn.width, 0);
      const gapWidth = layoutAnalysis.gameControls.gap ?
        parseFloat(layoutAnalysis.gameControls.gap) * (layoutAnalysis.buttons.length - 1) : 0;
      const totalControlsWidth = totalButtonWidth + gapWidth;

      console.log(`\n${'='.repeat(70)}`);
      console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
      console.log(`${'='.repeat(70)}\n`);

      console.log('📊 Panel Layout:');
      console.log(`   Display: ${layoutAnalysis.panel.display}`);
      console.log(`   Flex Wrap: ${layoutAnalysis.panel.flexWrap}`);
      console.log(`   Gap: ${layoutAnalysis.panel.gap}`);
      console.log(`   Padding: ${layoutAnalysis.panel.padding}`);
      console.log(`   Width: ${layoutAnalysis.panel.width}px (viewport: ${layoutAnalysis.viewport.width}px)`);
      console.log(`   Justify Content: ${layoutAnalysis.panel.justifyContent}`);
      console.log('');

      console.log('📐 Panel Children:');
      console.log(`   Timer Section: ${layoutAnalysis.timerSection.width}px`);
      console.log(`   Stats Section: ${layoutAnalysis.statsSection.width}px`);
      console.log(`   Game Controls: ${layoutAnalysis.gameControls.width}px`);
      console.log('');

      console.log('🔘 Buttons Analysis:');
      layoutAnalysis.buttons.forEach(btn => {
        const overflowIcon = btn.overflowsViewport ? '❌' : '✅';
        console.log(`   ${overflowIcon} ${btn.id}: ${btn.width}x${btn.height}px, right: ${btn.right}px`);
      });
      console.log('');

      console.log('📏 Width Calculations:');
      console.log(`   Total button width: ${totalButtonWidth}px`);
      console.log(`   Gap width (${layoutAnalysis.gameControls.gap}): ~${gapWidth}px`);
      console.log(`   Total controls needed: ~${totalControlsWidth}px`);
      console.log(`   Controls actual width: ${layoutAnalysis.gameControls.width}px`);
      console.log(`   Timer + Stats width: ${layoutAnalysis.timerSection.width + layoutAnalysis.statsSection.width}px`);
      console.log(`   Available for all: ${layoutAnalysis.panel.width}px`);
      console.log('');

      if (issues.length > 0) {
        console.log(`⚠️  LAYOUT ISSUES (${issues.length}):`);
        issues.forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue}`);
        });
      } else {
        console.log('✅ No layout overflow issues detected!');
      }
      console.log('');

      // Take screenshot
      await page.screenshot({
        path: `tests/screenshots/panel-layout-${viewport.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: false
      });
    }
  });

  test('Check what happens with different content lengths', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('file://' + __dirname + '/../index.html');
    await page.waitForLoadState('networkidle');
    await page.click('[data-page="sudoku"]');
    await page.waitForTimeout(1000);

    console.log('\n' + '='.repeat(70));
    console.log('🧪 Testing with simulated long timer and stats');
    console.log('='.repeat(70) + '\n');

    const testResults = await page.evaluate(() => {
      const timerDisplay = document.querySelector('.timer-display');
      const statsSection = document.querySelector('.stats-section');
      const panel = document.querySelector('.game-info-panel');

      const results = [];

      // Test 1: Normal state
      const normalState = {
        name: 'Normal state',
        panelWidth: panel.getBoundingClientRect().width,
        viewportWidth: window.innerWidth,
        overflow: panel.getBoundingClientRect().right > window.innerWidth,
      };
      results.push(normalState);

      // Test 2: Long timer (99:59:59)
      if (timerDisplay) {
        const originalTimer = timerDisplay.textContent;
        timerDisplay.textContent = '99:59:59';
        const longTimerState = {
          name: 'Long timer (99:59:59)',
          panelWidth: panel.getBoundingClientRect().width,
          viewportWidth: window.innerWidth,
          overflow: panel.getBoundingClientRect().right > window.innerWidth,
        };
        results.push(longTimerState);
        timerDisplay.textContent = originalTimer;
      }

      return results;
    });

    testResults.forEach(result => {
      const status = result.overflow ? '❌' : '✅';
      console.log(`${status} ${result.name}:`);
      console.log(`   Panel width: ${result.panelWidth}px`);
      console.log(`   Viewport: ${result.viewportWidth}px`);
      console.log(`   Overflows: ${result.overflow}\n`);
    });
  });
});
