import { playBeep, playSuccessTune, playSad, speak } from './audio.js';
import { shuffle, getReachableCells, generateMaze, openUpMaze, getTraversalPath } from './levelGen.js';

// Theme color definitions
const THEME_COLORS = {
  forest: { floor: '#e8f5e9', wall: '#558b2f', border: '#a5d6a7' },
  ocean: { floor: '#e1f5fe', wall: '#0277bd', border: '#81d4fa' },
  candy: { floor: '#fce4ec', wall: '#c2185b', border: '#f8bbd0' },
  space: { floor: '#e8eaf6', wall: '#3949ab', border: '#9fa8da' },
  sunset: { floor: '#FFE4D6', wall: '#8B4A6B', border: '#FF6B4A' },
  castle: { floor: '#E8ECF0', wall: '#4A5568', border: '#D4AF37 ' }
};

// Game core: stateful module that manages grid, player, letters, and rendering
const config = {
  retriesDefault: 1,
  baseCols: 10,
  baseRows: 6,
  mazeOpenness: 0.22,
  minLetterSpacing: 3,
  cellSize: 64,
  canvasWidth: 800,
  canvasHeight: 480,
  playerAvatar: '🙂',
  mazeTheme: 'forest',
  mazeColors: THEME_COLORS.forest,
  difficulty: 'easy' // easy, medium, hard
};

let ui = null;
let canvas = null, ctx = null;
let words = [];
let currentWordIndex = 0;
let attemptsLeft = config.retriesDefault;
let grid = [];
let player = {x:0,y:0};
let letterTiles = [];
let collected = '';
let running = false;
let hideWordText = true;
let keyHandler = null;
let rafId = null;
let clickHandler = null;

export function setConfig(partial){ 
  Object.assign(config, partial); 
  if(partial.mazeTheme && THEME_COLORS[partial.mazeTheme]){
    config.mazeColors = THEME_COLORS[partial.mazeTheme];
  }
  // Load custom avatar image if URL is provided
  if(partial.playerAvatarUrl && !config.playerAvatarImage) {
    const img = new Image();
    img.onload = () => {
      config.playerAvatarImage = img;
    };
    img.src = partial.playerAvatarUrl;
  } else if(!partial.playerAvatarUrl) {
    // Clear image if switching back to emoji
    config.playerAvatarImage = null;
  }
}
export function setWords(w){ words = w || []; if(ui) ui.enableStart && ui.enableStart(true); }
export function getState(){ return {words, currentWordIndex, attemptsLeft, grid, player, letterTiles, collected, running}; }

export function retryWord(){
  collected = '';
  prepareLevelFor(words[currentWordIndex] || '');
  if(ui) ui.updateDisplays && ui.updateDisplays({word: words[currentWordIndex]||'', collected, hideWordText, attemptsLeft});
}

export function hearWord(){
  if(words[currentWordIndex]) speak(words[currentWordIndex]);
}

function setupCanvas(canvasOrId){
  if(typeof canvasOrId === 'string'){
    canvas = document.getElementById(canvasOrId);
  } else {
    canvas = canvasOrId;
  }
  if(!canvas) return;
  ctx = canvas.getContext('2d');
  canvas.width = config.canvasWidth;
  canvas.height = config.canvasHeight;
}

export function init(opts={}){
  ui = opts.ui || null;
  if(opts.config) setConfig(opts.config);
  setupCanvas(opts.canvas || opts.canvasId || 'gameCanvas');

  // Remove old keyHandler if it exists to prevent double-registration
  if(keyHandler) window.removeEventListener('keydown', keyHandler);
  if(clickHandler && canvas) canvas.removeEventListener('click', clickHandler);

  keyHandler = (e)=>{
    if(!running) return;
    const key = e.key;
    let dx=0, dy=0;
    if(key === 'ArrowUp' || key === 'w' || key === 'W') dy=-1;
    if(key === 'ArrowDown' || key === 's' || key === 'S') dy=1;
    if(key === 'ArrowLeft' || key === 'a' || key === 'A') dx=-1;
    if(key === 'ArrowRight' || key === 'd' || key === 'D') dx=1;
    if(dx!==0 || dy!==0){
      const nx = player.x + dx;
      const ny = player.y + dy;
      if(nx>=0 && nx<grid[0].length && ny>=0 && ny<grid.length && grid[ny][nx]===0){
        player.x = nx; player.y = ny;
      }
      e.preventDefault();
    }
    if(key === ' ' || key === 'Spacebar' || key === 'Enter'){
      attemptCollect();
      e.preventDefault();
    }
  };

  window.addEventListener('keydown', keyHandler);

  clickHandler = (e)=>{
    if(!running) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Calculate offsets (SAME as in draw function)
    const cols = grid[0] ? grid[0].length : config.baseCols*2+1;
    const rows = grid.length || config.baseRows*2+1;
    const cs = Math.max(8, Math.min(config.cellSize, Math.floor((canvas.width-40)/cols), Math.floor((canvas.height-40)/rows)));
    const mazeWidth = cols * cs;
    const mazeHeight = rows * cs;
    const offsetX = Math.floor((canvas.width - mazeWidth) / 2);
    const offsetY = Math.floor((canvas.height - mazeHeight) / 2);

    // Check if click is on a letter tile
    for(const tile of letterTiles){
      const gx = tile.x * cs + offsetX;
      const gy = tile.y * cs + offsetY;
      if(clickX >= gx && clickX <= gx + cs && clickY >= gy && clickY <= gy + cs){
        // Move player to this tile and collect
        player.x = tile.x;
        player.y = tile.y;
        attemptCollect();
        return;
      }
    }
  };

  if(canvas) canvas.addEventListener('click', clickHandler);

  draw();
}

