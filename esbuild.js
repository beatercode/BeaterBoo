// esbuild.js - Direct esbuild script for Vercel deployment
import * as esbuild from 'esbuild';
import { copy } from 'fs-extra';
import { resolve, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist', { recursive: true });
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
    
    // Create a simple HTML file
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mobile Taboo</title>
    <link rel="stylesheet" href="/assets/index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`;
    
    writeFileSync('dist/index.html', htmlContent);
    
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
