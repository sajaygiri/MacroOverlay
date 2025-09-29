import { OverlayConfiguration } from '../../shared/types';

export class ConfigurationService {
  private static readonly STORAGE_KEY = 'macrooverlay-config';
  private static instance: ConfigurationService;
  private config: OverlayConfiguration;
  private listeners: Array<(config: OverlayConfiguration) => void> = [];

  private constructor() {
    this.config = this.getDefaultConfiguration();
    this.loadConfiguration();
  }

  static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  getDefaultConfiguration(): OverlayConfiguration {
    return {
      sections: {
        championRules: true,
        objectiveTimers: true,
        advicePanel: true,
        goldStatus: true,
        gameTime: true,
        playerStats: false
      },
      championRulesConfig: {
        maxRules: 5,
        showOnlyActivePhase: true,
        priorityFilter: 2
      },
      objectiveConfig: {
        showUpcoming: true,
        showGoldValues: true,
        showTradeAdvice: true,
        warningThreshold: 30
      },
      adviceConfig: {
        showConfidence: true,
        minimumConfidence: 50,
        showIcon: true
      },
      displayConfig: {
        opacity: 0.85,
        fontSize: 'medium',
        compactMode: false,
        position: { x: 100, y: 100 },
        size: { width: 400, height: 600 }
      },
      hotkeys: {
        toggle: 'F10',
        cycleMode: 'F11',
        resetPosition: 'F12'
      }
    };
  }

  getConfiguration(): OverlayConfiguration {
    return { ...this.config };
  }

  updateConfiguration(updates: Partial<OverlayConfiguration>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfiguration();
    this.notifyListeners();
  }

  updateSection(section: keyof OverlayConfiguration['sections'], enabled: boolean): void {
    this.config.sections[section] = enabled;
    this.saveConfiguration();
    this.notifyListeners();
  }

  resetToDefaults(): void {
    this.config = this.getDefaultConfiguration();
    this.saveConfiguration();
    this.notifyListeners();
  }

  subscribe(listener: (config: OverlayConfiguration) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private loadConfiguration(): void {
    try {
      const stored = localStorage.getItem(ConfigurationService.STORAGE_KEY);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        this.config = this.mergeWithDefaults(parsedConfig);
      }
    } catch (error) {
      console.warn('Failed to load configuration, using defaults:', error);
      this.config = this.getDefaultConfiguration();
    }
  }

  private saveConfiguration(): void {
    try {
      localStorage.setItem(ConfigurationService.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  private mergeWithDefaults(stored: any): OverlayConfiguration {
    const defaults = this.getDefaultConfiguration();
    
    return {
      sections: { ...defaults.sections, ...stored.sections },
      championRulesConfig: { ...defaults.championRulesConfig, ...stored.championRulesConfig },
      objectiveConfig: { ...defaults.objectiveConfig, ...stored.objectiveConfig },
      adviceConfig: { ...defaults.adviceConfig, ...stored.adviceConfig },
      displayConfig: { ...defaults.displayConfig, ...stored.displayConfig },
      hotkeys: { ...defaults.hotkeys, ...stored.hotkeys }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config));
  }

  exportConfiguration(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfiguration(configJson: string): boolean {
    try {
      const imported = JSON.parse(configJson);
      const merged = this.mergeWithDefaults(imported);
      this.config = merged;
      this.saveConfiguration();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }

  isEnabled(section: keyof OverlayConfiguration['sections']): boolean {
    return this.config.sections[section];
  }

  getDisplayConfig() {
    return this.config.displayConfig;
  }

  getChampionRulesConfig() {
    return this.config.championRulesConfig;
  }

  getObjectiveConfig() {
    return this.config.objectiveConfig;
  }

  getAdviceConfig() {
    return this.config.adviceConfig;
  }

  getHotkeys() {
    return this.config.hotkeys;
  }
}