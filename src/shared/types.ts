export interface GameState {
  isInGame: boolean;
  gameTime: number;
  playerChampion: string;
  playerGold: number;
  playerLevel: number;
  objectives: {
    dragon: { spawnsAt: number; type: string };
    baron: { spawnsAt: number };
    herald: { spawnsAt: number };
  };
  teamGold: number;
  enemyGold: number;
}

export interface ChampionRule {
  id: string;
  phase: 'early' | 'mid' | 'late';
  condition: string;
  text: string;
  priority: number;
}

export interface AdviceState {
  type: 'fight' | 'trade' | 'avoid';
  message: string;
  confidence: number;
}

export interface GoldEquivalence {
  dragon: number;
  herald: number;
  baron: number;
  tower: number;
  cannonWave: number;
}

export interface OverlayConfiguration {
  sections: {
    championRules: boolean;
    objectiveTimers: boolean;
    advicePanel: boolean;
    goldStatus: boolean;
    gameTime: boolean;
    playerStats: boolean;
  };
  championRulesConfig: {
    maxRules: number;
    showOnlyActivePhase: boolean;
    priorityFilter: number;
  };
  objectiveConfig: {
    showUpcoming: boolean;
    showGoldValues: boolean;
    showTradeAdvice: boolean;
    warningThreshold: number;
  };
  adviceConfig: {
    showConfidence: boolean;
    minimumConfidence: number;
    showIcon: boolean;
  };
  displayConfig: {
    opacity: number;
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
  hotkeys: {
    toggle: string;
    cycleMode: string;
    resetPosition: string;
  };
}