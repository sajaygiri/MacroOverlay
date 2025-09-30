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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartBounds, setResizeStartBounds] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    const configService = ConfigurationService.getInstance();
    const unsubscribe = configService.subscribe(setConfig);

    const lcuService = new LCUService();
    const adviceEngine = new AdviceEngine();

    const getMockGameState = (): GameState => ({
      isInGame: true,
      gameTime: Math.floor(Date.now() / 1000) % 1800, // Mock time cycling 0-30 minutes
      playerChampion: 'Diana',
      playerLevel: 11,
      playerGold: 3750,
      teamGold: 18500,
      enemyGold: 17200,
      objectives: {
        dragon: { spawnsAt: 1200, type: 'elemental' },
        baron: { spawnsAt: 1800 },
        herald: { spawnsAt: -1 }
      }
    });

    const pollGameState = async () => {
      try {
        if (useMockData) {
          const mockState = getMockGameState();
          setGameState(mockState);
          setIsConnected(true);
          const newAdvice = adviceEngine.getAdvice(mockState);
          setAdvice(newAdvice);
          return;
        }

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
        setAdvice(null);
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

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) return; // Only drag from drag handle
    
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Resizing functionality
  const handleResizeMouseDown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    
    if (window.electronAPI) {
      const bounds = await window.electronAPI.getOverlayBounds();
      if (bounds) {
        setResizeStartBounds(bounds);
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      if (window.electronAPI) {
        window.electronAPI.setOverlayPosition(newX, newY);
      }
    } else if (isResizing) {
      const deltaX = e.clientX - (resizeStartBounds.x + resizeStartBounds.width);
      const deltaY = e.clientY - (resizeStartBounds.y + resizeStartBounds.height);
      
      const newWidth = Math.max(300, resizeStartBounds.width + deltaX);
      const newHeight = Math.max(200, resizeStartBounds.height + deltaY);
      
      if (window.electronAPI) {
        window.electronAPI.setOverlaySize(newWidth, newHeight);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Add global mouse event listeners for dragging and resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeStartBounds]);

  // Hotkey handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        if (window.electronAPI) {
          window.electronAPI.toggleOverlay();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="overlay-container" style={{...getContainerStyle(), position: 'relative'}}>
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
          <div 
            className="drag-handle"
            onMouseDown={handleMouseDown}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            title="Drag to move overlay"
          >
            ≡
          </div>
        </div>
      </div>

      {config.sections.gameTime && isConnected && gameState && (
        <div className="section">
          <div style={{ fontSize: '11px', opacity: 0.8, textAlign: 'center' }}>
            Game Time: {formatGameTime(gameState.gameTime)}
          </div>
        </div>
      )}

      {!isConnected && !useMockData && (
        <div className="section">
          <div style={{ color: '#ff8888', textAlign: 'center', marginBottom: '8px' }}>
            Waiting for League of Legends...
          </div>
          <button 
            onClick={() => setUseMockData(true)}
            style={{
              background: 'rgba(255, 215, 0, 0.2)',
              border: '1px solid #ffd700',
              color: '#ffd700',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Enable Mock Data (Testing)
          </button>
        </div>
      )}
      
      {(isConnected || useMockData) && useMockData && (
        <div className="section">
          <div style={{ color: '#ffd700', textAlign: 'center', fontSize: '10px', marginBottom: '4px' }}>
            Mock Data Mode
          </div>
          <button 
            onClick={() => setUseMockData(false)}
            style={{
              background: 'rgba(255, 88, 88, 0.2)',
              border: '1px solid #ff5858',
              color: '#ff5858',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '9px',
              cursor: 'pointer'
            }}
          >
            Disable
          </button>
        </div>
      )}

      {(isConnected || useMockData) && gameState && (
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

      {/* Resize handle */}
      <div 
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
        style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          width: '12px',
          height: '12px',
          cursor: 'nw-resize',
          background: 'linear-gradient(-45deg, transparent 0%, transparent 40%, #ffd700 40%, #ffd700 60%, transparent 60%, transparent 100%)',
          opacity: 0.6
        }}
        title="Drag to resize"
      />

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