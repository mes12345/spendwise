
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const init = () => {
    console.log("SpendWise: Initializing application...");
    const container = document.getElementById('root');
    const loader = document.getElementById('loading');
    
    if (!container) {
        console.error("SpendWise: Root container not found");
        return;
    }

    try {
        const root = ReactDOM.createRoot(container);
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );

        // Success: Hide loader
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    } catch (error) {
        console.error("SpendWise: Failed to render app", error);
        // Force hide loader so user sees potential error state
        if (loader) loader.style.display = 'none';
    }
};

// Execute immediately since module scripts are deferred by default
init();
