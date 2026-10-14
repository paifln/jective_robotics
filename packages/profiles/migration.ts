import {validateImportedProfile} from './exchange';
import {profileHash} from './registry';
import {validateWiring,type BoardProfile} from './index';
export function reviewProfileMigration(previous:BoardProfile,next:BoardProfile,componentId:string,wiring:Record<string,number|null>){
 const from=validateImportedProfile(previous),to=validateImportedProfile(next);if(from.id!==to.id)throw new Error('PROFILE_MIGRATION_ID_MISMATCH');
 const changedFields:string[]=[];for(const field of ['version','name','fqbn','core','coreVersion','provisional','ledPin','provenance','baudRate','voltage'] as const)if(from[field]!==to[field])changedFields.push(field);
 const pinChanges:{gpio:number;change:'added'|'removed'|'changed'}[]=[];for(const gpio of [...new Set([...from.pins,...to.pins].map(p=>p.gpio))].sort((a,b)=>a-b)){const old=from.pins.find(p=>p.gpio===gpio),current=to.pins.find(p=>p.gpio===gpio);if(!old)pinChanges.push({gpio,change:'added'});else if(!current)pinChanges.push({gpio,change:'removed'});else if(JSON.stringify(old)!==JSON.stringify(current))pinChanges.push({gpio,change:'changed'});}
 const issues=validateWiring(to,componentId,wiring);return {profileId:from.id,previousVersion:from.version,nextVersion:to.version,previousHash:profileHash(from),nextHash:profileHash(to),changedFields,pinChanges,wiring:{...wiring},issues,blocked:issues.some(i=>i.blocking),physicalVerification:'NOT RUN' as const};
}
