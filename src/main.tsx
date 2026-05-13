import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { FirebaseProvider } from './components/FirebaseProvider';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Register Service Worker for PWA / iOS standalone mode
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  });
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </React.StrictMode>
);
