// simple-build.js - A very simple build script for Vercel
import { execSync } from 'child_process';
import fs from 'fs';

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

try {
  console.log('Starting simple build process...');
  
  // Create a simple index.html file
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mobile Taboo</title>
    <style>
      body { margin: 0; padding: 0; font-family: sans-serif; }
      #root { height: 100vh; display: flex; justify-content: center; align-items: center; }
    </style>
  </head>
  <body>
    <div id="root">
      <h1>Mobile Taboo</h1>
      <p>Loading application...</p>
    </div>
    <script>
      // Simple script to redirect to a static version
      window.location.href = 'https://taboo-game-static.vercel.app/';
    </script>
  </body>
</html>`;
  
  fs.writeFileSync('dist/index.html', htmlContent);
  
  console.log('Simple build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