export function startGame(){
  attemptsLeft = ui ? (ui.getRetriesValue ? ui.getRetriesValue() : config.retriesDefault) : config.retriesDefault;
  running = true;
  currentWordIndex = 0;
  nextWord();
  rafId = requestAnimationFrame(loop);
}

function nextWord(){
  collected = '';
  if(currentWordIndex >= words.length){
    if(ui) ui.showOverlay && ui.showOverlay('All done! Great job!', 'success');
    running = false;
    return;
  }
  attemptsLeft = ui ? (ui.getRetriesValue ? ui.getRetriesValue() : config.retriesDefault) : config.retriesDefault;
  const word = (words[currentWordIndex]||'').trim();
  if(!word){ currentWordIndex++; nextWord(); return; }
  prepareLevelFor(word);
  if(ui) ui.updateDisplays && ui.updateDisplays({word: words[currentWordIndex]||'', collected, hideWordText, attemptsLeft});
  speak(word);
}

function getRandomLetters(count, excludeWord) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const result = [];
  
  for(let i = 0; i < count; i++) {
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    result.push(randomLetter);
  }
  
  return result;
}

function prepareLevelFor(word){
  let maze = generateMaze(config.baseCols, config.baseRows);
  maze = openUpMaze(maze, config.mazeOpenness);
  grid = maze;
  player.x = 1; player.y = 1;
  if(grid[player.y] && grid[player.y][player.x] === 1){
    outer: for(let y=0;y<grid.length;y++){
      for(let x=0;x<grid[0].length;x++){
        if(grid[y][x]===0){ player.x = x; player.y = y; break outer; }
      }
    }
  }
  const letters = word.split('');
  
  // Add extra letters based on difficulty
  let extraLetterCount = 0;
  if(config.difficulty === 'medium') extraLetterCount = 2;
  if(config.difficulty === 'hard') extraLetterCount = 5;
  
  const extraLetters = extraLetterCount > 0 ? getRandomLetters(extraLetterCount, word) : [];
  const allLetters = [...letters, ...extraLetters];
  
  letterTiles = [];
  hideWordText = true;

  let reachable = getReachableCells(grid, player.x, player.y).filter(c => !(c.x===player.x && c.y===player.y));
  const traversal = getTraversalPath(grid, player.x, player.y).filter(c => !(c.x===player.x && c.y===player.y));
  let placementCells = traversal;
  if(placementCells.length < allLetters.length){
    placementCells = reachable;
    if(placementCells.length < allLetters.length){
      for(let y=0;y<grid.length && placementCells.length<allLetters.length;y++){
        for(let x=0;x<grid[0].length && placementCells.length<allLetters.length;x++){
          if(grid[y][x]===1){ grid[y][x]=0; }
        }
      }
      placementCells = getReachableCells(grid, player.x, player.y).filter(c => !(c.x===player.x && c.y===player.y));
    }
  }

  const L = placementCells.length;
  if(L >= allLetters.length){
    const minSpacing = Math.max(0, Math.floor(config.minLetterSpacing));
    const feasible = (allLetters.length <= 1) || ((allLetters.length - 1) * minSpacing <= (L - 1));
    if(minSpacing > 0 && feasible){
      const chosenIndices = [];
      for(let i=0;i<allLetters.length;i++){
        const remaining = allLetters.length - i - 1;
        const minIndex = (i === 0) ? 0 : (chosenIndices[chosenIndices.length-1] + minSpacing);
        const maxIndex = L - 1 - (remaining * minSpacing);
        let idx = minIndex;
        if(maxIndex > minIndex){ idx = minIndex + Math.floor(Math.random() * (maxIndex - minIndex + 1)); }
        idx = Math.max(0, Math.min(L-1, idx));
        chosenIndices.push(idx);
      }
      const used = new Set();
      // Place word letters first
      for(let k=0;k<letters.length;k++){
        let idx = chosenIndices[k];
        let tries = 0;
        while(used.has(idx) && tries < L){ idx = Math.min(L-1, idx+1); tries++; }
        if(used.has(idx)){
          for(let s=0;s<L;s++) if(!used.has(s)){ idx = s; break; }
        }
        used.add(idx);
        const cell = placementCells[idx];
        letterTiles.push({x:cell.x, y:cell.y, char:letters[k], isWordLetter: true});
      }
      // Then place extra letters
      for(let k=0;k<extraLetters.length;k++){
        let idx = chosenIndices[letters.length + k];
        let tries = 0;
        while(used.has(idx) && tries < L){ idx = Math.min(L-1, idx+1); tries++; }
        if(used.has(idx)){
          for(let s=0;s<L;s++) if(!used.has(s)){ idx = s; break; }
        }
        used.add(idx);
        const cell = placementCells[idx];
        letterTiles.push({x:cell.x, y:cell.y, char:extraLetters[k], isWordLetter: false});
      }
    } else {
      const spacing = Math.max(1, Math.floor(L / (allLetters.length + 1)));
      const usedIndices = new Set();
      // Place word letters
      for(let i=0;i<letters.length;i++){
        const base = (i+1)*spacing;
        const jitter = Math.floor((Math.random()-0.5) * Math.max(1, Math.floor(spacing/2)));
        let idx = Math.max(0, Math.min(L-1, base + jitter));
        let tries = 0;
        while(usedIndices.has(idx) && tries < L){ idx = (idx + 1) % L; tries++; }
        usedIndices.add(idx);
        const cell = placementCells[idx];
        letterTiles.push({x:cell.x, y:cell.y, char:letters[i], isWordLetter: true});
      }
      // Place extra letters
      for(let i=0;i<extraLetters.length;i++){
        const base = (letters.length + i + 1)*spacing;
        const jitter = Math.floor((Math.random()-0.5) * Math.max(1, Math.floor(spacing/2)));
        let idx = Math.max(0, Math.min(L-1, base + jitter));
        let tries = 0;
        while(usedIndices.has(idx) && tries < L){ idx = (idx + 1) % L; tries++; }
        usedIndices.add(idx);
        const cell = placementCells[idx];
        letterTiles.push({x:cell.x, y:cell.y, char:extraLetters[i], isWordLetter: false});
      }
    }
  } else {
    shuffle(reachable);
    for(let i=0;i<letters.length && i<reachable.length;i++){
      letterTiles.push({x:reachable[i].x, y:reachable[i].y, char:letters[i], isWordLetter: true});
    }
    for(let i=0;i<extraLetters.length && (letters.length + i)<reachable.length;i++){
      letterTiles.push({x:reachable[letters.length + i].x, y:reachable[letters.length + i].y, char:extraLetters[i], isWordLetter: false});
    }
  }
}

