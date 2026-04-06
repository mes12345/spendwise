import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.info("SpendWise: index.tsx module loaded.");

// Mark as initialized for the failsafe in index.html
(window as any).SpendWiseInitialized = true;

// Global error listener to catch issues during script execution
window.onerror = (message, source, lineno, colno, error) => {
  console.error("SpendWise: Global error caught:", { message, source, lineno, colno, error });
  const errorDisplay = document.getElementById('error-display');
  if (errorDisplay) {
    errorDisplay.innerText = `Runtime Error: ${message}`;
    errorDisplay.classList.add('show');
  }
  const loadingText = document.getElementById('loading-text');
  if (loadingText) loadingText.innerText = "Error";
};

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
      errorDisplay.classList.add('show');
    }
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.innerText = "Error";
  }
};

// Failsafe: Remove loader after 8 seconds if it's still there
setTimeout(() => {
  const loader = document.getElementById('loading');
  if (loader && !loader.classList.contains('fade-out')) {
    console.warn("SpendWise: Failsafe triggered - removing loader.");
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }
}, 8000);

// Modules are deferred by default, but we can ensure DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
