import { test, expect } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';
import path from 'path';

let electronApp: ElectronApplication;
let overlayPage: Page;
let mainPage: Page;

test.describe('MacroOverlay - Overlay Window', () => {
  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main.js')],
    });
    
    const windows = await electronApp.windows();
    expect(windows).toHaveLength(2);
    
    mainPage = windows.find(w => w.url().includes('mode=main') || !w.url().includes('mode=')) || windows[0];
    overlayPage = windows.find(w => w.url().includes('mode=overlay')) || windows[1];
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should display overlay window with correct properties', async () => {
    await expect(overlayPage).toBeTruthy();
    
    const title = await overlayPage.locator('.overlay-title').textContent();
    expect(title).toBe('MacroOverlay');
    
    const overlayContainer = overlayPage.locator('.overlay-container');
    await expect(overlayContainer).toBeVisible();
  });

  test('should show waiting message when League is not running', async () => {
    const waitingMessage = overlayPage.locator('text=Waiting for League of Legends...');
    await expect(waitingMessage).toBeVisible();
  });

  test('should display drag handle for moving overlay', async () => {
    const dragHandle = overlayPage.locator('.drag-handle');
    await expect(dragHandle).toBeVisible();
    await expect(dragHandle).toContainText('≡');
  });

  test('should show hotkey instructions', async () => {
    const instructions = overlayPage.locator('text=F10 to toggle • Drag to move');
    await expect(instructions).toBeVisible();
  });

  test('should have proper overlay styling', async () => {
    const overlayContainer = overlayPage.locator('.overlay-container');
    
    const backgroundColor = await overlayContainer.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toContain('rgba(0, 0, 0, 0.85)');
    
    const borderColor = await overlayContainer.evaluate(el => 
      window.getComputedStyle(el).borderColor
    );
    expect(borderColor).toContain('255, 215, 0'); // Gold color
  });

  test('should be responsive to window resize', async () => {
    const initialSize = await overlayPage.viewportSize();
    
    await overlayPage.setViewportSize({ width: 300, height: 400 });
    
    const overlayContainer = overlayPage.locator('.overlay-container');
    await expect(overlayContainer).toBeVisible();
    
    if (initialSize) {
      await overlayPage.setViewportSize(initialSize);
    }
  });
});

test.describe('MacroOverlay - Game State Simulation', () => {
  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main.js')],
    });
    
    const windows = await electronApp.windows();
    overlayPage = windows.find(w => w.url().includes('mode=overlay')) || windows[1];
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should show Diana rules when playing Diana', async () => {
    await overlayPage.evaluate(() => {
      const mockGameState = {
        isInGame: true,
        gameTime: 300,
        playerChampion: 'Diana',
        playerLevel: 4,
        playerGold: 1200,
        objectives: {
          dragon: { spawnsAt: 300, type: 'elemental' },
          baron: { spawnsAt: 1200 },
          herald: { spawnsAt: 480 }
        },
        teamGold: 5000,
        enemyGold: 4800
      };
      
      window.dispatchEvent(new CustomEvent('mockGameState', { detail: mockGameState }));
    });

    await overlayPage.waitForTimeout(1000);
    
    const dianaRulesSection = overlayPage.locator('text=Diana Rules');
    await expect(dianaRulesSection).toBeVisible();
    
    const earlyGameRule = overlayPage.locator('text=Play safe until level 6');
    await expect(earlyGameRule).toBeVisible();
  });

  test('should display objective timers correctly', async () => {
    await overlayPage.evaluate(() => {
      const mockGameState = {
        isInGame: true,
        gameTime: 250,
        playerChampion: 'Diana',
        playerLevel: 5,
        playerGold: 1000,
        objectives: {
          dragon: { spawnsAt: 300, type: 'elemental' },
          baron: { spawnsAt: 1200 },
          herald: { spawnsAt: 480 }
        },
        teamGold: 4500,
        enemyGold: 4200
      };
      
      window.dispatchEvent(new CustomEvent('mockGameState', { detail: mockGameState }));
    });

    await overlayPage.waitForTimeout(1000);
    
    const objectivesSection = overlayPage.locator('text=Objectives');
    await expect(objectivesSection).toBeVisible();
    
    const dragonTimer = overlayPage.locator('.objective-timer').first();
    await expect(dragonTimer).toContainText('Dragon');
    await expect(dragonTimer).toContainText('450g');
  });

  test('should show advice based on gold differential', async () => {
    await overlayPage.evaluate(() => {
      const mockGameState = {
        isInGame: true,
        gameTime: 600,
        playerChampion: 'Diana',
        playerLevel: 8,
        playerGold: 2500,
        objectives: {
          dragon: { spawnsAt: 600, type: 'elemental' },
          baron: { spawnsAt: 1200 },
          herald: { spawnsAt: 480 }
        },
        teamGold: 12000,
        enemyGold: 10000
      };
      
      window.dispatchEvent(new CustomEvent('mockGameState', { detail: mockGameState }));
    });

    await overlayPage.waitForTimeout(1000);
    
    const adviceSection = overlayPage.locator('text=Advice');
    await expect(adviceSection).toBeVisible();
    
    const adviceBox = overlayPage.locator('.advice-box');
    await expect(adviceBox).toBeVisible();
    
    const goldStatus = overlayPage.locator('text=Gold Status');
    await expect(goldStatus).toBeVisible();
  });

  test('should display correct advice types with proper styling', async () => {
    const testCases = [
      {
        scenario: 'ahead',
        teamGold: 15000,
        enemyGold: 12000,
        expectedClass: 'advice-fight',
        expectedIcon: '⚔️'
      },
      {
        scenario: 'behind',
        teamGold: 8000,
        enemyGold: 12000,
        expectedClass: 'advice-avoid',
        expectedIcon: '🛡️'
      },
      {
        scenario: 'even',
        teamGold: 10000,
        enemyGold: 10200,
        expectedClass: 'advice-trade',
        expectedIcon: '🔄'
      }
    ];

    for (const testCase of testCases) {
      await overlayPage.evaluate((tc) => {
        const mockGameState = {
          isInGame: true,
          gameTime: 800,
          playerChampion: 'Diana',
          playerLevel: 10,
          playerGold: 3000,
          objectives: {
            dragon: { spawnsAt: 900, type: 'elemental' },
            baron: { spawnsAt: 1200 },
            herald: { spawnsAt: -1 }
          },
          teamGold: tc.teamGold,
          enemyGold: tc.enemyGold
        };
        
        window.dispatchEvent(new CustomEvent('mockGameState', { detail: mockGameState }));
      }, testCase);

      await overlayPage.waitForTimeout(500);
      
      const adviceBox = overlayPage.locator('.advice-box');
      await expect(adviceBox).toHaveClass(new RegExp(testCase.expectedClass));
      await expect(adviceBox).toContainText(testCase.expectedIcon);
    }
  });
});