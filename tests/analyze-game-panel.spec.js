const { test } = require('@playwright/test');

/**
 * Detailed Analysis of game-info-panel on Mobile Devices
 * Focus: Hint, Pause, Settings buttons usability
 */

test.describe('Game Info Panel Mobile Analysis', () => {

  test('Analyze game-info-panel on mobile viewports', async ({ page }) => {
    const mobileViewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 12/13' },
      { width: 414, height: 896, name: 'iPhone XR/11' },
      { width: 360, height: 640, name: 'Galaxy S5' },
      { width: 412, height: 915, name: 'Pixel 5' },
    ];

    for (const viewport of mobileViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Mock auth and navigate to sudoku game
      await page.evaluate(() => {
        sessionStorage.setItem('sudokuAuth', 'authenticated');
        sessionStorage.setItem('currentPlayer', 'filip');
      });

      await page.goto('file://' + __dirname + '/../index.html');
      await page.waitForLoadState('networkidle');

      // Navigate to Sudoku page
      await page.click('[data-page="sudoku"]');
      await page.waitForTimeout(1000);

      // Analyze game-info-panel
      const panelAnalysis = await page.evaluate(() => {
        const panel = document.querySelector('.game-info-panel');
        const hintBtn = document.getElementById('hintBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const settingsBtn = document.getElementById('settingsBtn');

        if (!panel) return { error: 'game-info-panel not found' };

        const getButtonData = (btn, name) => {
          if (!btn) return { name, exists: false };

          const rect = btn.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(btn);

          return {
            name,
            exists: true,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom),
            padding: computedStyle.padding,
            fontSize: computedStyle.fontSize,
            minWidth: computedStyle.minWidth,
            minHeight: computedStyle.minHeight,
            display: computedStyle.display,
            textContent: btn.textContent?.trim(),
            // Touch target check (minimum 44x44px recommended)
            meetsMinTouchTarget: rect.width >= 44 && rect.height >= 44,
            touchTargetScore: Math.min(rect.width, rect.height),
          };
        };

        const panelRect = panel.getBoundingClientRect();
        const panelStyle = window.getComputedStyle(panel);

        return {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          panel: {
            width: Math.round(panelRect.width),
            height: Math.round(panelRect.height),
            padding: panelStyle.padding,
            gap: panelStyle.gap,
            gridTemplateColumns: panelStyle.gridTemplateColumns,
            display: panelStyle.display,
          },
          buttons: {
            hint: getButtonData(hintBtn, 'Hint'),
            pause: getButtonData(pauseBtn, 'Pause'),
            settings: getButtonData(settingsBtn, 'Settings'),
          },
          usabilityIssues: [],
        };
      });

      // Analyze usability issues
      const issues = [];

      if (panelAnalysis.buttons) {
        Object.values(panelAnalysis.buttons).forEach(btn => {
          if (!btn.exists) {
            issues.push(`❌ ${btn.name} button not found`);
            return;
          }

          // Check touch target size (44x44px minimum recommended by Apple)
          if (!btn.meetsMinTouchTarget) {
            issues.push(`⚠️  ${btn.name}: Touch target too small (${btn.width}x${btn.height}px, need 44x44px)`);
          }

          // Check if button is too narrow
          if (btn.width < 60) {
            issues.push(`⚠️  ${btn.name}: Button too narrow (${btn.width}px wide)`);
          }

          // Check if button is cut off
          if (btn.right > window.innerWidth) {
            issues.push(`❌ ${btn.name}: Button extends beyond viewport (${btn.right - window.innerWidth}px overflow)`);
          }
        });
      }

      panelAnalysis.usabilityIssues = issues;

      // Console output
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
      console.log(`${'='.repeat(60)}\n`);

      console.log('📊 Panel Dimensions:');
      console.log(`   Width: ${panelAnalysis.panel?.width}px`);
      console.log(`   Height: ${panelAnalysis.panel?.height}px`);
      console.log(`   Padding: ${panelAnalysis.panel?.padding}`);
      console.log(`   Gap: ${panelAnalysis.panel?.gap}`);
      console.log(`   Grid Template: ${panelAnalysis.panel?.gridTemplateColumns}`);
      console.log('');

      console.log('🔘 Button Analysis:');
      Object.values(panelAnalysis.buttons).forEach(btn => {
        if (btn.exists) {
          const statusIcon = btn.meetsMinTouchTarget ? '✅' : '❌';
          console.log(`\n   ${statusIcon} ${btn.name}:`);
          console.log(`      Size: ${btn.width}x${btn.height}px`);
          console.log(`      Touch Target: ${btn.meetsMinTouchTarget ? 'GOOD' : 'TOO SMALL'} (score: ${btn.touchTargetScore}px)`);
          console.log(`      Padding: ${btn.padding}`);
          console.log(`      Font Size: ${btn.fontSize}`);
          console.log(`      Text: "${btn.textContent}"`);
        } else {
          console.log(`\n   ❌ ${btn.name}: NOT FOUND`);
        }
      });

      if (issues.length > 0) {
        console.log(`\n\n⚠️  USABILITY ISSUES (${issues.length}):`);
        issues.forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue}`);
        });
      } else {
        console.log('\n\n✅ No major usability issues found!');
      }

      // Take screenshot
      await page.screenshot({
        path: `tests/screenshots/game-panel-${viewport.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: false
      });
    }
  });

  test('Analyze game-info-panel CSS specifics', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.evaluate(() => {
      sessionStorage.setItem('sudokuAuth', 'authenticated');
      sessionStorage.setItem('currentPlayer', 'filip');
    });

    await page.goto('file://' + __dirname + '/../index.html');
    await page.waitForLoadState('networkidle');
    await page.click('[data-page="sudoku"]');
    await page.waitForTimeout(1000);

    // Get CSS rules affecting the panel
    const cssAnalysis = await page.evaluate(() => {
      const panel = document.querySelector('.game-info-panel');
      const gameControls = document.querySelector('.game-controls');
      const actionBtns = document.querySelectorAll('.action-btn');

      const getCSSRules = (element, selector) => {
        if (!element) return null;

        const computed = window.getComputedStyle(element);
        return {
          selector,
          display: computed.display,
          flexDirection: computed.flexDirection,
          flexWrap: computed.flexWrap,
          gap: computed.gap,
          padding: computed.padding,
          minWidth: computed.minWidth,
          maxWidth: computed.maxWidth,
          width: computed.width,
          gridTemplateColumns: computed.gridTemplateColumns,
          justifyContent: computed.justifyContent,
          alignItems: computed.alignItems,
        };
      };

      return {
        panel: getCSSRules(panel, '.game-info-panel'),
        gameControls: getCSSRules(gameControls, '.game-controls'),
        actionBtn: actionBtns.length > 0 ? getCSSRules(actionBtns[0], '.action-btn') : null,
      };
    });

    console.log('\n\n' + '='.repeat(60));
    console.log('🎨 CSS ANALYSIS (Mobile 375px)');
    console.log('='.repeat(60));
    console.log('\n.game-info-panel:');
    console.log(JSON.stringify(cssAnalysis.panel, null, 2));
    console.log('\n.game-controls:');
    console.log(JSON.stringify(cssAnalysis.gameControls, null, 2));
    console.log('\n.action-btn:');
    console.log(JSON.stringify(cssAnalysis.actionBtn, null, 2));
  });

  test('Compare button sizes across viewports', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1024, height: 768, name: 'Small Desktop' },
    ];

    const comparison = {};

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.evaluate(() => {
        sessionStorage.setItem('sudokuAuth', 'authenticated');
        sessionStorage.setItem('currentPlayer', 'filip');
      });

      await page.goto('file://' + __dirname + '/../index.html');
      await page.waitForLoadState('networkidle');
      await page.click('[data-page="sudoku"]');
      await page.waitForTimeout(1000);

      const sizes = await page.evaluate(() => {
        const getSize = (id) => {
          const el = document.getElementById(id);
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        };

        return {
          hint: getSize('hintBtn'),
          pause: getSize('pauseBtn'),
          settings: getSize('settingsBtn'),
        };
      });

      comparison[viewport.name] = sizes;
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('📊 BUTTON SIZE COMPARISON');
    console.log('='.repeat(60));
    console.log(JSON.stringify(comparison, null, 2));
  });
});
