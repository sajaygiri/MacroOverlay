import { GameState, AdviceState } from '../../shared/types';
import goldValues from '../data/gold-values.json';

export class AdviceEngine {
  getAdvice(gameState: GameState): AdviceState {
    const goldDiff = gameState.teamGold - gameState.enemyGold;
    const goldDiffPercentage = gameState.enemyGold > 0 ? (goldDiff / gameState.enemyGold) * 100 : 0;
    
    const advice = this.calculateAdvice(gameState, goldDiff, goldDiffPercentage);
    return advice;
  }

  private calculateAdvice(gameState: GameState, goldDiff: number, goldDiffPercentage: number): AdviceState {
    const { gameTime, playerLevel, playerChampion } = gameState;
    
    if (goldDiffPercentage >= 15) {
      return {
        type: 'fight',
        message: this.getFightAdvice(gameState, goldDiff),
        confidence: Math.min(95, 70 + goldDiffPercentage)
      };
    }
    
    if (goldDiffPercentage <= -15) {
      return {
        type: 'avoid',
        message: this.getAvoidAdvice(gameState, goldDiff),
        confidence: Math.min(95, 70 + Math.abs(goldDiffPercentage))
      };
    }
    
    if (this.shouldTrade(gameState)) {
      return {
        type: 'trade',
        message: this.getTradeAdvice(gameState),
        confidence: 60 + Math.abs(goldDiffPercentage)
      };
    }
    
    return {
      type: 'trade',
      message: this.getNeutralAdvice(gameState),
      confidence: 50
    };
  }

  private getFightAdvice(gameState: GameState, goldDiff: number): string {
    const { gameTime, objectives } = gameState;
    
    if (gameTime >= 1200 && this.isObjectiveUp(objectives.baron.spawnsAt, gameTime)) {
      return `Gold lead +${Math.round(goldDiff)}g - Force Baron fight`;
    }
    
    if (this.isObjectiveUp(objectives.dragon.spawnsAt, gameTime)) {
      return `Gold lead +${Math.round(goldDiff)}g - Contest Dragon`;
    }
    
    if (gameTime < 900) {
      return `Gold lead +${Math.round(goldDiff)}g - Look for picks`;
    }
    
    return `Gold lead +${Math.round(goldDiff)}g - Force teamfights`;
  }

  private getAvoidAdvice(gameState: GameState, goldDiff: number): string {
    const { gameTime, objectives } = gameState;
    
    if (gameTime >= 1200 && this.isObjectiveUp(objectives.baron.spawnsAt, gameTime)) {
      return `Behind ${Math.round(Math.abs(goldDiff))}g - Give Baron, farm safely`;
    }
    
    if (this.isObjectiveUp(objectives.dragon.spawnsAt, gameTime)) {
      return `Behind ${Math.round(Math.abs(goldDiff))}g - Trade Dragon for farm`;
    }
    
    return `Behind ${Math.round(Math.abs(goldDiff))}g - Focus farming & scaling`;
  }

  private getTradeAdvice(gameState: GameState): string {
    const { gameTime, objectives } = gameState;
    
    if (gameTime < 480 && this.isObjectiveUp(objectives.herald.spawnsAt, gameTime)) {
      return "Early game - Herald for tower plates";
    }
    
    if (this.isObjectiveUp(objectives.dragon.spawnsAt, gameTime) && 
        this.isObjectiveUp(objectives.herald.spawnsAt, gameTime)) {
      return "Trade Herald for Dragon + farm";
    }
    
    if (gameTime >= 1200) {
      return "Late game - Split push or group mid";
    }
    
    return "Look for objective trades";
  }

  private getNeutralAdvice(gameState: GameState): string {
    const { gameTime, playerChampion, playerLevel } = gameState;
    
    if (playerChampion === 'Diana' && playerLevel < 6) {
      return "Farm safely until level 6 power spike";
    }
    
    if (gameTime < 600) {
      return "Focus on laning phase fundamentals";
    }
    
    if (gameTime >= 1200) {
      return "Look for late game teamfight opportunities";
    }
    
    return "Play for vision and farm";
  }

  private shouldTrade(gameState: GameState): boolean {
    const { gameTime, objectives } = gameState;
    
    const dragonSoon = this.isObjectiveSoon(objectives.dragon.spawnsAt, gameTime, 60);
    const heraldSoon = this.isObjectiveSoon(objectives.herald.spawnsAt, gameTime, 60);
    const baronSoon = gameTime >= 1200 && this.isObjectiveSoon(objectives.baron.spawnsAt, gameTime, 90);
    
    return dragonSoon || heraldSoon || baronSoon;
  }

  private isObjectiveUp(spawnTime: number, currentTime: number): boolean {
    return spawnTime > 0 && currentTime >= spawnTime;
  }

  private isObjectiveSoon(spawnTime: number, currentTime: number, threshold: number): boolean {
    return spawnTime > 0 && (spawnTime - currentTime) <= threshold && (spawnTime - currentTime) >= 0;
  }
}