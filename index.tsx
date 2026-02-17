
import React from 'react';
import ReactDOM from 'react-dom/client';
// Note: In this specific browser-only setup, we import the root App component
// We use a relative path. Babel will handle the fetching if configured, 
// but for the most stable "no-build" we must ensure the browser doesn't block the request.
import App from './App.tsx';

const init = () => {
    const container = document.getElementById('root');
    if (!container) return;

    const root = ReactDOM.createRoot(container);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );

    // Fade out loader
    const loader = document.getElementById('loading');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
};

// Start the application
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}
