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