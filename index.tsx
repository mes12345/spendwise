
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
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Fade out loader once React has taken over
    if (loader) {
      // Use a slightly longer timeout to ensure content is painted
      setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => {
          loader.style.display = 'none';
        }, 500);
      }, 500);
    }
    console.info("SpendWise: Initialized successfully.");
  } catch (error) {
    console.error("SpendWise: Render failed.", error);
    if (loader) loader.style.display = 'none';
  }
};

// Execute boot
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}

// Emergency failsafe to clear loading screen if JS crashes or hangs
setTimeout(() => {
  const loader = document.getElementById('loading');
  if (loader && !loader.classList.contains('fade-out')) {
    console.warn("SpendWise: Loading took too long, forcing splash screen to close.");
    loader.classList.add('fade-out');
  }
}, 4000);
