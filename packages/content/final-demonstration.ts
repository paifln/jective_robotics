import {z} from 'zod';
import {ProjectSchema} from '../contracts';
import {projectProfile} from '../profiles/project';
import {ProfileSchema} from '../profiles';
export const demonstrationFields=['mission','architecture','experiments','limits','reproduction'] as const;
export const verificationKinds=['simulation','compilation','upload','physical'] as const;
export const rubricCriteria=['mission','architecture','experiments','reproducibility'] as const;
const text=z.string().max(3000),score=z.union([z.literal(''),z.enum(['0','1','2','3','4'])]);
export const DemonstrationSchema=z.object({mission:text,architecture:text,experiments:text,limits:text,reproduction:text,project_id:z.union([z.literal(''),z.uuid()]),project_revision:z.string().regex(/^$|^(0|[1-9][0-9]{0,8})$/),simulation_status:z.enum(['not-run','reported']),simulation_detail:text,compilation_status:z.enum(['not-run','reported']),compilation_detail:text,upload_status:z.enum(['not-run','reported']),upload_detail:text,physical_status:z.enum(['not-run','reported']),physical_detail:text,rubric_role:z.enum(['self','peer','teacher']),rubric_mission:score,rubric_architecture:score,rubric_experiments:score,rubric_reproducibility:score,rubric_feedback:text}).strict();
export type Demonstration=z.infer<typeof DemonstrationSchema>;
export function emptyDemonstration():Demonstration{return {mission:'',architecture:'',experiments:'',limits:'',reproduction:'',project_id:'',project_revision:'',simulation_status:'not-run',simulation_detail:'',compilation_status:'not-run',compilation_detail:'',upload_status:'not-run',upload_detail:'',physical_status:'not-run',physical_detail:'',rubric_role:'self',rubric_mission:'',rubric_architecture:'',rubric_experiments:'',rubric_reproducibility:'',rubric_feedback:''};}
export function demonstrationFromAnswers(value:unknown):Demonstration{return DemonstrationSchema.parse({...emptyDemonstration(),...z.record(z.string(),text).parse(value)});}
/** Records structural completeness, not the truth of prose, score or reviewer identity. */
export function reviewDemonstration(value:unknown){
 const d=DemonstrationSchema.parse(value),missing:string[]=demonstrationFields.filter(k=>d[k].trim().length<20);
 for(const kind of verificationKinds)if(d[`${kind}_detail`].trim().length<20)missing.push(`${kind}_detail`);
 for(const criterion of rubricCriteria)if(d[`rubric_${criterion}`]==='')missing.push(`rubric_${criterion}`);
 if(d.rubric_feedback.trim().length<20)missing.push('rubric_feedback');if(!d.project_id||!d.project_revision)missing.push('project_reference');
 return {state:missing.length?'incomplete' as const:'self-reported' as const,missing,score:rubricCriteria.reduce((n,k)=>n+(d[`rubric_${k}`]===''?0:Number(d[`rubric_${k}`])),0),maximum:16,assessment:'human-review-required',reviewerIdentity:'not-authenticated',verification:Object.fromEntries(verificationKinds.map(k=>[k,{status:d[`${k}_status`],detail:d[`${k}_detail`],origin:'learner-report-not-independently-observed'}]))} as const;
}
export function exportDemonstration(value:unknown){const demonstration=DemonstrationSchema.parse(value);return {schemaVersion:1,lessonId:'L60',origin:'learner-authored',demonstration,review:reviewDemonstration(demonstration),automaticVerification:{simulation:'NOT RUN by this form',compilation:'NOT RUN by this form',upload:'NOT RUN by this form',physical:'NOT RUN by this form'}} as const;}
function canonical(value:unknown,depth=0,budget={nodes:0,characters:0}):string{
 if(depth>32||++budget.nodes>100000)throw new Error('DEMONSTRATION_PACKAGE_LIMIT');
 if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)){const result=JSON.stringify(value);budget.characters+=result.length;if(budget.characters>2*1024*1024)throw new Error('DEMONSTRATION_PACKAGE_LIMIT');return result;}
 if(Array.isArray(value))return '['+value.map(v=>canonical(v,depth+1,budget)).join(',')+']';
 if(typeof value==='object'&&value&&Object.getPrototypeOf(value)===Object.prototype)return '{'+Object.keys(value).sort().filter(k=>(value as Record<string,unknown>)[k]!==undefined).map(k=>{budget.characters+=k.length+3;if(budget.characters>2*1024*1024)throw new Error('DEMONSTRATION_PACKAGE_LIMIT');return JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k],depth+1,budget);}).join(',')+'}';
 throw new Error('DEMONSTRATION_NON_JSON');
}
const digest=async(value:unknown)=>{const bytes=new TextEncoder().encode(canonical(value));if(bytes.length>2*1024*1024)throw new Error('DEMONSTRATION_PACKAGE_LIMIT');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');};
/** Content digest detects accidental changes; it is not a signature or test certificate. */
export async function createDemonstrationPackage(value:unknown,projectValue:unknown){
 const report=exportDemonstration(value),project=ProjectSchema.parse(projectValue);
 if(project.id!==report.demonstration.project_id||String(project.revision)!==report.demonstration.project_revision)throw new Error('DEMONSTRATION_PROJECT_MISMATCH');
 const payload={report,project,profile:ProfileSchema.parse(projectProfile(project))};return {schemaVersion:1,kind:'jective-final-demonstration',payload,sha256:await digest(payload),integrityScope:'canonical-report-project-and-profile-content-only'} as const;
}
export async function verifyDemonstrationPackage(value:unknown){
 const p=z.object({schemaVersion:z.literal(1),kind:z.literal('jective-final-demonstration'),payload:z.object({report:z.object({schemaVersion:z.literal(1),lessonId:z.literal('L60'),origin:z.literal('learner-authored'),demonstration:DemonstrationSchema,review:z.unknown(),automaticVerification:z.unknown()}).strict(),project:ProjectSchema,profile:ProfileSchema}).strict(),sha256:z.string().regex(/^[a-f0-9]{64}$/),integrityScope:z.literal('canonical-report-project-and-profile-content-only')}).strict().parse(value);
 const expected=await createDemonstrationPackage(p.payload.report.demonstration,p.payload.project);
 if(canonical(p.payload)!==canonical(expected.payload)||p.sha256!==expected.sha256)throw new Error('DEMONSTRATION_PACKAGE_TAMPERED');return expected;
}
