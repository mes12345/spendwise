import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Global error listener for early runtime errors
window.addEventListener('error', (event) => {
  console.error("SpendWise: Runtime error caught in index.tsx", event.error || event.message);
  const loader = document.getElementById('loading');
  if (loader) loader.classList.add('fade-out');
});

const init = () => {
  console.info("SpendWise: Initializing React mount...");
  const rootElement = document.getElementById('root');
  const loader = document.getElementById('loading');

  if (!rootElement) {
    console.error("SpendWise: Root element (#root) missing in DOM.");
    if (loader) loader.classList.add('fade-out');
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.info("SpendWise: Render triggered.");

    // Fade out loader
    if (loader) {
      setTimeout(() => {
        console.info("SpendWise: Fading out loader.");
        loader.classList.add('fade-out');
        setTimeout(() => {
          loader.style.display = 'none';
        }, 500);
      }, 300);
    }
  } catch (error) {
    console.error("SpendWise: React render failed.", error);
    if (loader) loader.classList.add('fade-out');
  }
};

// Use a small delay to ensure the DOM is ready after module injection
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}