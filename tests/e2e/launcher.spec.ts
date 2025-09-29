import { test, expect } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';
import path from 'path';

let electronApp: ElectronApplication;
let launcherPage: Page;
let overlayPage: Page;

test.describe('MacroOverlay - Launcher Window', () => {
  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main.js')],
    });
    
    const windows = await electronApp.windows();
    expect(windows).toHaveLength(2);
    
    launcherPage = windows.find(w => w.url().includes('mode=main') || !w.url().includes('mode=')) || windows[0];
    overlayPage = windows.find(w => w.url().includes('mode=overlay')) || windows[1];
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should display launcher with proper header', async () => {
    await expect(launcherPage).toBeTruthy();
    
    const header = launcherPage.locator('.launcher-header');
    await expect(header).toBeVisible();
    
    const title = launcherPage.locator('h1');
    await expect(title).toContainText('MacroOverlay');
    
    const subtitle = launcherPage.locator('p');
    await expect(subtitle).toContainText('League of Legends Macro Companion');
  });

  test('should show stats grid with game data', async () => {
    const statsGrid = launcherPage.locator('.stats-grid');
    await expect(statsGrid).toBeVisible();
    
    const statCards = launcherPage.locator('.stat-card');
    await expect(statCards).toHaveCount(4);
    
    const gamesTracked = statCards.nth(0);
    await expect(gamesTracked).toContainText('Games Tracked');
    await expect(gamesTracked.locator('.stat-value')).toContainText('127');
    
    const winRate = statCards.nth(1);
    await expect(winRate).toContainText('Win Rate');
    await expect(winRate.locator('.stat-value')).toContainText('68.5%');
    
    const avgGoldLead = statCards.nth(2);
    await expect(avgGoldLead).toContainText('Avg Gold Lead');
    await expect(avgGoldLead.locator('.stat-value')).toContainText('+342g');
    
    const overlayStatus = statCards.nth(3);
    await expect(overlayStatus).toContainText('Overlay Status');
    await expect(overlayStatus.locator('.stat-value')).toContainText('ON');
  });

  test('should have quick action buttons', async () => {
    const quickActionsSection = launcherPage.locator('text=Quick Actions');
    await expect(quickActionsSection).toBeVisible();
    
    const toggleButton = launcherPage.locator('button:has-text("Hide Overlay")');
    await expect(toggleButton).toBeVisible();
    
    const historyButton = launcherPage.locator('button:has-text("View Match History")');
    await expect(historyButton).toBeVisible();
    
    const guideButton = launcherPage.locator('button:has-text("Champion Guide")');
    await expect(guideButton).toBeVisible();
  });

  test('should display recent games table', async () => {
    const recentGamesSection = launcherPage.locator('text=Recent Games');
    await expect(recentGamesSection).toBeVisible();
    
    const tableHeaders = launcherPage.locator('div:has-text("Champion") >> nth=0');
    await expect(tableHeaders).toBeVisible();
    
    const dianaGame = launcherPage.locator('text=Diana').first();
    await expect(dianaGame).toBeVisible();
    
    const victoryResult = launcherPage.locator('text=Victory').first();
    await expect(victoryResult).toBeVisible();
  });

  test('should show ad spaces in sidebar', async () => {
    const sidebar = launcherPage.locator('.sidebar');
    await expect(sidebar).toBeVisible();
    
    const adSpaces = launcherPage.locator('.ad-space');
    await expect(adSpaces).toHaveCount(2);
    
    const gamingGearAd = adSpaces.nth(0);
    await expect(gamingGearAd).toContainText('Gaming Gear');
    await expect(gamingGearAd).toContainText('Pro Gaming Mice');
    await expect(gamingGearAd).toContainText('Sponsored Content');
    
    const upgradeAd = adSpaces.nth(1);
    await expect(upgradeAd).toContainText('Upgrade to Pro');
    await expect(upgradeAd).toContainText('Remove ads');
    await expect(upgradeAd).toContainText('All champions');
    
    const upgradeButton = upgradeAd.locator('button:has-text("Upgrade Now")');
    await expect(upgradeButton).toBeVisible();
  });

  test('should have settings panel', async () => {
    const settingsSection = launcherPage.locator('text=Settings');
    await expect(settingsSection).toBeVisible();
    
    const hotkeyInput = launcherPage.locator('input[type="text"]');
    await expect(hotkeyInput).toBeVisible();
    await expect(hotkeyInput).toHaveValue('F10');
    
    const autoStartCheckbox = launcherPage.locator('input[type="checkbox"]');
    await expect(autoStartCheckbox).toBeVisible();
    await expect(autoStartCheckbox).toBeChecked();
  });

  test('should allow settings modification', async () => {
    const hotkeyInput = launcherPage.locator('input[type="text"]');
    
    await hotkeyInput.clear();
    await hotkeyInput.fill('F11');
    await expect(hotkeyInput).toHaveValue('F11');
    
    const autoStartCheckbox = launcherPage.locator('input[type="checkbox"]');
    await autoStartCheckbox.uncheck();
    await expect(autoStartCheckbox).not.toBeChecked();
    
    await autoStartCheckbox.check();
    await expect(autoStartCheckbox).toBeChecked();
    
    await hotkeyInput.clear();
    await hotkeyInput.fill('F10');
  });

  test('should have proper responsive layout', async () => {
    const launcherContent = launcherPage.locator('.launcher-content');
    await expect(launcherContent).toBeVisible();
    
    const mainContent = launcherPage.locator('.main-content');
    await expect(mainContent).toBeVisible();
    
    const sidebar = launcherPage.locator('.sidebar');
    await expect(sidebar).toBeVisible();
    
    const gridStyle = await launcherContent.evaluate(el => 
      window.getComputedStyle(el).display
    );
    expect(gridStyle).toBe('grid');
  });

  test('should handle button interactions', async () => {
    const toggleButton = launcherPage.locator('button:has-text("Hide Overlay")');
    
    await toggleButton.click();
    
    await launcherPage.waitForTimeout(500);
    
    const overlayStatus = launcherPage.locator('.stat-card').nth(3).locator('.stat-value');
    await expect(overlayStatus).toContainText('OFF');
    
    const showButton = launcherPage.locator('button:has-text("Show Overlay")');
    await expect(showButton).toBeVisible();
    
    await showButton.click();
    
    await launcherPage.waitForTimeout(500);
    
    await expect(overlayStatus).toContainText('ON');
  });

  test('should display proper styling and themes', async () => {
    const launcherContainer = launcherPage.locator('.launcher-container');
    
    const background = await launcherContainer.evaluate(el => 
      window.getComputedStyle(el).background
    );
    expect(background).toContain('linear-gradient');
    
    const buttons = launcherPage.locator('.btn');
    const firstButton = buttons.first();
    
    const buttonColor = await firstButton.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(buttonColor).toContain('255, 215, 0'); // Gold color
  });

  test('should show game data with proper formatting', async () => {
    const gameRows = launcherPage.locator('[style*="grid-template-columns: auto 1fr auto auto"]').nth(1);
    await expect(gameRows).toBeVisible();
    
    const victoryText = launcherPage.locator('text=Victory').first();
    const victoryColor = await victoryText.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(victoryColor).toContain('144, 238, 144'); // Light green
    
    const defeatText = launcherPage.locator('text=Defeat').first();
    const defeatColor = await defeatText.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(defeatColor).toContain('255, 136, 136'); // Light red
  });
});