import React, { useState, useEffect } from 'react';
import { GameState, AdviceState } from '../../shared/types';
import DianaRules from './DianaRules';
import ObjectiveTimers from './ObjectiveTimers';
import AdvicePanel from './AdvicePanel';
import { LCUService } from '../services/LCUService';
import { AdviceEngine } from '../services/AdviceEngine';

const OverlayApp: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [advice, setAdvice] = useState<AdviceState | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const lcuService = new LCUService();
    const adviceEngine = new AdviceEngine();

    const pollGameState = async () => {
      try {
        const state = await lcuService.getGameState();
        setGameState(state);
        setIsConnected(true);

        if (state && state.isInGame) {
          const newAdvice = adviceEngine.getAdvice(state);
          setAdvice(newAdvice);
        }
      } catch (error) {
        setIsConnected(false);
        setGameState(null);
      }
    };

    const interval = setInterval(pollGameState, 2000);
    pollGameState();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overlay-container">
      <div className="overlay-header">
        <div className="overlay-title">MacroOverlay</div>
        <div className="drag-handle">≡</div>
      </div>

      {!isConnected && (
        <div className="section">
          <div style={{ color: '#ff8888', textAlign: 'center' }}>
            Waiting for League of Legends...
          </div>
        </div>
      )}

      {isConnected && gameState && (
        <>
          {gameState.playerChampion === 'Diana' && (
            <div className="section">
              <div className="section-title">Diana Rules</div>
              <DianaRules gameState={gameState} />
            </div>
          )}

          <div className="section">
            <div className="section-title">Objectives</div>
            <ObjectiveTimers gameState={gameState} />
          </div>

          {advice && (
            <div className="section">
              <div className="section-title">Advice</div>
              <AdvicePanel advice={advice} />
            </div>
          )}

          <div className="section">
            <div className="section-title">Gold Status</div>
            <div style={{ fontSize: '12px' }}>
              <div>Team: {gameState.teamGold}g</div>
              <div>Enemy: {gameState.enemyGold}g</div>
              <div style={{ 
                color: gameState.teamGold > gameState.enemyGold ? '#90ee90' : '#ff8888' 
              }}>
                Diff: {gameState.teamGold - gameState.enemyGold > 0 ? '+' : ''}{gameState.teamGold - gameState.enemyGold}g
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '16px', textAlign: 'center' }}>
        F10 to toggle • Drag to move
      </div>
    </div>
  );
};

export default OverlayApp;