import React from 'react';
import ReactDOM from 'react-dom/client';
import { HeroUIProvider } from "@heroui/react";
import App from './App';
import './index.css';

// Add console log to check if main.tsx is executing
console.log('main.tsx is executing');

// Create a test component to see if basic rendering works
const TestApp = () => {
  return (
    <div style={{ backgroundColor: '#f0f0f0', minHeight: '100vh', paddingTop: "15%" }}>
      <HeroUIProvider>
        <App />
      </HeroUIProvider>
    </div>
  );
};

try {
  const rootElement = document.getElementById('root');
  console.log('Root element found:', rootElement);
  
  if (rootElement) {
    console.log('Creating React root');
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <TestApp />
      </React.StrictMode>,
    );
    console.log('React root created and rendered');
  } else {
    console.error('Root element not found');
  }
} catch (error) {
  console.error('Error rendering app:', error);
}
