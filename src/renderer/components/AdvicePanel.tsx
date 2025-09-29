import React from 'react';
import { AdviceState } from '../../shared/types';

interface AdvicePanelProps {
  advice: AdviceState;
}

const AdvicePanel: React.FC<AdvicePanelProps> = ({ advice }) => {
  const getAdviceClass = (type: string): string => {
    switch (type) {
      case 'fight':
        return 'advice-fight';
      case 'trade':
        return 'advice-trade';
      case 'avoid':
        return 'advice-avoid';
      default:
        return 'advice-trade';
    }
  };

  const getAdviceIcon = (type: string): string => {
    switch (type) {
      case 'fight':
        return '⚔️';
      case 'trade':
        return '🔄';
      case 'avoid':
        return '🛡️';
      default:
        return '💭';
    }
  };

  return (
    <div className={`advice-box ${getAdviceClass(advice.type)}`}>
      <div style={{ marginBottom: '4px', fontSize: '16px' }}>
        {getAdviceIcon(advice.type)}
      </div>
      <div style={{ marginBottom: '4px' }}>
        {advice.message}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.8 }}>
        Confidence: {Math.round(advice.confidence)}%
      </div>
    </div>
  );
};

export default AdvicePanel;