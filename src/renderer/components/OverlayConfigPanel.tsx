import React, { useState, useEffect } from 'react';
import { OverlayConfiguration } from '../../shared/types';

interface OverlayConfigPanelProps {
  config: OverlayConfiguration;
  onConfigChange: (config: OverlayConfiguration) => void;
  onClose: () => void;
}

const OverlayConfigPanel: React.FC<OverlayConfigPanelProps> = ({
  config,
  onConfigChange,
  onClose
}) => {
  const [localConfig, setLocalConfig] = useState<OverlayConfiguration>(config);

  const updateConfig = (updates: Partial<OverlayConfiguration>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const updateSection = (section: keyof OverlayConfiguration['sections'], value: boolean) => {
    updateConfig({
      sections: {
        ...localConfig.sections,
        [section]: value
      }
    });
  };

  const updateChampionRules = (updates: Partial<OverlayConfiguration['championRulesConfig']>) => {
    updateConfig({
      championRulesConfig: {
        ...localConfig.championRulesConfig,
        ...updates
      }
    });
  };

  const updateObjectiveConfig = (updates: Partial<OverlayConfiguration['objectiveConfig']>) => {
    updateConfig({
      objectiveConfig: {
        ...localConfig.objectiveConfig,
        ...updates
      }
    });
  };

  const updateAdviceConfig = (updates: Partial<OverlayConfiguration['adviceConfig']>) => {
    updateConfig({
      adviceConfig: {
        ...localConfig.adviceConfig,
        ...updates
      }
    });
  };

  const updateDisplayConfig = (updates: Partial<OverlayConfiguration['displayConfig']>) => {
    updateConfig({
      displayConfig: {
        ...localConfig.displayConfig,
        ...updates
      }
    });
  };

  const updateHotkeys = (updates: Partial<OverlayConfiguration['hotkeys']>) => {
    updateConfig({
      hotkeys: {
        ...localConfig.hotkeys,
        ...updates
      }
    });
  };

  const resetToDefaults = () => {
    const defaultConfig: OverlayConfiguration = {
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
    setLocalConfig(defaultConfig);
    onConfigChange(defaultConfig);
  };

  return (
    <div className="config-panel-overlay">
      <div className="config-panel">
        <div className="config-header">
          <h2>Overlay Configuration</h2>
          <button className="config-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="config-content">
          <div className="config-section">
            <h3>Display Sections</h3>
            <div className="config-grid">
              {Object.entries(localConfig.sections).map(([key, value]) => (
                <label key={key} className="config-toggle">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateSection(key as keyof OverlayConfiguration['sections'], e.target.checked)}
                  />
                  <span className="config-toggle-label">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {localConfig.sections.championRules && (
            <div className="config-section">
              <h3>Champion Rules</h3>
              <div className="config-row">
                <label>Max Rules to Show:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={localConfig.championRulesConfig.maxRules}
                  onChange={(e) => updateChampionRules({ maxRules: parseInt(e.target.value) })}
                />
              </div>
              <div className="config-row">
                <label>Priority Filter (1-3):</label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={localConfig.championRulesConfig.priorityFilter}
                  onChange={(e) => updateChampionRules({ priorityFilter: parseInt(e.target.value) })}
                />
              </div>
              <label className="config-checkbox">
                <input
                  type="checkbox"
                  checked={localConfig.championRulesConfig.showOnlyActivePhase}
                  onChange={(e) => updateChampionRules({ showOnlyActivePhase: e.target.checked })}
                />
                Show only current phase rules
              </label>
            </div>
          )}

          {localConfig.sections.objectiveTimers && (
            <div className="config-section">
              <h3>Objective Timers</h3>
              <div className="config-row">
                <label>Warning Threshold (seconds):</label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={localConfig.objectiveConfig.warningThreshold}
                  onChange={(e) => updateObjectiveConfig({ warningThreshold: parseInt(e.target.value) })}
                />
              </div>
              <label className="config-checkbox">
                <input
                  type="checkbox"
                  checked={localConfig.objectiveConfig.showUpcoming}
                  onChange={(e) => updateObjectiveConfig({ showUpcoming: e.target.checked })}
                />
                Show upcoming objectives
              </label>
              <label className="config-checkbox">
                <input
                  type="checkbox"
                  checked={localConfig.objectiveConfig.showGoldValues}
                  onChange={(e) => updateObjectiveConfig({ showGoldValues: e.target.checked })}
                />
                Show gold values
              </label>
              <label className="config-checkbox">
                <input
                  type="checkbox"
                  checked={localConfig.objectiveConfig.showTradeAdvice}
                  onChange={(e) => updateObjectiveConfig({ showTradeAdvice: e.target.checked })}
                />
                Show trade advice
              </label>
            </div>
          )}

          {localConfig.sections.advicePanel && (
            <div className="config-section">
              <h3>Advice Panel</h3>
              <div className="config-row">
                <label>Minimum Confidence (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={localConfig.adviceConfig.minimumConfidence}
                  onChange={(e) => updateAdviceConfig({ minimumConfidence: parseInt(e.target.value) })}
                />
              </div>
              <label className="config-checkbox">
                <input
                  type="checkbox"
                  checked={localConfig.adviceConfig.showConfidence}
                  onChange={(e) => updateAdviceConfig({ showConfidence: e.target.checked })}
                />
                Show confidence percentage
              </label>
              <label className="config-checkbox">
                <input
                  type="checkbox"
                  checked={localConfig.adviceConfig.showIcon}
                  onChange={(e) => updateAdviceConfig({ showIcon: e.target.checked })}
                />
                Show advice icons
              </label>
            </div>
          )}

          <div className="config-section">
            <h3>Display Settings</h3>
            <div className="config-row">
              <label>Opacity:</label>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.05"
                value={localConfig.displayConfig.opacity}
                onChange={(e) => updateDisplayConfig({ opacity: parseFloat(e.target.value) })}
              />
              <span>{Math.round(localConfig.displayConfig.opacity * 100)}%</span>
            </div>
            <div className="config-row">
              <label>Font Size:</label>
              <select
                value={localConfig.displayConfig.fontSize}
                onChange={(e) => updateDisplayConfig({ fontSize: e.target.value as 'small' | 'medium' | 'large' })}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <label className="config-checkbox">
              <input
                type="checkbox"
                checked={localConfig.displayConfig.compactMode}
                onChange={(e) => updateDisplayConfig({ compactMode: e.target.checked })}
              />
              Compact mode
            </label>
          </div>

          <div className="config-section">
            <h3>Hotkeys</h3>
            <div className="config-row">
              <label>Toggle Overlay:</label>
              <input
                type="text"
                value={localConfig.hotkeys.toggle}
                onChange={(e) => updateHotkeys({ toggle: e.target.value })}
                placeholder="F10"
              />
            </div>
            <div className="config-row">
              <label>Cycle Mode:</label>
              <input
                type="text"
                value={localConfig.hotkeys.cycleMode}
                onChange={(e) => updateHotkeys({ cycleMode: e.target.value })}
                placeholder="F11"
              />
            </div>
            <div className="config-row">
              <label>Reset Position:</label>
              <input
                type="text"
                value={localConfig.hotkeys.resetPosition}
                onChange={(e) => updateHotkeys({ resetPosition: e.target.value })}
                placeholder="F12"
              />
            </div>
          </div>
        </div>

        <div className="config-footer">
          <button className="config-btn config-btn-secondary" onClick={resetToDefaults}>
            Reset to Defaults
          </button>
          <button className="config-btn config-btn-primary" onClick={onClose}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverlayConfigPanel;