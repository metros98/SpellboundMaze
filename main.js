// Simple Spelling Game - main.js
// Config
const config = {
  retriesDefault: 1,
  baseCols: 10,
  baseRows: 6,
  // percent openness: after maze generation, randomly remove this fraction of wall cells to make
  // the maze less dense (0.0 = full maze, 0.5 = fairly open)
  mazeOpenness: 0.22,
  // minimum traversal index spacing between placed letters (in cells along traversal path)
  // increase to force letters to be farther apart; set to 0 to disable
  minLetterSpacing: 3,
  cellSize: 64,
  canvasWidth: 800,
  canvasHeight: 480
};

import { initUI } from './src/ui.js';
import gameCore from './src/gameCore.js';

// UI module will manage DOM elements; `ui` is initialized below
let ui = null;

// Initialize UI and wire controls (delegated to UI module), using gameCore API
ui = initUI({
  onStart: ()=>{ gameCore.startGame(); },
  onRetry: ()=>{ gameCore.retryWord(); },
  onHear: ()=>{ gameCore.hearWord(); },
  onMinSpacingChange: (v)=>{ gameCore.setConfig({minLetterSpacing: Number.isNaN(v) ? 0 : v}); }
});
if(ui) ui.setMinSpacing(Number.isFinite(config.minLetterSpacing) ? config.minLetterSpacing : 0);

// Initialize game core (canvas + input handling)
gameCore.init({ canvasId: 'gameCanvas', ui, config });

// Initialization: load words.txt then pass to game core and enable UI
fetch('words.txt').then(r=>r.text()).then(t=>{
  const words = t.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  gameCore.setWords(words);
  if(ui) ui.setMinSpacing(Number.isFinite(config.minLetterSpacing) ? config.minLetterSpacing : 0);
}).catch(()=>{
  // fallback example
  const words = ['apple','banana','would'];
  gameCore.setWords(words);
  if(ui) ui.setMinSpacing(Number.isFinite(config.minLetterSpacing) ? config.minLetterSpacing : 0);
});
