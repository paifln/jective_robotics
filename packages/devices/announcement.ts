import {FrameSchema} from './protocol';
import type {SerialEvent} from '../contracts';
export const runtimeAnnouncementRequirements={firmware:'0.1.0',capabilities:['motor-limited','heartbeat-challenge']} as const;
export type AnnouncementStatus={state:'closed'|'not-observed'|'invalid-protocol'|'matching-announcement'|'incompatible-announcement';issues:('firmware'|'profile'|'capabilities')[];firmware?:string;profile?:string};
/** Checks a self-reported hello only. It grants no authority and proves no physical identity. */
export function inspectAnnouncement(value:unknown,expectedProfile:string):AnnouncementStatus|null{
 const parsed=FrameSchema.safeParse(value);if(!parsed.success)return {state:'invalid-protocol',issues:[]};const frame=parsed.data;if(frame.type!=='hello')return null;
 const issues:AnnouncementStatus['issues']=[];if(frame.firmware!==runtimeAnnouncementRequirements.firmware)issues.push('firmware');if(frame.profile!==expectedProfile)issues.push('profile');if(!runtimeAnnouncementRequirements.capabilities.every(c=>frame.capabilities.includes(c)))issues.push('capabilities');
 return {state:issues.length?'incompatible-announcement':'matching-announcement',issues,firmware:frame.firmware,profile:frame.profile};
}
/** Scope evidence to the newest observed connection for the selected port; never borrow another port/session. */
export function connectionAnnouncement(events:readonly SerialEvent[],port:string|null,expectedProfile:string):AnnouncementStatus{
 if(!port)return {state:'closed',issues:[]};const recent=events.slice(-1000),connection=[...recent].reverse().find(e=>e.connection?.port===port)?.connection;if(!connection)return {state:'not-observed',issues:[]};let result:AnnouncementStatus={state:'not-observed',issues:[]};
 for(const event of recent){if(event.connection?.id!==connection.id||event.connection?.port!==port)continue;
  if(event.kind==='status'&&event.text.startsWith('Serial disconnected')){result={state:'closed',issues:[]};continue;}
  if(result.state==='closed')continue;
  if(event.kind==='error'&&event.text.startsWith('PROTOCOL_INVALID')){result={state:'invalid-protocol',issues:[]};continue;}
  if(event.kind!=='protocol')continue;
  try{const next=inspectAnnouncement(JSON.parse(event.text),expectedProfile);if(next)result=next;}catch{result={state:'invalid-protocol',issues:[]};}
 }
 return result;
}
