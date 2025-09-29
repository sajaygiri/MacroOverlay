import React from 'react';
import { GameState, OverlayConfiguration } from '../../shared/types';
import goldValues from '../data/gold-values.json';

interface ObjectiveTimersProps {
  gameState: GameState;
  config: OverlayConfiguration['objectiveConfig'];
}

const ObjectiveTimers: React.FC<ObjectiveTimersProps> = ({ gameState, config }) => {
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return 'UP';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeToSpawn = (spawnTime: number): number => {
    return Math.max(0, spawnTime - gameState.gameTime);
  };

  const getObjectiveValue = (objective: string, gameTime: number): number => {
    switch (objective) {
      case 'dragon':
        return goldValues.objectives.dragon;
      case 'herald':
        return goldValues.objectives.herald;
      case 'baron':
        return goldValues.objectives.baron;
      default:
        return 0;
    }
  };

  const getNextBestTrade = (): string => {
    const dragonTime = getTimeToSpawn(gameState.objectives.dragon.spawnsAt);
    const heraldTime = getTimeToSpawn(gameState.objectives.herald.spawnsAt);
    const baronTime = getTimeToSpawn(gameState.objectives.baron.spawnsAt);

    if (dragonTime <= 30 && heraldTime > 60) {
      return "Trade Herald for Dragon";
    } else if (heraldTime <= 30 && dragonTime > 60) {
      return "Herald > Early Dragon";
    } else if (baronTime <= 60) {
      return "Focus Baron prep";
    } else {
      return "Farm for next objective";
    }
  };

  const isWarning = (timeToSpawn: number): boolean => {
    return timeToSpawn <= config.warningThreshold && timeToSpawn > 0;
  };

  return (
    <div>
      {config.showUpcoming && (
        <div className="objective-timer">
          <span>
            Dragon{config.showGoldValues ? ` (${goldValues.objectives.dragon}g)` : ''}:
          </span>
          <span 
            className="timer-value"
            style={{ color: isWarning(getTimeToSpawn(gameState.objectives.dragon.spawnsAt)) ? '#ffff00' : '#87ceeb' }}
          >
            {formatTime(getTimeToSpawn(gameState.objectives.dragon.spawnsAt))}
          </span>
        </div>
      )}
      
      {config.showUpcoming && gameState.objectives.herald.spawnsAt > 0 && (
        <div className="objective-timer">
          <span>
            Herald{config.showGoldValues ? ` (${goldValues.objectives.herald}g)` : ''}:
          </span>
          <span 
            className="timer-value"
            style={{ color: isWarning(getTimeToSpawn(gameState.objectives.herald.spawnsAt)) ? '#ffff00' : '#87ceeb' }}
          >
            {formatTime(getTimeToSpawn(gameState.objectives.herald.spawnsAt))}
          </span>
        </div>
      )}
      
      {config.showUpcoming && gameState.gameTime >= 1200 && (
        <div className="objective-timer">
          <span>
            Baron{config.showGoldValues ? ` (${goldValues.objectives.baron}g)` : ''}:
          </span>
          <span 
            className="timer-value"
            style={{ color: isWarning(getTimeToSpawn(gameState.objectives.baron.spawnsAt)) ? '#ffff00' : '#87ceeb' }}
          >
            {formatTime(getTimeToSpawn(gameState.objectives.baron.spawnsAt))}
          </span>
        </div>
      )}

      {config.showTradeAdvice && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          background: 'rgba(255, 215, 0, 0.1)', 
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          <strong>Next Best:</strong> {getNextBestTrade()}
        </div>
      )}

      {config.showGoldValues && (
        <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.8 }}>
          <div>Plate: {goldValues.objectives.towerPlate}g</div>
          <div>Wave: {goldValues.objectives.cannonWave}g</div>
        </div>
      )}
    </div>
  );
};

export default ObjectiveTimers;