function attemptCollect(){
  const idx = letterTiles.findIndex(t=>t.x===player.x && t.y===player.y);
  if(idx===-1) return;
  const tile = letterTiles[idx];
  const currentWord = words[currentWordIndex] || '';
  const nextChar = currentWord[collected.length];
  if(tile.char.toLowerCase() === nextChar.toLowerCase()){
    collected += tile.char;
    letterTiles.splice(idx,1);
    playBeep(880,0.08);
    hideWordText = false;
    if(collected.length >= currentWord.length){
      playSuccessTune();
      if(ui) ui.showOverlay && ui.showOverlay('✔️ Great! Next word', 'success');
      currentWordIndex++;
      hideWordText = true;
      if(ui) ui.updateDisplays && ui.updateDisplays({word: words[currentWordIndex]||'', collected: '', hideWordText, attemptsLeft});
      setTimeout(()=>{ nextWord(); }, 1200);
      return;
    }
    if(ui) ui.updateDisplays && ui.updateDisplays({word: words[currentWordIndex]||'', collected, hideWordText, attemptsLeft});
  } else {
    attemptsLeft--;
    playBeep(220,0.18);
    if(attemptsLeft <= 0){
      playSad();
      if(ui) ui.showOverlay && ui.showOverlay('✖️ Out of attempts — moving on', 'fail');
      currentWordIndex++;
      hideWordText = true;
      if(ui) ui.updateDisplays && ui.updateDisplays({word: words[currentWordIndex]||'', collected: '', hideWordText, attemptsLeft});
      setTimeout(()=>{ nextWord(); }, 1400);
      return;
    } else {
      if(ui) ui.showOverlay && ui.showOverlay('Try again', 'fail');
      collected = '';
      prepareLevelFor(words[currentWordIndex] || '');
    }
  }
}

