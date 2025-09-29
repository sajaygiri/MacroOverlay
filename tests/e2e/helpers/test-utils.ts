import { ElectronApplication, Page, _electron as electron } from 'playwright';
import path from 'path';

export interface TestWindows {
  electronApp: ElectronApplication;
  launcherPage: Page;
  overlayPage: Page;
}

export async function launchApp(): Promise<TestWindows> {
  const electronApp = await electron.launch({
    args: [path.join(__dirname, '../../../dist/main.js')],
  });
  
  const windows = await electronApp.windows();
  
  const launcherPage = windows.find(w => 
    w.url().includes('mode=main') || !w.url().includes('mode=')
  ) || windows[0];
  
  const overlayPage = windows.find(w => 
    w.url().includes('mode=overlay')
  ) || windows[1];
  
  await launcherPage.waitForLoadState('domcontentloaded');
  await overlayPage.waitForLoadState('domcontentloaded');
  
  return { electronApp, launcherPage, overlayPage };
}

export async function closeApp(electronApp: ElectronApplication): Promise<void> {
  await electronApp.close();
}

export function createMockGameState(overrides: any = {}) {
  return {
    isInGame: true,
    gameTime: 600,
    playerChampion: 'Diana',
    playerLevel: 8,
    playerGold: 2000,
    objectives: {
      dragon: { spawnsAt: 900, type: 'elemental' },
      baron: { spawnsAt: 1200 },
      herald: { spawnsAt: 480 }
    },
    teamGold: 10000,
    enemyGold: 9500,
    ...overrides
  };
}

export function createMockAdvice(type: 'fight' | 'trade' | 'avoid' = 'trade', overrides: any = {}) {
  const messages = {
    fight: 'Gold advantage - force teamfights',
    trade: 'Look for objective trades',
    avoid: 'Play defensive - farm safely'
  };
  
  return {
    type,
    message: messages[type],
    confidence: 75,
    ...overrides
  };
}

export async function injectMockGameState(page: Page, gameState: any, advice?: any) {
  await page.evaluate(({ gameState, advice }) => {
    window.dispatchEvent(new CustomEvent('gameStateUpdate', { 
      detail: { gameState, advice }
    }));
  }, { gameState, advice });
}

export async function simulateHotkey(electronApp: ElectronApplication, key: string) {
  await electronApp.evaluate((_, hotkey) => {
    const { globalShortcut } = require('electron');
    globalShortcut.emit('accelerator', hotkey);
  }, key);
}

export async function waitForStableState(page: Page, timeout = 1000) {
  await page.waitForTimeout(timeout);
}

export async function expectElementVisible(page: Page, selector: string) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout: 5000 });
  return element;
}

export async function expectElementNotVisible(page: Page, selector: string) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'hidden', timeout: 5000 });
  return element;
}

export class MockLCUService {
  private gameState: any = null;
  private connected = false;
  
  setConnected(connected: boolean) {
    this.connected = connected;
  }
  
  setGameState(gameState: any) {
    this.gameState = gameState;
  }
  
  async getGameState() {
    if (!this.connected) {
      throw new Error('LCU not connected');
    }
    return this.gameState;
  }
}

export const MOCK_CHAMPIONS = {
  Diana: {
    rules: [
      'Play safe until level 6 - Diana is weak pre-6',
      'Level 6 power spike - Look for all-ins with R',
      'Nashor\'s completed - Major power spike for trades'
    ]
  },
  Yasuo: {
    rules: [
      'Farm safely until 2 item power spike',
      'Look for knock-up combos with team',
      'Use Wind Wall defensively'
    ]
  },
  Zed: {
    rules: [
      'Level 6 assassination potential',
      'Roam for picks after level 6',
      'Use shadows for escape routes'
    ]
  }
};

export const MOCK_OBJECTIVE_VALUES = {
  dragon: 450,
  herald: 500,
  baron: 1500,
  tower: 550,
  cannonWave: 150
};

export function formatTime(seconds: number): string {
  if (seconds <= 0) return 'UP';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export async function verifyOverlayProperties(page: Page) {
  const overlayContainer = page.locator('.overlay-container');
  
  const styles = await overlayContainer.evaluate(el => ({
    backgroundColor: window.getComputedStyle(el).backgroundColor,
    borderColor: window.getComputedStyle(el).borderColor,
    borderRadius: window.getComputedStyle(el).borderRadius,
    position: window.getComputedStyle(el).position
  }));
  
  return styles;
}

export async function verifyAdviceBoxStyling(page: Page, expectedType: 'fight' | 'trade' | 'avoid') {
  const adviceBox = page.locator('.advice-box');
  const classList = await adviceBox.evaluate(el => el.className);
  
  const expectedClass = `advice-${expectedType}`;
  return classList.includes(expectedClass);
}