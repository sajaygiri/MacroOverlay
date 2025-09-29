import { test, expect } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';
import path from 'path';
import { launchApp, closeApp, createMockGameState, injectMockGameState, simulateHotkey } from './helpers/test-utils';

let electronApp: ElectronApplication;
let overlayPage: Page;
let launcherPage: Page;

test.describe('MacroOverlay - Integration Tests', () => {
  test.beforeAll(async () => {
    const testWindows = await launchApp();
    electronApp = testWindows.electronApp;
    launcherPage = testWindows.launcherPage;
    overlayPage = testWindows.overlayPage;
  });

  test.afterAll(async () => {
    await closeApp(electronApp);
  });

  test('should synchronize state between launcher and overlay', async () => {
    const toggleButton = launcherPage.locator('button:has-text("Hide Overlay"), button:has-text("Show Overlay")');
    
    const initialButtonText = await toggleButton.textContent();
    const initialOverlayVisible = await overlayPage.isVisible();
    
    await toggleButton.click();
    await launcherPage.waitForTimeout(500);
    
    const newButtonText = await toggleButton.textContent();
    const newOverlayVisible = await overlayPage.isVisible();
    
    expect(newButtonText).not.toBe(initialButtonText);
    expect(newOverlayVisible).not.toBe(initialOverlayVisible);
    
    const overlayStatus = launcherPage.locator('.stat-card').nth(3).locator('.stat-value');
    const statusText = await overlayStatus.textContent();
    expect(['ON', 'OFF']).toContain(statusText);
  });

  test('should handle full game session workflow', async () => {
    const gameStates = [
      createMockGameState({ gameTime: 0, playerLevel: 1, playerChampion: 'Diana' }),
      createMockGameState({ gameTime: 300, playerLevel: 5, playerChampion: 'Diana' }),
      createMockGameState({ gameTime: 360, playerLevel: 6, playerChampion: 'Diana' }),
      createMockGameState({ gameTime: 900, playerLevel: 11, playerChampion: 'Diana' }),
      createMockGameState({ gameTime: 1800, playerLevel: 18, playerChampion: 'Diana' })
    ];
    
    for (let i = 0; i < gameStates.length; i++) {
      const state = gameStates[i];
      await injectMockGameState(overlayPage, state);
      await overlayPage.waitForTimeout(500);
      
      if (state.playerChampion === 'Diana') {
        const dianaRules = overlayPage.locator('text=Diana Rules');
        await expect(dianaRules).toBeVisible();
        
        if (state.playerLevel < 6) {
          const earlyGameRule = overlayPage.locator('text=Play safe until level 6');
          await expect(earlyGameRule).toBeVisible();
        } else {
          const powerSpikeRule = overlayPage.locator('text=Level 6 power spike');
          await expect(powerSpikeRule).toBeVisible();
        }
      }
      
      const objectivesSection = overlayPage.locator('text=Objectives');
      await expect(objectivesSection).toBeVisible();
      
      if (state.gameTime >= 1200) {
        const baronTimer = overlayPage.locator('text=Baron');
        await expect(baronTimer).toBeVisible();
      }
    }
  });

  test('should handle champion switching during game', async () => {
    const champions = ['Diana', 'Yasuo', 'Zed'];
    
    for (const champion of champions) {
      const state = createMockGameState({
        playerChampion: champion,
        gameTime: 400,
        playerLevel: 7
      });
      
      await injectMockGameState(overlayPage, state);
      await overlayPage.waitForTimeout(300);
      
      if (champion === 'Diana') {
        const dianaRules = overlayPage.locator('text=Diana Rules');
        await expect(dianaRules).toBeVisible();
      } else {
        const championRules = overlayPage.locator(`text=${champion} Rules`);
        await expect(championRules).not.toBeVisible();
      }
      
      const objectivesSection = overlayPage.locator('text=Objectives');
      await expect(objectivesSection).toBeVisible();
    }
  });

  test('should maintain settings persistence across sessions', async () => {
    const hotkeyInput = launcherPage.locator('input[type="text"]');
    const autoStartCheckbox = launcherPage.locator('input[type="checkbox"]');
    
    await hotkeyInput.clear();
    await hotkeyInput.fill('F11');
    await autoStartCheckbox.uncheck();
    
    await launcherPage.waitForTimeout(500);
    
    const tempApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main.js')],
    });
    
    const tempWindows = await tempApp.windows();
    const tempLauncher = tempWindows.find(w => 
      w.url().includes('mode=main') || !w.url().includes('mode=')
    ) || tempWindows[0];
    
    await tempLauncher.waitForLoadState('domcontentloaded');
    
    const tempHotkeyInput = tempLauncher.locator('input[type="text"]');
    const tempAutoStartCheckbox = tempLauncher.locator('input[type="checkbox"]');
    
    await expect(tempHotkeyInput).toHaveValue('F11');
    await expect(tempAutoStartCheckbox).not.toBeChecked();
    
    await tempApp.close();
    
    await hotkeyInput.clear();
    await hotkeyInput.fill('F10');
    await autoStartCheckbox.check();
  });

  test('should handle multiple objective scenarios', async () => {
    const scenarios = [
      {
        name: 'Dragon Contest',
        state: createMockGameState({
          gameTime: 290,
          objectives: {
            dragon: { spawnsAt: 300, type: 'elemental' },
            baron: { spawnsAt: 1200 },
            herald: { spawnsAt: 480 }
          }
        })
      },
      {
        name: 'Baron Contest',
        state: createMockGameState({
          gameTime: 1190,
          objectives: {
            dragon: { spawnsAt: 1500, type: 'elder' },
            baron: { spawnsAt: 1200 },
            herald: { spawnsAt: -1 }
          }
        })
      },
      {
        name: 'Herald Contest',
        state: createMockGameState({
          gameTime: 470,
          objectives: {
            dragon: { spawnsAt: 600, type: 'elemental' },
            baron: { spawnsAt: 1200 },
            herald: { spawnsAt: 480 }
          }
        })
      }
    ];
    
    for (const scenario of scenarios) {
      await injectMockGameState(overlayPage, scenario.state);
      await overlayPage.waitForTimeout(500);
      
      const objectivesSection = overlayPage.locator('text=Objectives');
      await expect(objectivesSection).toBeVisible();
      
      const nextBestTrade = overlayPage.locator('text=Next Best:');
      await expect(nextBestTrade).toBeVisible();
    }
  });

  test('should handle gold differential advice correctly', async () => {
    const goldScenarios = [
      {
        name: 'Ahead - Fight',
        teamGold: 15000,
        enemyGold: 12000,
        expectedAdvice: 'fight'
      },
      {
        name: 'Behind - Avoid',
        teamGold: 8000,
        enemyGold: 12000,
        expectedAdvice: 'avoid'
      },
      {
        name: 'Even - Trade',
        teamGold: 10000,
        enemyGold: 10200,
        expectedAdvice: 'trade'
      }
    ];
    
    for (const scenario of goldScenarios) {
      const state = createMockGameState({
        teamGold: scenario.teamGold,
        enemyGold: scenario.enemyGold,
        gameTime: 800
      });
      
      await injectMockGameState(overlayPage, state);
      await overlayPage.waitForTimeout(500);
      
      const adviceBox = overlayPage.locator('.advice-box');
      await expect(adviceBox).toBeVisible();
      
      const expectedClass = `advice-${scenario.expectedAdvice}`;
      await expect(adviceBox).toHaveClass(new RegExp(expectedClass));
      
      const goldStatus = overlayPage.locator('text=Gold Status');
      await expect(goldStatus).toBeVisible();
      
      const goldDiff = scenario.teamGold - scenario.enemyGold;
      const expectedPrefix = goldDiff > 0 ? '+' : goldDiff < 0 ? '' : '';
      const goldDiffText = overlayPage.locator(`text=${expectedPrefix}${goldDiff}g`);
      await expect(goldDiffText).toBeVisible();
    }
  });

  test('should integrate hotkeys with UI state changes', async () => {
    const initialOverlayVisibility = await overlayPage.isVisible();
    
    await simulateHotkey(electronApp, 'F10');
    await overlayPage.waitForTimeout(500);
    
    const afterHotkeyVisibility = await overlayPage.isVisible();
    expect(afterHotkeyVisibility).not.toBe(initialOverlayVisibility);
    
    const overlayStatus = launcherPage.locator('.stat-card').nth(3).locator('.stat-value');
    const statusText = await overlayStatus.textContent();
    
    if (afterHotkeyVisibility) {
      expect(statusText).toBe('ON');
    } else {
      expect(statusText).toBe('OFF');
    }
    
    await simulateHotkey(electronApp, 'F10');
    await overlayPage.waitForTimeout(500);
    
    const finalVisibility = await overlayPage.isVisible();
    expect(finalVisibility).toBe(initialOverlayVisibility);
  });

  test('should handle window positioning and resizing integration', async () => {
    const initialPosition = await overlayPage.evaluate(() => ({
      x: window.screenX,
      y: window.screenY
    }));
    
    await electronApp.evaluate(() => {
      const { BrowserWindow } = require('electron');
      const overlayWindow = BrowserWindow.getAllWindows().find(w => 
        w.webContents.getURL().includes('mode=overlay')
      );
      
      if (overlayWindow) {
        overlayWindow.setPosition(200, 200);
        overlayWindow.setSize(350, 500);
      }
    });
    
    await overlayPage.waitForTimeout(500);
    
    const newPosition = await overlayPage.evaluate(() => ({
      x: window.screenX,
      y: window.screenY,
      width: window.innerWidth,
      height: window.innerHeight
    }));
    
    expect(newPosition.x).not.toBe(initialPosition.x);
    expect(newPosition.y).not.toBe(initialPosition.y);
    
    const overlayContainer = overlayPage.locator('.overlay-container');
    await expect(overlayContainer).toBeVisible();
  });

  test('should handle error recovery gracefully', async () => {
    await overlayPage.evaluate(() => {
      const invalidState = {
        isInGame: true,
        gameTime: 'invalid',
        playerChampion: null,
        playerLevel: -1,
        objectives: null
      };
      
      try {
        window.dispatchEvent(new CustomEvent('gameStateUpdate', { 
          detail: { gameState: invalidState }
        }));
      } catch (error) {
        console.log('Error handled:', error);
      }
    });
    
    await overlayPage.waitForTimeout(500);
    
    const overlayContainer = overlayPage.locator('.overlay-container');
    await expect(overlayContainer).toBeVisible();
    
    const waitingMessage = overlayPage.locator('text=Waiting for League of Legends...');
    await expect(waitingMessage).toBeVisible();
    
    const validState = createMockGameState();
    await injectMockGameState(overlayPage, validState);
    await overlayPage.waitForTimeout(500);
    
    const objectivesSection = overlayPage.locator('text=Objectives');
    await expect(objectivesSection).toBeVisible();
  });

  test('should maintain data consistency across rapid updates', async () => {
    const updates = Array.from({ length: 20 }, (_, i) => 
      createMockGameState({
        gameTime: 600 + i * 10,
        playerGold: 2000 + i * 100,
        teamGold: 10000 + i * 200,
        enemyGold: 9800 + i * 180
      })
    );
    
    for (const update of updates) {
      await injectMockGameState(overlayPage, update);
      await overlayPage.waitForTimeout(50);
    }
    
    await overlayPage.waitForTimeout(500);
    
    const finalUpdate = updates[updates.length - 1];
    const goldStatus = overlayPage.locator('text=Gold Status');
    await expect(goldStatus).toBeVisible();
    
    const expectedDiff = finalUpdate.teamGold - finalUpdate.enemyGold;
    const goldDiffText = overlayPage.locator(`text=${expectedDiff > 0 ? '+' : ''}${expectedDiff}g`);
    await expect(goldDiffText).toBeVisible();
  });
});