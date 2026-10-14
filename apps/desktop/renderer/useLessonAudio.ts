import {useEffect,useRef,useState} from 'react';
import type {Locale} from './locale';

/** Offline catalog and media lifecycle; no synthesis or provider requests. */
export function useLessonAudio(id:string,locale:Locale){
 const audio=useRef<HTMLAudioElement>(null),epoch=useRef(0);
 const [speed,setSpeed]=useState(1),[failed,setFailed]=useState(false),[playing,setPlaying]=useState(false),[available,setAvailable]=useState(false);
 useEffect(()=>{
  const token=++epoch.current,request=new AbortController();
  setAvailable(false);setFailed(false);setPlaying(false);audio.current?.pause();
  void fetch('learning/audio/index.json',{signal:request.signal}).then(response=>{
   if(!response.ok)throw new Error('AUDIO_INDEX_UNAVAILABLE');return response.json();
  }).then((value:unknown)=>{
   if(token!==epoch.current||!value||typeof value!=='object')return;
   const entries=(value as Record<string,unknown>)[locale];
   setAvailable(Array.isArray(entries)&&entries.includes(id)&&/^[FL]\d{2}$/.test(id));
  }).catch(()=>{});
  return()=>{epoch.current++;request.abort();audio.current?.pause();};
 },[id,locale]);
 useEffect(()=>{
  const stop=()=>{if(document.hidden||document.documentElement.dataset.windowHidden==='true')audio.current?.pause();};
  document.addEventListener('visibilitychange',stop);window.addEventListener('jective-window-visibility',stop);
  return()=>{document.removeEventListener('visibilitychange',stop);window.removeEventListener('jective-window-visibility',stop);};
 },[]);
 function toggle(){
  const player=audio.current,token=epoch.current;if(!player)return;
  if(!player.paused){player.pause();return;}setFailed(false);
  void player.play().catch(()=>{if(token===epoch.current&&audio.current===player)setFailed(true);});
 }
 function changeSpeed(rate:number){setSpeed(rate);if(audio.current)audio.current.playbackRate=rate;}
 return {audio,speed,failed,playing,available,toggle,changeSpeed,setFailed,setPlaying};
}
