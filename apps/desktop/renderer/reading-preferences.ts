import {useEffect,useState} from 'react';
import {readingMotionEvent} from './reading-motion';
type ReadingPreferences={size:number;spaced:boolean;still:boolean};
const event='jective-reading-preferences',sizes=[16,18,20,24];
function storedPreferences():ReadingPreferences{try{const size=Number(localStorage.getItem('jective-reading-size'));return {size:sizes.includes(size)?size:18,spaced:localStorage.getItem('jective-reading-space')==='true',still:localStorage.getItem('jective-reading-still')==='true'};}catch{return {size:18,spaced:false,still:false};}}
let current=storedPreferences();
function apply(){document.body.style.setProperty('--reading-size',current.size+'px');document.body.dataset.readingSpace=String(current.spaced);document.body.dataset.readingStill=String(current.still);window.dispatchEvent(new Event(readingMotionEvent));}
export function updateReadingPreferences(patch:Partial<ReadingPreferences>){
 const next={...current,...patch};if(!sizes.includes(next.size)||typeof next.spaced!=='boolean'||typeof next.still!=='boolean')return;
 current=next;try{localStorage.setItem('jective-reading-size',String(next.size));localStorage.setItem('jective-reading-space',String(next.spaced));localStorage.setItem('jective-reading-still',String(next.still));}catch{/* Keep a usable in-memory setting when storage is unavailable. */}
 apply();window.dispatchEvent(new Event(event));
}
export function useReadingPreferences(){
 const [value,setValue]=useState(current);
 useEffect(()=>{const update=()=>setValue(current);window.addEventListener(event,update);apply();return()=>window.removeEventListener(event,update);},[]);
 return value;
}
