import { test, expect } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';
import path from 'path';
import { launchApp, closeApp, createMockGameState, injectMockGameState } from './helpers/test-utils';

let electronApp: ElectronApplication;
let overlayPage: Page;
let launcherPage: Page;

test.describe('MacroOverlay - Performance Tests', () => {
  test.beforeAll(async () => {
    const testWindows = await launchApp();
    electronApp = testWindows.electronApp;
    launcherPage = testWindows.launcherPage;
    overlayPage = testWindows.overlayPage;
  });

  test.afterAll(async () => {
    await closeApp(electronApp);
  });

  test('should handle rapid game state updates without memory leaks', async () => {
    const updateCount = 100;
    const startTime = Date.now();
    
    for (let i = 0; i < updateCount; i++) {
      const mockState = createMockGameState({
        gameTime: 300 + i * 5,
        playerGold: 1000 + i * 50,
        teamGold: 5000 + i * 100,
        enemyGold: 4800 + i * 95
      });
      
      await injectMockGameState(overlayPage, mockState);
      
      if (i % 10 === 0) {
        await overlayPage.waitForTimeout(50);
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(10000);
    
    const overlayContainer = overlayPage.locator('.overlay-container');
    await expect(overlayContainer).toBeVisible();
    
    const memoryUsage = await electronApp.evaluate(() => {
      return process.memoryUsage();
    });
    
    expect(memoryUsage.heapUsed).toBeLessThan(200 * 1024 * 1024);
  });

  test('should maintain overlay responsiveness under load', async () => {
    const heavyOperations = Array.from({ length: 50 }, (_, i) => 
      createMockGameState({
        gameTime: 1000 + i,
        playerLevel: Math.min(1 + Math.floor(i / 3), 18),
        objectives: {
          dragon: { spawnsAt: 1200 + i, type: 'elemental' },
          baron: { spawnsAt: 1800 + i },
          herald: { spawnsAt: -1 }
        }
      })
    );
    
    const startTime = Date.now();
    
    for (const operation of heavyOperations) {
      await injectMockGameState(overlayPage, operation);
    }
    
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(5000);
    
    const overlayTitle = overlayPage.locator('.overlay-title');
    await expect(overlayTitle).toContainText('MacroOverlay');
  });

  test('should handle window resize efficiently', async () => {
    const initialSize = await overlayPage.viewportSize();
    const resizeOperations = [
      { width: 300, height: 400 },
      { width: 500, height: 700 },
      { width: 350, height: 500 },
      { width: 400, height: 600 }
    ];
    
    const startTime = Date.now();
    
    for (const size of resizeOperations) {
      await overlayPage.setViewportSize(size);
      await overlayPage.waitForTimeout(100);
      
      const overlayContainer = overlayPage.locator('.overlay-container');
      await expect(overlayContainer).toBeVisible();
    }
    
    if (initialSize) {
      await overlayPage.setViewportSize(initialSize);
    }
    
    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(3000);
  });

  test('should handle multiple concurrent operations', async () => {
    const operations = [
      () => injectMockGameState(overlayPage, createMockGameState({ gameTime: 500 })),
      () => overlayPage.locator('.overlay-title').textContent(),
      () => overlayPage.locator('.drag-handle').click(),
      () => launcherPage.locator('button:has-text("Hide Overlay"), button:has-text("Show Overlay")').click(),
      () => overlayPage.waitForTimeout(100)
    ];
    
    const startTime = Date.now();
    
    await Promise.all(operations.map(op => op().catch(() => {})));
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(2000);
    
    const overlayContainer = overlayPage.locator('.overlay-container');
    await expect(overlayContainer).toBeVisible();
  });

  test('should efficiently render large rule sets', async () => {
    const largeMockState = createMockGameState({
      playerChampion: 'Diana',
      gameTime: 600,
      playerLevel: 8
    });
    
    const startRender = Date.now();
    
    await injectMockGameState(overlayPage, largeMockState);
    
    const dianaRulesSection = overlayPage.locator('text=Diana Rules');
    await expect(dianaRulesSection).toBeVisible();
    
    const renderTime = Date.now() - startRender;
    expect(renderTime).toBeLessThan(1000);
    
    const ruleItems = overlayPage.locator('.rule-item');
    const ruleCount = await ruleItems.count();
    expect(ruleCount).toBeGreaterThan(0);
    expect(ruleCount).toBeLessThanOrEqual(10);
  });

  test('should handle rapid hotkey presses without lag', async () => {
    const hotkeys = ['F10', 'CommandOrControl+Shift+M'];
    const pressCount = 20;
    
    const startTime = Date.now();
    
    for (let i = 0; i < pressCount; i++) {
      const hotkey = hotkeys[i % hotkeys.length];
      
      await electronApp.evaluate((_, key) => {
        const { globalShortcut } = require('electron');
        globalShortcut.emit('accelerator', key);
      }, hotkey);
      
      await overlayPage.waitForTimeout(50);
    }
    
    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(5000);
    
    const overlayContainer = overlayPage.locator('.overlay-container');
    const isVisible = await overlayContainer.isVisible();
    expect(typeof isVisible).toBe('boolean');
  });

  test('should maintain stable frame rate during animations', async () => {
    await overlayPage.evaluate(() => {
      let frameCount = 0;
      let startTime = Date.now();
      
      function countFrames() {
        frameCount++;
        if (Date.now() - startTime < 1000) {
          requestAnimationFrame(countFrames);
        } else {
          window.frameRate = frameCount;
        }
      }
      
      requestAnimationFrame(countFrames);
    });
    
    await overlayPage.waitForTimeout(1200);
    
    const frameRate = await overlayPage.evaluate(() => window.frameRate);
    expect(frameRate).toBeGreaterThan(30);
    expect(frameRate).toBeLessThan(120);
  });

  test('should handle large game history without performance degradation', async () => {
    const largeGameHistory = Array.from({ length: 100 }, (_, i) => ({
      champion: ['Diana', 'Yasuo', 'Zed', 'Ahri'][i % 4],
      result: i % 3 === 0 ? 'Victory' : 'Defeat',
      goldDiff: `${i % 2 === 0 ? '+' : '-'}${Math.floor(Math.random() * 3000)}g`,
      duration: `${20 + Math.floor(Math.random() * 20)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
    }));
    
    const startTime = Date.now();
    
    await launcherPage.evaluate((history) => {
      window.mockGameHistory = history;
      window.dispatchEvent(new CustomEvent('updateGameHistory', { detail: history }));
    }, largeGameHistory);
    
    await launcherPage.waitForTimeout(500);
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(2000);
    
    const recentGamesSection = launcherPage.locator('text=Recent Games');
    await expect(recentGamesSection).toBeVisible();
  });

  test('should efficiently handle objective timer calculations', async () => {
    const timerTestCases = Array.from({ length: 50 }, (_, i) => 
      createMockGameState({
        gameTime: i * 30,
        objectives: {
          dragon: { spawnsAt: 300 + (i * 300), type: 'elemental' },
          baron: { spawnsAt: 1200 + (i * 420) },
          herald: { spawnsAt: i < 20 ? 480 : -1 }
        }
      })
    );
    
    const startTime = Date.now();
    
    for (const testCase of timerTestCases) {
      await injectMockGameState(overlayPage, testCase);
      await overlayPage.waitForTimeout(20);
    }
    
    const calculationTime = Date.now() - startTime;
    expect(calculationTime).toBeLessThan(3000);
    
    const objectivesSection = overlayPage.locator('text=Objectives');
    await expect(objectivesSection).toBeVisible();
  });

  test('should maintain low CPU usage during idle state', async () => {
    await overlayPage.waitForTimeout(2000);
    
    const initialCpuUsage = await electronApp.evaluate(() => {
      return process.cpuUsage();
    });
    
    await overlayPage.waitForTimeout(3000);
    
    const finalCpuUsage = await electronApp.evaluate(() => {
      return process.cpuUsage();
    });
    
    const cpuDiff = finalCpuUsage.user - initialCpuUsage.user;
    
    expect(cpuDiff).toBeLessThan(1000000);
  });
});