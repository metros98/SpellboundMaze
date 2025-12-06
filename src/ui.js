// UI module: manages DOM elements and control wiring
let hearBtn, retryBtn, startBtn, retriesInput, minSpacingInput, wordDisplay, revealDiv, attemptsDisplay, overlay;

export function initUI(callbacks={}){
  hearBtn = document.getElementById('hearBtn');
  retryBtn = document.getElementById('retryBtn');
  startBtn = document.getElementById('startBtn');
  retriesInput = document.getElementById('retriesInput');
  minSpacingInput = document.getElementById('minSpacingInput');
  wordDisplay = document.getElementById('wordDisplay');
  revealDiv = document.getElementById('reveal');
  attemptsDisplay = document.getElementById('attemptsDisplay');
  overlay = document.getElementById('overlay');

  if(hearBtn) hearBtn.addEventListener('click', ()=>{ if(callbacks.onHear) callbacks.onHear(); });
  if(retryBtn) retryBtn.addEventListener('click', ()=>{ if(callbacks.onRetry) callbacks.onRetry(); });
  if(startBtn) startBtn.addEventListener('click', ()=>{ if(callbacks.onStart) callbacks.onStart(); });
  if(minSpacingInput) minSpacingInput.addEventListener('change', ()=>{
    const v = parseInt(minSpacingInput.value, 10);
    if(callbacks.onMinSpacingChange) callbacks.onMinSpacingChange(Number.isNaN(v) ? 0 : v);
  });

  return {
    updateDisplays: ({word='', collected='', hideWordText=true, attemptsLeft=0}) => {
      if(!wordDisplay || !attemptsDisplay) return;
      if(!hideWordText){
        let display = '';
        for(let i=0;i<word.length;i++){
          display += (i < collected.length) ? word[i] : '_';
          display += ' ';
        }
        wordDisplay.textContent = display.trim();
        if(revealDiv) revealDiv.classList.remove('hidden');
      } else {
        if(revealDiv) revealDiv.classList.add('hidden');
        wordDisplay.textContent = '';
      }
      attemptsDisplay.textContent = `Attempts left: ${attemptsLeft}`;
    },
    showOverlay: (text, type) => {
      if(!overlay) return;
      overlay.textContent = text;
      overlay.className = '';
      overlay.classList.add(type==='success' ? 'success' : type==='fail' ? 'fail' : '');
      overlay.classList.remove('hidden');
      setTimeout(()=>{ overlay.classList.add('hidden'); }, 1400);
    },
    getRetriesValue: ()=>{ return parseInt(retriesInput.value,10) || 0; },
    enableStart: (enabled)=>{ if(startBtn) startBtn.disabled = !enabled; },
    setMinSpacing: (v)=>{ if(minSpacingInput) minSpacingInput.value = v; }
  };
}
