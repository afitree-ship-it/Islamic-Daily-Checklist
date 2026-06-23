
if (typeof window !== "undefined") {
  (window as any).global = window;
  (window as any).process = (window as any).process || {
    env: {
      NODE_ENV: "development",
    },
    browser: true,
    version: "",
    versions: {},
    platform: "browser"
  };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
