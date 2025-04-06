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
    <title>BeaterBoo | Adv Taboo</title>
    <style>
      body { 
        margin: 0; 
        padding: 0; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        background-color: #f5f5f5;
        color: #333;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        text-align: center;
      }
      h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        color: #2563eb;
      }
      p {
        font-size: 1.2rem;
        line-height: 1.6;
        margin-bottom: 2rem;
      }
      .card {
        background-color: white;
        border-radius: 8px;
        padding: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
      }
      .word {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 1rem;
        color: #2563eb;
      }
      .taboo-words {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .taboo-word {
        background-color: #fee2e2;
        color: #ef4444;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Mobile Taboo</h1>
      <p>Benvenuto al gioco di Taboo! Ecco alcune carte di esempio:</p>
      
      <div class="card">
        <div class="word">Pizza</div>
        <div class="taboo-words">
          <div class="taboo-word">Formaggio</div>
          <div class="taboo-word">Pomodoro</div>
          <div class="taboo-word">Italia</div>
          <div class="taboo-word">Forno</div>
          <div class="taboo-word">Margherita</div>
        </div>
      </div>
      
      <div class="card">
        <div class="word">Calcio</div>
        <div class="taboo-words">
          <div class="taboo-word">Pallone</div>
          <div class="taboo-word">Squadra</div>
          <div class="taboo-word">Gol</div>
          <div class="taboo-word">Stadio</div>
          <div class="taboo-word">Giocatore</div>
        </div>
      </div>
      
      <div class="card">
        <div class="word">Venezia</div>
        <div class="taboo-words">
          <div class="taboo-word">Canale</div>
          <div class="taboo-word">Gondola</div>
          <div class="taboo-word">Italia</div>
          <div class="taboo-word">Acqua</div>
          <div class="taboo-word">Carnevale</div>
        </div>
      </div>
      
      <p>Questa è una versione statica dell'app. L'applicazione completa è in fase di sviluppo.</p>
    </div>
  </body>
</html>`;
  
  fs.writeFileSync('dist/index.html', htmlContent);
  
  console.log('Simple build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
