import React, { useState, useEffect } from 'react';
import { ConfigurationService } from '../services/ConfigurationService';
import { OverlayConfiguration } from '../../shared/types';

const LauncherApp: React.FC = () => {
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    winRate: 0,
    avgGoldLead: 0,
    overlayActive: false
  });

  const [settings, setSettings] = useState({
    overlayPosition: { x: 100, y: 100 },
    hotkey: 'F10',
    autoStart: true
  });

  const [overlayConfig, setOverlayConfig] = useState<OverlayConfiguration>(
    ConfigurationService.getInstance().getConfiguration()
  );

  useEffect(() => {
    setStats({
      gamesPlayed: 127,
      winRate: 68.5,
      avgGoldLead: 342,
      overlayActive: true
    });
  }, []);

  const toggleOverlay = async () => {
    if (window.electronAPI) {
      await window.electronAPI.toggleOverlay();
      const visible = await window.electronAPI.getOverlayVisibility();
      setStats(prev => ({ ...prev, overlayActive: visible }));
    }
  };

  return (
    <div className="launcher-container">
      <div className="launcher-header">
        <h1>MacroOverlay</h1>
        <p>League of Legends Macro Companion</p>
      </div>

      <div className="launcher-content">
        <div className="main-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.gamesPlayed}</div>
              <div className="stat-label">Games Tracked</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.winRate}%</div>
              <div className="stat-label">Win Rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">+{stats.avgGoldLead}g</div>
              <div className="stat-label">Avg Gold Lead</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.overlayActive ? 'ON' : 'OFF'}</div>
              <div className="stat-label">Overlay Status</div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn" onClick={toggleOverlay}>
                {stats.overlayActive ? 'Hide' : 'Show'} Overlay
              </button>
              <button className="btn" style={{ background: '#6c757d' }}>
                View Match History
              </button>
              <button className="btn" style={{ background: '#28a745' }}>
                Champion Guide
              </button>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '16px' }}>Recent Games</h3>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Champion</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Result</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Gold Diff</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Duration</div>
              </div>
              {[
                { champion: 'Diana', result: 'Victory', goldDiff: '+2.1k', duration: '28:42' },
                { champion: 'Diana', result: 'Defeat', goldDiff: '-0.8k', duration: '31:15' },
                { champion: 'Yasuo', result: 'Victory', goldDiff: '+1.5k', duration: '25:33' },
              ].map((game, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '12px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ fontWeight: '600' }}>{game.champion}</div>
                  <div style={{ color: game.result === 'Victory' ? '#90ee90' : '#ff8888' }}>{game.result}</div>
                  <div style={{ color: game.goldDiff.startsWith('+') ? '#90ee90' : '#ff8888' }}>{game.goldDiff}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>{game.duration}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="ad-space">
            <h4>Gaming Gear</h4>
            <p>🖱️ Pro Gaming Mice</p>
            <p>⌨️ Mechanical Keyboards</p>
            <p>🎧 Gaming Headsets</p>
            <small>Sponsored Content</small>
          </div>

          <div className="ad-space">
            <h4>Upgrade to Pro</h4>
            <p>✨ Remove ads</p>
            <p>🏆 All champions</p>
            <p>📊 Advanced analytics</p>
            <p>🎨 Custom themes</p>
            <button className="btn" style={{ width: '100%', marginTop: '12px' }}>
              Upgrade Now
            </button>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '16px' }}>
            <h4 style={{ marginBottom: '12px' }}>Settings</h4>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                Overlay Hotkey:
              </label>
              <input 
                type="text" 
                value={settings.hotkey}
                onChange={(e) => setSettings(prev => ({ ...prev, hotkey: e.target.value }))}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  border: '1px solid rgba(255, 255, 255, 0.3)', 
                  borderRadius: '4px', 
                  padding: '6px',
                  color: 'white',
                  width: '100%'
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settings.autoStart}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoStart: e.target.checked }))}
                  style={{ marginRight: '8px' }}
                />
                Auto-start with League
              </label>
            </div>
            
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '12px', marginTop: '12px' }}>
              <h5 style={{ marginBottom: '8px', fontSize: '12px', color: '#ffd700' }}>Quick Overlay Settings</h5>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={overlayConfig.sections.championRules}
                    onChange={(e) => {
                      const newConfig = { ...overlayConfig };
                      newConfig.sections.championRules = e.target.checked;
                      setOverlayConfig(newConfig);
                      ConfigurationService.getInstance().updateConfiguration(newConfig);
                    }}
                    style={{ marginRight: '6px' }}
                  />
                  Show Champion Rules
                </label>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={overlayConfig.sections.objectiveTimers}
                    onChange={(e) => {
                      const newConfig = { ...overlayConfig };
                      newConfig.sections.objectiveTimers = e.target.checked;
                      setOverlayConfig(newConfig);
                      ConfigurationService.getInstance().updateConfiguration(newConfig);
                    }}
                    style={{ marginRight: '6px' }}
                  />
                  Show Objective Timers
                </label>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={overlayConfig.sections.advicePanel}
                    onChange={(e) => {
                      const newConfig = { ...overlayConfig };
                      newConfig.sections.advicePanel = e.target.checked;
                      setOverlayConfig(newConfig);
                      ConfigurationService.getInstance().updateConfiguration(newConfig);
                    }}
                    style={{ marginRight: '6px' }}
                  />
                  Show Macro Advice
                </label>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={overlayConfig.sections.playerStats}
                    onChange={(e) => {
                      const newConfig = { ...overlayConfig };
                      newConfig.sections.playerStats = e.target.checked;
                      setOverlayConfig(newConfig);
                      ConfigurationService.getInstance().updateConfiguration(newConfig);
                    }}
                    style={{ marginRight: '6px' }}
                  />
                  Show Player Stats
                </label>
              </div>
              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '8px' }}>
                Use gear icon (⚙️) in overlay for detailed settings
              </div>
              
              <button 
                onClick={() => {
                  if (window.electronAPI) {
                    window.electronAPI.moveOverlayToGame();
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '12px',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                📍 Move Overlay to Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LauncherApp;