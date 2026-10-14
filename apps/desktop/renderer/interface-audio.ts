type Cue='launch'|'click'|'correct'|'retry';
let context:AudioContext|undefined;
let enabled=true;try{enabled=localStorage.getItem('jective-sound')!=='off';}catch{/* Storage can be unavailable during startup. */}
export function soundEnabled(){return enabled;}
export function setSoundEnabled(value:boolean){enabled=value;try{localStorage.setItem('jective-sound',value?'on':'off');}catch{/* Keep this session's setting. */}if(!value&&context){const previous=context;context=undefined;void previous.close().catch(()=>{});document.documentElement.dataset.audioState='muted';}}
let lastClick=0;
export async function playCue(cue:Cue){
 if(!enabled)return;if(cue==='click'){if(performance.now()-lastClick<80)return;lastClick=performance.now();}
 try{const active=context??=new AudioContext();await active.resume();if(!enabled||active!==context)return;
 const notes=cue==='launch'?[293.66,440,587.33,739.99]:cue==='correct'?[587.33,739.99,880]:cue==='retry'?[392,349.23]:[640];
 const duration=cue==='click'?.06:cue==='launch'?.85:.42;const start=active.currentTime;
 // A soft fundamental with a quiet bell overtone; tiny cues have no reverb tail.
 notes.forEach((hz,i)=>{
  const time=start+i*(cue==='launch'?.16:.095),gain=active.createGain(),filter=active.createBiquadFilter();
  filter.type='lowpass';filter.frequency.value=cue==='click'?1800:3200;
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(cue==='click'?.015:.032,time+.018);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  gain.connect(filter);filter.connect(active.destination);
  const voices=[1,2.005].map((ratio,index)=>{const oscillator=active.createOscillator(),level=active.createGain();oscillator.type=index?'sine':'triangle';oscillator.frequency.setValueAtTime(hz*ratio,time);oscillator.frequency.exponentialRampToValueAtTime(hz*ratio*(cue==='click'?.65:1),time+duration);level.gain.value=index?.14:.7;oscillator.connect(level);level.connect(gain);oscillator.start(time);oscillator.stop(time+duration+.03);return {oscillator,level};});
  let ended=0;voices.forEach(({oscillator,level})=>{oscillator.onended=()=>{oscillator.disconnect();level.disconnect();if(++ended===voices.length){gain.disconnect();filter.disconnect();}};});
 });
 document.documentElement.dataset.audioState=context.state;document.documentElement.dataset.audioEvents=String(Number(document.documentElement.dataset.audioEvents??0)+1);
 }catch{document.documentElement.dataset.audioState='unavailable';}
}
export function attachInterfaceAudio(){const click=(event:MouseEvent)=>{const button=(event.target as Element).closest?.('button');if(button&&!button.disabled&&!button.hasAttribute('data-sound-toggle'))void playCue('click');};document.addEventListener('click',click);void playCue('launch');return()=>document.removeEventListener('click',click);}
