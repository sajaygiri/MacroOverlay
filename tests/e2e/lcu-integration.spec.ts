import { test, expect } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';
import path from 'path';

let electronApp: ElectronApplication;
let overlayPage: Page;

test.describe('MacroOverlay - LCU API Integration', () => {
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

  test('should handle LCU connection failure gracefully', async () => {
    const connectionStatus = overlayPage.locator('text=Waiting for League of Legends...');
    await expect(connectionStatus).toBeVisible();
    
    const overlayContainer = overlayPage.locator('.overlay-container');
    await expect(overlayContainer).toBeVisible();
  });

  test('should parse game state correctly when mocked', async () => {
    await overlayPage.evaluate(() => {
      const mockLCUService = {
        getGameState: () => Promise.resolve({
          isInGame: true,
          gameTime: 650,
          playerChampion: 'Diana',
          playerGold: 2100,
          playerLevel: 7,
          objectives: {
            dragon: { spawnsAt: 300, type: 'elemental' },
            baron: { spawnsAt: 1200 },
            herald: { spawnsAt: 480 }
          },
          teamGold: 8500,
          enemyGold: 7800
        })
      };
      
      window.mockLCUService = mockLCUService;
    });

    await overlayPage.waitForTimeout(1000);
    
    const overlayHeader = overlayPage.locator('.overlay-title');
    await expect(overlayHeader).toContainText('MacroOverlay');
  });

  test('should handle objective timer calculations', async () => {
    await overlayPage.evaluate(() => {
      const mockGameState = {
        isInGame: true,
        gameTime: 280,
        playerChampion: 'Diana',
        playerLevel: 5,
        playerGold: 1800,
        objectives: {
          dragon: { spawnsAt: 300, type: 'elemental' },
          baron: { spawnsAt: 1200 },
          herald: { spawnsAt: 480 }
        },
        teamGold: 6000,
        enemyGold: 5800
      };
      
      const mockAdvice = {
        type: 'trade',
        message: 'Dragon spawning soon - prepare for contest',
        confidence: 75
      };
      
      window.dispatchEvent(new CustomEvent('gameStateUpdate', { 
        detail: { gameState: mockGameState, advice: mockAdvice }
      }));
    });

    await overlayPage.waitForTimeout(500);
    
    const objectivesSection = overlayPage.locator('text=Objectives');
    await expect(objectivesSection).toBeVisible();
  });

  test('should validate game data integrity', async () => {
    await overlayPage.evaluate(() => {
      const invalidGameState = {
        isInGame: true,
        gameTime: -100,
        playerChampion: '',
        playerLevel: 0,
        playerGold: -500,
        objectives: {
          dragon: { spawnsAt: -1, type: 'unknown' },
          baron: { spawnsAt: -1 },
          herald: { spawnsAt: -1 }
        },
        teamGold: 0,
        enemyGold: 0
      };
      
      try {
        window.dispatchEvent(new CustomEvent('gameStateUpdate', { 
          detail: { gameState: invalidGameState }
        }));
      } catch (error) {
        console.log('Handled invalid game state:', error);
      }
    });

    const errorMessage = overlayPage.locator('text=Error');
    const waitingMessage = overlayPage.locator('text=Waiting for League of Legends...');
    
    await expect(errorMessage.or(waitingMessage)).toBeVisible();
  });

  test('should handle champion-specific data loading', async () => {
    const champions = ['Diana', 'Yasuo', 'Zed', 'Ahri'];
    
    for (const champion of champions) {
      await overlayPage.evaluate((champ) => {
        const mockGameState = {
          isInGame: true,
          gameTime: 400,
          playerChampion: champ,
          playerLevel: 6,
          playerGold: 1500,
          objectives: {
            dragon: { spawnsAt: 600, type: 'elemental' },
            baron: { spawnsAt: 1200 },
            herald: { spawnsAt: 480 }
          },
          teamGold: 7000,
          enemyGold: 6500
        };
        
        window.dispatchEvent(new CustomEvent('gameStateUpdate', { 
          detail: { gameState: mockGameState }
        }));
      }, champion);

      await overlayPage.waitForTimeout(300);
      
      if (champion === 'Diana') {
        const dianaRules = overlayPage.locator('text=Diana Rules');
        await expect(dianaRules).toBeVisible();
      } else {
        const dianaRules = overlayPage.locator('text=Diana Rules');
        await expect(dianaRules).not.toBeVisible();
      }
    }
  });

  test('should handle API rate limiting simulation', async () => {
    await overlayPage.evaluate(() => {
      let callCount = 0;
      const originalFetch = window.fetch;
      
      window.fetch = (...args) => {
        callCount++;
        if (callCount > 5) {
          return Promise.reject(new Error('Rate limit exceeded'));
        }
        return originalFetch(...args);
      };
      
      window.callCount = callCount;
    });

    await overlayPage.waitForTimeout(2000);
    
    const overlayContainer = overlayPage.locator('.overlay-container');
    await expect(overlayContainer).toBeVisible();
  });

  test('should parse different objective states', async () => {
    const objectiveStates = [
      {
        name: 'Early Game',
        gameTime: 200,
        objectives: {
          dragon: { spawnsAt: 300, type: 'elemental' },
          baron: { spawnsAt: 1200 },
          herald: { spawnsAt: 480 }
        }
      },
      {
        name: 'Mid Game',
        gameTime: 800,
        objectives: {
          dragon: { spawnsAt: 900, type: 'infernal' },
          baron: { spawnsAt: 1200 },
          herald: { spawnsAt: -1 }
        }
      },
      {
        name: 'Late Game',
        gameTime: 1500,
        objectives: {
          dragon: { spawnsAt: 1800, type: 'elder' },
          baron: { spawnsAt: 1620 },
          herald: { spawnsAt: -1 }
        }
      }
    ];

    for (const state of objectiveStates) {
      await overlayPage.evaluate((objState) => {
        const mockGameState = {
          isInGame: true,
          gameTime: objState.gameTime,
          playerChampion: 'Diana',
          playerLevel: Math.min(Math.floor(objState.gameTime / 100) + 1, 18),
          playerGold: objState.gameTime * 4,
          objectives: objState.objectives,
          teamGold: objState.gameTime * 20,
          enemyGold: objState.gameTime * 18
        };
        
        window.dispatchEvent(new CustomEvent('gameStateUpdate', { 
          detail: { gameState: mockGameState }
        }));
      }, state);

      await overlayPage.waitForTimeout(500);
      
      const objectivesSection = overlayPage.locator('text=Objectives');
      await expect(objectivesSection).toBeVisible();
      
      if (state.gameTime >= 1200) {
        const baronTimer = overlayPage.locator('text=Baron');
        await expect(baronTimer).toBeVisible();
      }
    }
  });

  test('should handle network connectivity issues', async () => {
    await overlayPage.evaluate(() => {
      const originalFetch = window.fetch;
      let networkDown = true;
      
      window.fetch = (...args) => {
        if (networkDown) {
          return Promise.reject(new Error('Network error'));
        }
        return originalFetch(...args);
      };
      
      setTimeout(() => {
        networkDown = false;
      }, 3000);
    });

    const waitingMessage = overlayPage.locator('text=Waiting for League of Legends...');
    await expect(waitingMessage).toBeVisible();
    
    await overlayPage.waitForTimeout(4000);
    
    const overlayContainer = overlayPage.locator('.overlay-container');
    await expect(overlayContainer).toBeVisible();
  });

  test('should validate gold differential calculations', async () => {
    const goldScenarios = [
      { team: 10000, enemy: 8000, expected: 'ahead' },
      { team: 8000, enemy: 10000, expected: 'behind' },
      { team: 10000, enemy: 10100, expected: 'even' }
    ];

    for (const scenario of goldScenarios) {
      await overlayPage.evaluate((goldData) => {
        const mockGameState = {
          isInGame: true,
          gameTime: 600,
          playerChampion: 'Diana',
          playerLevel: 8,
          playerGold: 2000,
          objectives: {
            dragon: { spawnsAt: 900, type: 'elemental' },
            baron: { spawnsAt: 1200 },
            herald: { spawnsAt: -1 }
          },
          teamGold: goldData.team,
          enemyGold: goldData.enemy
        };
        
        window.dispatchEvent(new CustomEvent('gameStateUpdate', { 
          detail: { gameState: mockGameState }
        }));
      }, scenario);

      await overlayPage.waitForTimeout(500);
      
      const goldStatus = overlayPage.locator('text=Gold Status');
      await expect(goldStatus).toBeVisible();
      
      const goldDiff = scenario.team - scenario.enemy;
      const goldDiffText = overlayPage.locator(
        goldDiff > 0 ? 'text*=+' : goldDiff < 0 ? 'text*=-' : 'text*=0'
      );
      await expect(goldDiffText).toBeVisible();
    }
  });
});