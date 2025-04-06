import React from 'react';
import ReactDOM from 'react-dom/client';
import { HeroUIProvider } from "@heroui/react";
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HeroUIProvider>
        <App />
      </HeroUIProvider>
    </React.StrictMode>,
  );
} else {
  console.error('Root element not found');
}
