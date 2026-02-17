import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const init = () => {
  const rootElement = document.getElementById('root');
  const loader = document.getElementById('loading');

  if (!rootElement) {
    console.error("SpendWise: Root element missing.");
    return;
  }

  try {
    const root = createRoot(rootElement);
    
    // Render the application
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Fade out loader once React has successfully scheduled a render
    if (loader) {
      // requestAnimationFrame ensures the browser has processed the react update
      requestAnimationFrame(() => {
        setTimeout(() => {
          loader.classList.add('fade-out');
          setTimeout(() => {
            loader.style.display = 'none';
          }, 500);
        }, 150);
      });
    }
    console.info("SpendWise: Initialized successfully.");
  } catch (error) {
    console.error("SpendWise: Render failed.", error);
    // If it fails, at least hide the loader so the user sees something (or an error)
    if (loader) loader.style.display = 'none';
  }
};

// Start the application as soon as possible
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}

// Emergency failsafe to clear loading screen if JS crashes or hangs elsewhere
setTimeout(() => {
  const loader = document.getElementById('loading');
  if (loader && !loader.classList.contains('fade-out')) {
    console.warn("SpendWise: Initialization took too long, clearing splash screen.");
    loader.classList.add('fade-out');
  }
}, 5000);