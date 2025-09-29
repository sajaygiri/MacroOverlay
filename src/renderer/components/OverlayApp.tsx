import React, { useState, useEffect } from 'react';
import { GameState, AdviceState, OverlayConfiguration } from '../../shared/types';
import DianaRules from './DianaRules';
import ObjectiveTimers from './ObjectiveTimers';
import AdvicePanel from './AdvicePanel';
import OverlayConfigPanel from './OverlayConfigPanel';
import { LCUService } from '../services/LCUService';
import { AdviceEngine } from '../services/AdviceEngine';
import { ConfigurationService } from '../services/ConfigurationService';

const OverlayApp: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [advice, setAdvice] = useState<AdviceState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [config, setConfig] = useState<OverlayConfiguration>(ConfigurationService.getInstance().getConfiguration());
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  useEffect(() => {
    const configService = ConfigurationService.getInstance();
    const unsubscribe = configService.subscribe(setConfig);

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

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const formatGameTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getContainerStyle = () => {
    const baseStyle: React.CSSProperties = {
      opacity: config.displayConfig.opacity,
      fontSize: config.displayConfig.fontSize === 'small' ? '12px' : 
                config.displayConfig.fontSize === 'large' ? '16px' : '14px'
    };
    
    if (config.displayConfig.compactMode) {
      baseStyle.padding = '8px';
      baseStyle.minHeight = 'auto';
    }
    
    return baseStyle;
  };

  const handleConfigChange = (newConfig: OverlayConfiguration) => {
    ConfigurationService.getInstance().updateConfiguration(newConfig);
  };

  const shouldShowAdvice = (advice: AdviceState | null): boolean => {
    if (!advice || !config.sections.advicePanel) return false;
    return advice.confidence >= config.adviceConfig.minimumConfidence;
  };

  return (
    <div className="overlay-container" style={getContainerStyle()}>
      <div className="overlay-header">
        <div className="overlay-title">MacroOverlay</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="config-icon-btn" 
            onClick={() => setShowConfigPanel(true)}
            title="Configure Overlay"
          >
            ⚙️
          </button>
          <div className="drag-handle">≡</div>
        </div>
      </div>

      {config.sections.gameTime && isConnected && gameState && (
        <div className="section">
          <div style={{ fontSize: '11px', opacity: 0.8, textAlign: 'center' }}>
            Game Time: {formatGameTime(gameState.gameTime)}
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="section">
          <div style={{ color: '#ff8888', textAlign: 'center' }}>
            Waiting for League of Legends...
          </div>
        </div>
      )}

      {isConnected && gameState && (
        <>
          {config.sections.championRules && gameState.playerChampion === 'Diana' && (
            <div className="section">
              <div className="section-title">Diana Rules</div>
              <DianaRules gameState={gameState} config={config.championRulesConfig} />
            </div>
          )}

          {config.sections.objectiveTimers && (
            <div className="section">
              <div className="section-title">Objectives</div>
              <ObjectiveTimers gameState={gameState} config={config.objectiveConfig} />
            </div>
          )}

          {shouldShowAdvice(advice) && (
            <div className="section">
              <div className="section-title">Advice</div>
              <AdvicePanel advice={advice!} config={config.adviceConfig} />
            </div>
          )}

          {config.sections.goldStatus && (
            <div className="section">
              <div className="section-title">Gold Status</div>
              <div style={{ fontSize: config.displayConfig.compactMode ? '11px' : '12px' }}>
                <div>Team: {gameState.teamGold}g</div>
                <div>Enemy: {gameState.enemyGold}g</div>
                <div style={{ 
                  color: gameState.teamGold > gameState.enemyGold ? '#90ee90' : '#ff8888' 
                }}>
                  Diff: {gameState.teamGold - gameState.enemyGold > 0 ? '+' : ''}{gameState.teamGold - gameState.enemyGold}g
                </div>
              </div>
            </div>
          )}

          {config.sections.playerStats && (
            <div className="section">
              <div className="section-title">Player Stats</div>
              <div style={{ fontSize: config.displayConfig.compactMode ? '11px' : '12px' }}>
                <div>Level: {gameState.playerLevel}</div>
                <div>Gold: {gameState.playerGold}g</div>
                <div>Champion: {gameState.playerChampion}</div>
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '16px', textAlign: 'center' }}>
        {config.hotkeys.toggle} to toggle • Drag to move • ⚙️ to configure
      </div>

      {showConfigPanel && (
        <OverlayConfigPanel
          config={config}
          onConfigChange={handleConfigChange}
          onClose={() => setShowConfigPanel(false)}
        />
      )}
    </div>
  );
};

export default OverlayApp;