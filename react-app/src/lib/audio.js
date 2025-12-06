// Audio helpers module (copied from legacy)
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
    try{
      // Attempt to apply a saved voice preference (saved in localStorage by Settings)
      const raw = localStorage.getItem('spellingbee:settings:v1');
      const settings = raw ? JSON.parse(raw) : null;
      const pref = settings && settings.voiceId;
      const voices = speechSynthesis.getVoices() || [];
      let chosen = null;

      if(voices.length){
        if(pref){
          // Reserved keywords map to approximate locales
          if(pref === 'friendly') chosen = voices.find(v=>v.lang && v.lang.startsWith('en-US')) || null;
          else if(pref === 'robot') chosen = voices.find(v=>v.lang && v.lang.startsWith('en-GB')) || null;
          else if(pref === 'magical') chosen = voices.find(v=>v.lang && v.lang.startsWith('en-AU')) || null;
          else {
            // Try composite match first (name|voiceURI|lang)
            if(pref.includes('|')){
              const [name, voiceURI, lang] = pref.split('|');
              chosen = voices.find(v => v.name === name && v.voiceURI === voiceURI && v.lang === lang) || null;
            }
            // Fallback: try voiceURI or name match
            if(!chosen){
              chosen = voices.find(v => v.voiceURI === pref || v.name === pref) || null;
            }
          }
        }

        // If still no match, prefer en-US if available, otherwise first voice
        if(!chosen) chosen = voices.find(v=>v.lang && v.lang.startsWith('en-US')) || voices[0];
      }

      if(chosen) {
        s.voice = chosen;
        try{ console.log('[TTS] speak: using voice', { name: chosen.name, voiceURI: chosen.voiceURI, lang: chosen.lang, pref }); }catch(e){}
      } else {
        try{ console.log('[TTS] speak: no matching voice, pref=', pref, 'available voices=', (speechSynthesis.getVoices()||[]).map(v=>v.name)); }catch(e){}
      }
    }catch(e){ /* ignore and fallback */ }
    speechSynthesis.cancel();
    speechSynthesis.speak(s);
  }
}
