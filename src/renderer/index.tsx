import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const container = document.getElementById('root');
const root = createRoot(container!);

const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');

root.render(<App mode={mode as 'overlay' | 'main' | null} />);