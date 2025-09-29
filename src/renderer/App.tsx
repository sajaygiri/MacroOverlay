import React from 'react';
import OverlayApp from './components/OverlayApp';
import LauncherApp from './components/LauncherApp';

interface AppProps {
  mode: 'overlay' | 'main' | null;
}

const App: React.FC<AppProps> = ({ mode }) => {
  if (mode === 'overlay') {
    return <OverlayApp />;
  }
  
  return <LauncherApp />;
};

export default App;