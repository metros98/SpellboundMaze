// Audio helpers module
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioCtx ? new AudioCtx() : null;
export function playBeep(freq=440,duration=0.15){
  if(!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  o.connect(g); g.connect(audioCtx.destination);
  g.gain.setValueAtTime(0.0001,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.2,audioCtx.currentTime+0.01);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+duration);
  o.stop(audioCtx.currentTime+duration+0.02);
}
export function playSuccessTune(){
  if(!audioCtx) return;
  const notes = [880, 988, 1318];
  let t = audioCtx.currentTime;
  notes.forEach((n,i)=>{
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = n;
    o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.0001,t + i*0.12);
    g.gain.exponentialRampToValueAtTime(0.2,t + i*0.12 + 0.02);
    o.start(t + i*0.12);
    o.stop(t + i*0.12 + 0.12);
  });
}
export function playSad(){ playBeep(220,0.35); }

export function speak(text){
  if('speechSynthesis' in window){
    const s = new SpeechSynthesisUtterance(text);
    speechSynthesis.cancel();
    speechSynthesis.speak(s);
  }
}
