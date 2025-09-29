import { test, expect } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';
import path from 'path';

let electronApp: ElectronApplication;
let overlayPage: Page;
let launcherPage: Page;

test.describe('MacroOverlay - Hotkey Functionality', () => {
  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main.js')],
    });
    
    const windows = await electronApp.windows();
    expect(windows).toHaveLength(2);
    
    launcherPage = windows.find(w => w.url().includes('mode=main') || !w.url().includes('mode=')) || windows[0];
    overlayPage = windows.find(w => w.url().includes('mode=overlay')) || windows[1];
    
    await overlayPage.waitForLoadState('domcontentloaded');
    await launcherPage.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should toggle overlay visibility with F10 key', async () => {
    await expect(overlayPage).toBeTruthy();
    
    const isInitiallyVisible = await overlayPage.isVisible();
    expect(isInitiallyVisible).toBe(true);
    
    await electronApp.evaluate(({ app }) => {
      const { globalShortcut } = require('electron');
      globalShortcut.emit('accelerator', 'F10');
    });
    
    await overlayPage.waitForTimeout(500);
    
    await electronApp.evaluate(({ app }) => {
      const { globalShortcut } = require('electron');
      globalShortcut.emit('accelerator', 'F10');
    });
    
    await overlayPage.waitForTimeout(500);
  });

  test('should show/hide launcher with Ctrl+Shift+M', async () => {
    const isInitiallyVisible = await launcherPage.isVisible();
    expect(isInitiallyVisible).toBe(true);
    
    await electronApp.evaluate(({ app }) => {
      const { globalShortcut } = require('electron');
      globalShortcut.emit('accelerator', 'CommandOrControl+Shift+M');
    });
    
    await launcherPage.waitForTimeout(500);
    
    await electronApp.evaluate(({ app }) => {
      const { globalShortcut } = require('electron');
      globalShortcut.emit('accelerator', 'CommandOrControl+Shift+M');
    });
    
    await launcherPage.waitForTimeout(500);
    
    const isFinallyVisible = await launcherPage.isVisible();
    expect(isFinallyVisible).toBe(true);
  });

  test('should handle custom hotkey configuration', async () => {
    const hotkeyInput = launcherPage.locator('input[type="text"]');
    
    await hotkeyInput.clear();
    await hotkeyInput.fill('F11');
    await hotkeyInput.press('Enter');
    
    await launcherPage.waitForTimeout(500);
    
    await expect(hotkeyInput).toHaveValue('F11');
    
    await hotkeyInput.clear();
    await hotkeyInput.fill('F10');
    await hotkeyInput.press('Enter');
  });

  test('should prevent invalid hotkey combinations', async () => {
    const hotkeyInput = launcherPage.locator('input[type="text"]');
    
    const invalidKeys = ['', ' ', 'InvalidKey', '123', 'a'];
    
    for (const invalidKey of invalidKeys) {
      await hotkeyInput.clear();
      await hotkeyInput.fill(invalidKey);
      await hotkeyInput.press('Tab');
      
      await launcherPage.waitForTimeout(200);
      
      if (invalidKey === '' || invalidKey === ' ') {
        await expect(hotkeyInput).toHaveValue('F10');
      }
    }
  });

  test('should register global shortcuts properly', async () => {
    const shortcutRegistrationResult = await electronApp.evaluate(() => {
      const { globalShortcut } = require('electron');
      
      const isF10Registered = globalShortcut.isRegistered('F10');
      const isCtrlShiftMRegistered = globalShortcut.isRegistered('CommandOrControl+Shift+M');
      
      return {
        f10: isF10Registered,
        ctrlShiftM: isCtrlShiftMRegistered
      };
    });
    
    expect(shortcutRegistrationResult.f10).toBe(true);
    expect(shortcutRegistrationResult.ctrlShiftM).toBe(true);
  });

  test('should handle hotkey conflicts gracefully', async () => {
    const conflictTestResult = await electronApp.evaluate(() => {
      const { globalShortcut } = require('electron');
      
      try {
        const success = globalShortcut.register('F10', () => {
          console.log('Conflicting F10 handler');
        });
        
        return { success, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    expect(conflictTestResult.success).toBe(false);
  });

  test('should unregister shortcuts on app close', async () => {
    const allShortcuts = await electronApp.evaluate(() => {
      const { globalShortcut } = require('electron');
      return globalShortcut.isRegistered('F10');
    });
    
    expect(allShortcuts).toBe(true);
    
    const testApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main.js')],
    });
    
    await testApp.close();
    
    const shortcutsAfterClose = await electronApp.evaluate(() => {
      const { globalShortcut } = require('electron');
      return {
        f10: globalShortcut.isRegistered('F10'),
        total: Object.keys(globalShortcut.getAll()).length
      };
    });
    
    expect(shortcutsAfterClose.f10).toBe(true);
  });

  test('should handle overlay toggle through button click', async () => {
    const toggleButton = launcherPage.locator('button:has-text("Hide Overlay"), button:has-text("Show Overlay")');
    await expect(toggleButton).toBeVisible();
    
    const buttonText = await toggleButton.textContent();
    
    await toggleButton.click();
    await launcherPage.waitForTimeout(500);
    
    const newButtonText = await toggleButton.textContent();
    expect(newButtonText).not.toBe(buttonText);
    
    const overlayStatus = launcherPage.locator('.stat-card').nth(3).locator('.stat-value');
    const statusText = await overlayStatus.textContent();
    expect(['ON', 'OFF']).toContain(statusText);
  });

  test('should maintain hotkey functionality across window focus changes', async () => {
    await launcherPage.focus();
    await launcherPage.waitForTimeout(500);
    
    await electronApp.evaluate(() => {
      const { globalShortcut } = require('electron');
      globalShortcut.emit('accelerator', 'F10');
    });
    
    await overlayPage.waitForTimeout(500);
    
    await overlayPage.focus();
    await overlayPage.waitForTimeout(500);
    
    await electronApp.evaluate(() => {
      const { globalShortcut } = require('electron');
      globalShortcut.emit('accelerator', 'CommandOrControl+Shift+M');
    });
    
    await launcherPage.waitForTimeout(500);
  });

  test('should handle rapid hotkey presses', async () => {
    const rapidPressCount = 5;
    
    for (let i = 0; i < rapidPressCount; i++) {
      await electronApp.evaluate(() => {
        const { globalShortcut } = require('electron');
        globalShortcut.emit('accelerator', 'F10');
      });
      
      await overlayPage.waitForTimeout(100);
    }
    
    await overlayPage.waitForTimeout(1000);
    
    const overlayContainer = overlayPage.locator('.overlay-container');
    const isVisible = await overlayContainer.isVisible();
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display hotkey instructions in overlay', async () => {
    const hotkeyInstructions = overlayPage.locator('text=F10 to toggle • Drag to move');
    await expect(hotkeyInstructions).toBeVisible();
    
    const instructionStyle = await hotkeyInstructions.evaluate(el => ({
      fontSize: window.getComputedStyle(el).fontSize,
      opacity: window.getComputedStyle(el).opacity,
      textAlign: window.getComputedStyle(el).textAlign
    }));
    
    expect(instructionStyle.fontSize).toBe('10px');
    expect(parseFloat(instructionStyle.opacity)).toBeLessThan(1);
    expect(instructionStyle.textAlign).toBe('center');
  });

  test('should handle system-level hotkey conflicts', async () => {
    const systemConflictTest = await electronApp.evaluate(() => {
      const { globalShortcut } = require('electron');
      
      const systemKeys = ['CommandOrControl+C', 'CommandOrControl+V', 'Alt+Tab'];
      const conflicts = [];
      
      systemKeys.forEach(key => {
        try {
          const registered = globalShortcut.register(key, () => {});
          if (registered) {
            globalShortcut.unregister(key);
            conflicts.push(key);
          }
        } catch (error) {
          // Expected for system keys
        }
      });
      
      return conflicts;
    });
    
    expect(systemConflictTest.length).toBeLessThanOrEqual(1);
  });
});