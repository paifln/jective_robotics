import {useEffect,useState} from 'react';
import {profiles} from '../../../packages/profiles';
import {BOARD_PROFILES_CHANGED,refreshBoardProfiles} from './board-profile-events';

/** Keep the last valid list; ignore late responses after navigation or unmount. */
export function useBoardProfiles(section:string){
 const [available,setAvailable]=useState(profiles),[failed,setFailed]=useState(false);
 useEffect(()=>{
  let active=true,sequence=0;
  const refresh=()=>{const request=++sequence;void window.jective.boardProfiles().then(result=>{
   if(!active||request!==sequence)return;
   if(result.ok){setAvailable(result.value);setFailed(false);}else setFailed(true);
  }).catch(()=>{if(active&&request===sequence)setFailed(true);});};
  refresh();window.addEventListener(BOARD_PROFILES_CHANGED,refresh);
  return()=>{active=false;window.removeEventListener(BOARD_PROFILES_CHANGED,refresh);};
 },[section]);
 return {available,failed,retry:refreshBoardProfiles};
}
