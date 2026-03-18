import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.info("SpendWise: index.tsx module loaded.");

const init = () => {
  console.info("SpendWise: Initializing React...");
  const rootElement = document.getElementById('root');
  const loader = document.getElementById('loading');

  if (!rootElement) {
    console.error("SpendWise: Root element not found.");
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    console.info("SpendWise: React render triggered.");

    // Fade out loader
    if (loader) {
      setTimeout(() => {
        console.info("SpendWise: Hiding loader...");
        loader.classList.add('fade-out');
        setTimeout(() => {
          loader.style.display = 'none';
        }, 500);
      }, 500);
    }
  } catch (error) {
    console.error("SpendWise: Initialization failed.", error);
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) {
      errorDisplay.innerText = `Initialization Error: ${error instanceof Error ? error.message : String(error)}`;
      errorDisplay.classList.remove('hidden');
    }
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.innerText = "Error";
  }
};

// Modules are deferred by default, so we can just call init
init();