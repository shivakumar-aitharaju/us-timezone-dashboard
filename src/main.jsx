import React from 'react';
import ReactDOM from 'react-dom/client';
import TimezoneDashboard from './App';

// Add error logging
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});

// Render the app with error boundary
const root = ReactDOM.createRoot(document.getElementById('root'));

try {
  root.render(
    <React.StrictMode>
      <TimezoneDashboard />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error rendering app:', error);
  // Fallback UI in case rendering fails completely
  root.render(
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Failed to load the application</h2>
      <p>Please refresh the page or try again later.</p>
      <p>Error: {error.message}</p>
    </div>
  );
}
