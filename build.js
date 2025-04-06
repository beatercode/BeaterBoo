// Simple build script for Vercel deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

try {
  console.log('Starting build process...');
  
  // Run Vite build with special Vercel config
  console.log('Running Vite build with special Vercel config...');
  execSync('npx vite build --config vite.vercel.config.js', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
