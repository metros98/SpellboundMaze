// Adapter that dynamically imports the legacy gameCore and exposes a small API
type Callbacks = {
  onUpdate?: (state: any)=>void;
  onOverlay?: (text: string, kind?: string)=>void;
  getRetries?: ()=>number;
  onEnableStart?: (enabled: boolean)=>void;
};

let gameCore: any = null;
let uiAdapter: any = null;

async function ensureLoaded(){
  if(gameCore) return gameCore;
  // import local copy bundled with the React app
  const mod = await import('./gameCore');
  gameCore = (mod && (mod.default || mod));
  return gameCore;
}

function makeUiAdapter(callbacks: Callbacks){
  return {
    updateDisplays: (state: any)=>{ if(callbacks.onUpdate) callbacks.onUpdate(state); },
    showOverlay: (text: string, kind='info')=>{ if(callbacks.onOverlay) callbacks.onOverlay(text, kind); },
    getRetriesValue: ()=>{ return callbacks.getRetries ? callbacks.getRetries() : 1; },
    setMinSpacing: (_v: number)=>{},
    enableStart: (b: boolean)=>{ if(callbacks.onEnableStart) callbacks.onEnableStart(b); }
  };
}

export async function init(canvas: HTMLCanvasElement, callbacks: Callbacks = {}, config?: any){
  const core = await ensureLoaded();
  uiAdapter = makeUiAdapter(callbacks);
  // Pass the canvas element directly instead of relying on getElementById
  core.init({ canvas, ui: uiAdapter, config: config || {} });
  return core;
}

export async function setWords(words: string[]){
  const core = await ensureLoaded();
  core.setWords(words);
}

export async function start(){
  const core = await ensureLoaded();
  if(core && core.startGame) core.startGame();
}

export async function retry(){
  const core = await ensureLoaded();
  if(core && core.retryWord) core.retryWord();
}

export async function hear(){
  const core = await ensureLoaded();
  if(core && core.hearWord) core.hearWord();
}

export async function setConfig(cfg: any){
  const core = await ensureLoaded();
  if(core && core.setConfig) core.setConfig(cfg);
}

export async function stop(){
  const core = await ensureLoaded();
  if(core && core.stop) core.stop();
}

export default { init, setWords, start, retry, hear, setConfig, stop };
