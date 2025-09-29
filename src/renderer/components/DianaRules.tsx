import React from 'react';
import { GameState, ChampionRule, OverlayConfiguration } from '../../shared/types';
import dianaRulesData from '../data/diana-rules.json';

interface DianaRulesProps {
  gameState: GameState;
  config: OverlayConfiguration['championRulesConfig'];
}

const DianaRules: React.FC<DianaRulesProps> = ({ gameState, config }) => {
  const evaluateRule = (rule: ChampionRule, gameState: GameState): boolean => {
    const { condition } = rule;
    const { playerLevel, gameTime } = gameState;
    
    try {
      const conditionContext = {
        level: playerLevel,
        gameTime,
        hasItem: (itemName: string) => {
          return false;
        },
        mana: 100,
        position: 'mid'
      };

      const evalCondition = condition
        .replace(/level/g, conditionContext.level.toString())
        .replace(/gameTime/g, conditionContext.gameTime.toString())
        .replace(/hasItem\('([^']+)'\)/g, 'false')
        .replace(/mana/g, conditionContext.mana.toString())
        .replace(/position === '([^']+)'/g, (match, pos) => 
          conditionContext.position === pos ? 'true' : 'false'
        );

      return eval(evalCondition);
    } catch (error) {
      return false;
    }
  };

  const getPhase = (gameTime: number, level: number): 'early' | 'mid' | 'late' => {
    if (level < 6 || gameTime < 600) return 'early';
    if (level < 11 || gameTime < 1200) return 'mid';
    return 'late';
  };

  const currentPhase = getPhase(gameState.gameTime, gameState.playerLevel);
  const rules = dianaRulesData.rules as ChampionRule[];
  
  let relevantRules = rules
    .filter(rule => config.showOnlyActivePhase ? rule.phase === currentPhase : true)
    .filter(rule => rule.priority <= config.priorityFilter)
    .filter(rule => evaluateRule(rule, gameState))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, config.maxRules);

  return (
    <ul className="rules-list">
      {relevantRules.map(rule => (
        <li key={rule.id} className="rule-item active">
          {rule.text}
        </li>
      ))}
      {relevantRules.length === 0 && (
        <li className="rule-item">
          No active rules for current game state
        </li>
      )}
    </ul>
  );
};

export default DianaRules;