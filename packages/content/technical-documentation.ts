import {z} from 'zod';
export const documentationFields=['assembly','operation','calibration','troubleshooting','evidence','limits'] as const;
export const peerAttemptFields=['scope','result','problem','change'] as const;
const text=z.string().max(3000);
export const InstructionsSchema=z.object({assembly:text,operation:text,calibration:text,troubleshooting:text,evidence:text,limits:text}).strict();
export const DocumentationSchema=z.object({original:InstructionsSchema,revised:InstructionsSchema,peer:z.object({scope:text,result:text,problem:text,change:text}).strict()}).strict();
export type Documentation=z.infer<typeof DocumentationSchema>;
const blankInstructions=()=>({assembly:'',operation:'',calibration:'',troubleshooting:'',evidence:'',limits:''});
export const emptyDocumentation=():Documentation=>({original:blankInstructions(),revised:blankInstructions(),peer:{scope:'',result:'',problem:'',change:''}});
export const instructionsComplete=(value:unknown)=>{const doc=InstructionsSchema.parse(value);return documentationFields.every(k=>doc[k].trim().length>=20);};
export function documentationAnswers(value:unknown){const doc=DocumentationSchema.parse(value);return Object.fromEntries([...documentationFields.flatMap(k=>[['original_'+k,doc.original[k]],['revised_'+k,doc.revised[k]]]),...peerAttemptFields.map(k=>['peer_'+k,doc.peer[k]])]) as Record<string,string>;}
export function documentationFromAnswers(value:unknown):Documentation{
 const keys=Object.keys(documentationAnswers(emptyDocumentation())),answers=z.record(z.string(),text).refine(v=>Object.keys(v).every(k=>keys.includes(k)),'UNKNOWN_DOCUMENTATION_FIELD').parse(value),doc=emptyDocumentation();
 for(const key of documentationFields){doc.original[key]=answers['original_'+key]??'';doc.revised[key]=answers['revised_'+key]??'';}for(const key of peerAttemptFields)doc.peer[key]=answers['peer_'+key]??'';
 return DocumentationSchema.parse(doc);
}
export function preserveInstructions(value:unknown):Documentation{
 const doc=DocumentationSchema.parse(value);if(instructionsComplete(doc.original))throw new Error('ORIGINAL_INSTRUCTIONS_ALREADY_PRESERVED');if(!instructionsComplete(doc.revised))throw new Error('INSTRUCTIONS_INCOMPLETE');return {...doc,original:structuredClone(doc.revised)};
}
/** The native learning write must not silently replace the instructions a peer used. */
export function validateDocumentationUpdate(nextValue:unknown,previousValue:unknown){
 const next=DocumentationSchema.parse(nextValue),previous=DocumentationSchema.parse(previousValue);
 if(instructionsComplete(previous.original)&&documentationFields.some(k=>next.original[k]!==previous.original[k]))throw new Error('ORIGINAL_INSTRUCTIONS_IMMUTABLE');
 return next;
}
/** Structural checks only; text and the reported peer attempt require human review. */
export function reviewDocumentation(value:unknown){
 const doc=DocumentationSchema.parse(value),missing=[...documentationFields.filter(k=>doc.original[k].trim().length<20).map(k=>'original_'+k),...documentationFields.filter(k=>doc.revised[k].trim().length<20).map(k=>'revised_'+k),...peerAttemptFields.filter(k=>doc.peer[k].trim().length<20).map(k=>'peer_'+k)];
 const changed=documentationFields.filter(k=>doc.original[k].trim()!==doc.revised[k].trim());if(!changed.length)missing.push('revision');
 return {state:missing.length?'incomplete' as const:'self-reported' as const,missing,changed,assessment:'human-review-required',peerVerification:'learner-reported-not-independently-observed'} as const;
}
export function exportDocumentation(value:unknown){const documentation=DocumentationSchema.parse(value);return {schemaVersion:1,lessonId:'L59',origin:'learner-authored',documentation,review:reviewDocumentation(documentation),verification:{peerAttempt:'Learner report only; not independently observed by software',simulation:'NOT RUN by this form',compilation:'NOT RUN by this form',upload:'NOT RUN by this form',physical:'NOT RUN by this form'}} as const;}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** Standalone read-only instructions: no scripts, network resources or active learner links. */
export function documentationHTML(value:unknown,labels:{title:string;original:string;revised:string;peer:string;notice:string;fields:Record<typeof documentationFields[number],string>;attempt:Record<typeof peerAttemptFields[number],string>}){
 const doc=DocumentationSchema.parse(value),section=(title:string,fields:Record<string,string>,values:Record<string,string>)=>'<section><h2>'+escape(title)+'</h2>'+Object.entries(fields).map(([k,label])=>'<h3>'+escape(label)+'</h3><pre>'+escape(values[k]??'')+'</pre>').join('')+'</section>';
 return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>'+escape(labels.title)+'</title><style>body{font:16px system-ui,sans-serif;max-width:850px;margin:32px auto;padding:0 24px;line-height:1.6;color:#17233b}h1{color:#211dff}section{border-top:1px solid #ccd4e0;margin-top:28px}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}aside{padding:16px;background:#f0f3fb}@media print{body{margin:0}section{break-inside:auto}}</style></head><body><header><h1>JECTIVE · '+escape(labels.title)+'</h1></header><aside>'+escape(labels.notice)+'</aside>'+section(labels.original,labels.fields,doc.original)+section(labels.revised,labels.fields,doc.revised)+section(labels.peer,labels.attempt,doc.peer)+'</body></html>';
}
