// esbuild.js - Direct esbuild script for Vercel deployment
import * as esbuild from 'esbuild';
import { copy } from 'fs-extra';
import { resolve, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from 'fs';

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist', { recursive: true });
}

// Ensure assets directory exists
if (!existsSync('dist/assets')) {
  mkdirSync('dist/assets', { recursive: true });
}

async function build() {
  try {
    console.log('Starting esbuild process...');
    
    // Build the application with esbuild
    await esbuild.build({
      entryPoints: ['src/main.tsx'],
      bundle: true,
      minify: true,
      sourcemap: true,
      outfile: 'dist/assets/index.js',
      format: 'esm',
      target: ['es2020'],
      loader: {
        '.tsx': 'tsx',
        '.ts': 'tsx',
        '.jsx': 'jsx',
        '.js': 'jsx',
        '.css': 'css',
        '.png': 'file',
        '.jpg': 'file',
        '.svg': 'file',
        '.gif': 'file',
      },
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });
    
    // Create a simple HTML file with proper MIME types
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mobile Taboo</title>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/javascript" src="/assets/index.js"></script>
  </body>
</html>`;
    
    writeFileSync('dist/index.html', htmlContent);
    
    // Create a _headers file for Vercel to set proper MIME types
    const headersContent = `/*
  Content-Type: text/html; charset=utf-8
/assets/*
  Content-Type: application/javascript; charset=utf-8
`;
    
    writeFileSync('dist/_headers', headersContent);
    
    // Create a vercel.json file in the dist directory to ensure proper routing
    const vercelDistConfig = {
      "routes": [
        {
          "src": "/assets/(.*)",
          "headers": { "content-type": "application/javascript" },
          "dest": "/assets/$1"
        },
        {
          "src": "/(.*)",
          "dest": "/index.html"
        }
      ]
    };
    
    writeFileSync('dist/vercel.json', JSON.stringify(vercelDistConfig, null, 2));
    
    // Copy public directory if it exists
    if (existsSync('public')) {
      await copy('public', 'dist');
    }
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
