import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../style.css';

// Register Service Worker for PWA Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('🚀 [PWA] Service Worker Registered:', reg.scope))
      .catch(err => console.error('❌ [PWA] Service Worker Registration Failed:', err));
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
