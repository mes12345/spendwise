import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { FirebaseProvider } from './components/FirebaseProvider';
import { FinanceProvider } from './contexts/FinanceContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <FirebaseProvider>
      <FinanceProvider>
        <App />
      </FinanceProvider>
    </FirebaseProvider>
  </React.StrictMode>
);
