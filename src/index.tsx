import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { reportWebVitals } from './utils/reportWebVitals';
import './types/global'; // Import global type declarations

// Initialize the app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Remove loading screen
const removeLoadingScreen = () => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.remove();
  }
};

// Render the app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove loading screen after React has mounted
setTimeout(removeLoadingScreen, 100);

// Performance monitoring
reportWebVitals(console.log);

// Hot module replacement for development
if (process.env.NODE_ENV === 'development' && (module as any).hot) {
  (module as any).hot.accept();
} 