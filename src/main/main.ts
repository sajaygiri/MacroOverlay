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
    });
  }

  private createOverlayWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
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

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
    });
  }

  private setupGlobalShortcuts() {
    globalShortcut.register('F10', () => {
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