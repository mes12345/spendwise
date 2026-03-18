import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const init = () => {
  console.info("SpendWise: React mounting...");
  const rootElement = document.getElementById('root');
  const loader = document.getElementById('loading');

  if (!rootElement) {
    console.error("SpendWise: Root element missing.");
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Fade out loader
    if (loader) {
      setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => {
          loader.style.display = 'none';
        }, 500);
      }, 500);
    }
  } catch (error) {
    console.error("SpendWise: Render failed.", error);
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) {
      errorDisplay.innerText = `Render Failed: ${error instanceof Error ? error.message : String(error)}`;
      errorDisplay.classList.remove('hidden');
    }
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.innerText = "Error";
  }
};

// Use a small delay to ensure the DOM is ready after module injection
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}

// Failsafe
setTimeout(() => {
  const loader = document.getElementById('loading');
  if (loader && !loader.classList.contains('fade-out')) {
    loader.classList.add('fade-out');
  }
}, 6000);