function loop(){
  draw();
  if(running) rafId = requestAnimationFrame(loop);
}

function draw(){
  if(!ctx) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const cols = grid[0] ? grid[0].length : config.baseCols*2+1;
  const rows = grid.length || config.baseRows*2+1;
  const cs = Math.max(8, Math.min(config.cellSize, Math.floor((canvas.width-40)/cols), Math.floor((canvas.height-40)/rows)));
  
  // Center the maze by calculating offset based on actual maze size
  const mazeWidth = cols * cs;
  const mazeHeight = rows * cs;
  const offsetX = Math.floor((canvas.width - mazeWidth) / 2);
  const offsetY = Math.floor((canvas.height - mazeHeight) / 2);
  
  for(let y=0;y<rows;y++){
  for(let x=0;x<cols;x++){
    const gx = x*cs + offsetX;
    const gy = y*cs + offsetY;
    
    if(grid[y] && grid[y][x]===1){
      // Draw solid wall block with brick-like appearance
      ctx.fillStyle = config.mazeColors.wall;
      ctx.fillRect(gx, gy, cs-2, cs-2);
      
      // Add darker border for depth
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, cs-2, cs-2);
      ctx.lineWidth = 1;
      
      // Add highlight on top-left for 3D effect
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.moveTo(gx+1, gy+cs-3);
      ctx.lineTo(gx+1, gy+1);
      ctx.lineTo(gx+cs-3, gy+1);
      ctx.stroke();
    } else {
      // Draw floor tile
      ctx.fillStyle = config.mazeColors.floor;
      ctx.fillRect(gx, gy, cs-2, cs-2);
      
      // Subtle border for floor
      ctx.strokeStyle = config.mazeColors.border;
      ctx.strokeRect(gx, gy, cs-2, cs-2);
    }
  }
}
  for(const t of letterTiles){
    const gx = t.x*cs + offsetX;
    const gy = t.y*cs + offsetY;
    // Just draw the letter without background
    ctx.fillStyle = '#333';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.char.toUpperCase(), gx + (cs-4)/2, gy + (cs-4)/2);
  }
  const underIdx = letterTiles.findIndex(t=>t.x===player.x && t.y===player.y);
  if(underIdx !== -1){
    const gx = player.x*cs + offsetX;
    const gy = player.y*cs + offsetY;
    ctx.strokeStyle = '#ffb020';
    ctx.lineWidth = 3;
    ctx.strokeRect(gx+4, gy+4, cs-8, cs-8);
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255,176,32,0.12)';
    ctx.fillRect(gx+4, gy+4, cs-8, cs-8);
    ctx.fillStyle = '#222'; ctx.font = '13px system-ui'; ctx.textAlign='center';
    ctx.fillText('Press Space to pick', gx + (cs-4)/2, gy + cs - 6);
  }
  // Draw player avatar (emoji or custom image)
  const px = player.x*cs + offsetX + (cs-4)/2;
  const py = player.y*cs + offsetY + (cs-4)/2;
  
  if(config.playerAvatarUrl && config.playerAvatarImage) {
    // Draw custom avatar image
    const size = 40;
    ctx.drawImage(config.playerAvatarImage, px - size/2, py - size/2, size, size);
  } else {
    // Draw emoji avatar
    ctx.font = '32px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(config.playerAvatar || '🙂', px, py);
  }
}

export function stop(){
  running = false;
  if(rafId) cancelAnimationFrame(rafId);
  if(keyHandler) window.removeEventListener('keydown', keyHandler);
  keyHandler = null;
  if(clickHandler && canvas) canvas.removeEventListener('click', clickHandler);
  clickHandler = null;
}

export default {
  init,
  startGame,
  setWords,
  setConfig,
  getState,
  retryWord,
  hearWord,
  stop
};
