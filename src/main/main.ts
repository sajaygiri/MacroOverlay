import { app, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron';
import * as path from 'path';

class MacroOverlayApp {
  private mainWindow: BrowserWindow | null = null;
  private overlayWindow: BrowserWindow | null = null;
  private isOverlayVisible = true;

  constructor() {
    this.init();
  }

  private async init() {
    await app.whenReady();
    this.createMainWindow();
    this.createOverlayWindow();
    this.setupGlobalShortcuts();
    this.setupIpcHandlers();

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
        this.createOverlayWindow();
      }
    });
  }

  private createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      title: 'MacroOverlay - League of Legends Companion',
      show: false,
    });

    this.mainWindow.loadFile(path.join(__dirname, 'index.html'));
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      this.mainWindow?.webContents.openDevTools();
    });
  }

  private createOverlayWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    console.log('Creating overlay window at position:', width - 420, 20);
    
    this.overlayWindow = new BrowserWindow({
      width: 400,
      height: 600,
      x: width - 420,
      y: 20,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true,
      movable: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    this.overlayWindow.setIgnoreMouseEvents(false);
    this.overlayWindow.loadFile(path.join(__dirname, 'index.html'), {
      query: { mode: 'overlay' }
    });

    console.log('Overlay window created, showing:', this.overlayWindow.isVisible());
    console.log('Overlay window always on top:', this.overlayWindow.isAlwaysOnTop());

    this.overlayWindow.webContents.openDevTools();

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
    });
  }

  private setupGlobalShortcuts() {
    globalShortcut.register('F8', () => {
      this.toggleOverlay();
    });

    globalShortcut.register('CommandOrControl+Shift+M', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isVisible()) {
          this.mainWindow.hide();
        } else {
          this.mainWindow.show();
          this.mainWindow.focus();
        }
      }
    });
  }

  private setupIpcHandlers() {
    ipcMain.handle('toggle-overlay', () => {
      this.toggleOverlay();
    });

    ipcMain.handle('get-overlay-visibility', () => {
      return this.isOverlayVisible;
    });

    ipcMain.handle('set-overlay-position', (_, x: number, y: number) => {
      if (this.overlayWindow) {
        this.overlayWindow.setPosition(x, y);
      }
    });

    ipcMain.handle('set-overlay-size', (_, width: number, height: number) => {
      if (this.overlayWindow) {
        this.overlayWindow.setSize(width, height);
      }
    });

    ipcMain.handle('set-click-through', (_, enabled: boolean) => {
      if (this.overlayWindow) {
        this.overlayWindow.setIgnoreMouseEvents(enabled);
      }
    });

    ipcMain.handle('get-overlay-bounds', () => {
      if (this.overlayWindow) {
        return this.overlayWindow.getBounds();
      }
      return null;
    });

    ipcMain.handle('move-overlay-to-game', () => {
      if (this.overlayWindow) {
        this.moveOverlayToGame();
      }
    });
  }

  private moveOverlayToGame() {
    if (!this.overlayWindow) return;

    try {
      const { exec } = require('child_process');
      
      // Find League of Legends window using wmctrl (Linux)
      exec('wmctrl -l | grep -i "league\\|riot"', (error: any, stdout: string) => {
        if (error) {
          console.log('Could not find League window, using default position');
          this.positionOverlayDefault();
          return;
        }

        // Parse window info and get window geometry
        const windowLine = stdout.split('\n')[0];
        if (windowLine) {
          const windowId = windowLine.split(' ')[0];
          
          exec(`xwininfo -id ${windowId}`, (error: any, stdout: string) => {
            if (error) {
              console.log('Could not get window info, using default position');
              this.positionOverlayDefault();
              return;
            }

            // Parse window geometry
            const lines = stdout.split('\n');
            const xLine = lines.find(line => line.includes('Absolute upper-left X:'));
            const yLine = lines.find(line => line.includes('Absolute upper-left Y:'));
            const widthLine = lines.find(line => line.includes('Width:'));
            const heightLine = lines.find(line => line.includes('Height:'));

            if (xLine && yLine && widthLine && heightLine) {
              const gameX = parseInt(xLine.split(':')[1].trim());
              const gameY = parseInt(yLine.split(':')[1].trim());
              const gameWidth = parseInt(widthLine.split(':')[1].trim());
              const gameHeight = parseInt(heightLine.split(':')[1].trim());

              // Position overlay on the right side of the game window
              const overlayX = gameX + gameWidth - 420; // 20px margin from right
              const overlayY = gameY + 50; // 50px from top of game window

              console.log(`Moving overlay to game position: ${overlayX}, ${overlayY}`);
              this.overlayWindow?.setPosition(overlayX, overlayY);
              this.overlayWindow?.show();
              this.overlayWindow?.focus();
            } else {
              this.positionOverlayDefault();
            }
          });
        } else {
          this.positionOverlayDefault();
        }
      });
    } catch (error) {
      console.log('Error finding League window:', error);
      this.positionOverlayDefault();
    }
  }

  private positionOverlayDefault() {
    if (!this.overlayWindow) return;
    
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const overlayX = width - 420;
    const overlayY = 20;
    
    console.log(`Using default overlay position: ${overlayX}, ${overlayY}`);
    this.overlayWindow.setPosition(overlayX, overlayY);
    this.overlayWindow.show();
    this.overlayWindow.focus();
  }

  private toggleOverlay() {
    if (this.overlayWindow) {
      if (this.isOverlayVisible) {
        this.overlayWindow.hide();
        this.isOverlayVisible = false;
      } else {
        this.overlayWindow.show();
        this.isOverlayVisible = true;
      }
    }
  }
}

new MacroOverlayApp();