import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  toggleOverlay: () => ipcRenderer.invoke('toggle-overlay'),
  getOverlayVisibility: () => ipcRenderer.invoke('get-overlay-visibility'),
  setOverlayPosition: (x: number, y: number) => ipcRenderer.invoke('set-overlay-position', x, y),
  setOverlaySize: (width: number, height: number) => ipcRenderer.invoke('set-overlay-size', width, height),
  setClickThrough: (enabled: boolean) => ipcRenderer.invoke('set-click-through', enabled),
  getOverlayBounds: () => ipcRenderer.invoke('get-overlay-bounds'),
  moveOverlayToGame: () => ipcRenderer.invoke('move-overlay-to-game'),
});

declare global {
  interface Window {
    electronAPI: {
      toggleOverlay: () => Promise<void>;
      getOverlayVisibility: () => Promise<boolean>;
      setOverlayPosition: (x: number, y: number) => Promise<void>;
      setOverlaySize: (width: number, height: number) => Promise<void>;
      setClickThrough: (enabled: boolean) => Promise<void>;
      getOverlayBounds: () => Promise<{x: number, y: number, width: number, height: number} | null>;
      moveOverlayToGame: () => Promise<void>;
    };
  }
}