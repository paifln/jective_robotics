import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {Project} from '../contracts';
import {sortedSourceFiles} from '../contracts/source-files';
export const ActivitySchema=z.object({days:z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/),z.number().int().min(1).max(1000000)).refine(v=>Object.keys(v).length<=3660),fingerprints:z.record(z.uuid(),z.string().regex(/^[a-f0-9]{64}$/)).refine(v=>Object.keys(v).length<=10000)}).strict();
export type Activity=z.infer<typeof ActivitySchema>;
export const localDay=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
function semanticBlocks(value:unknown):unknown{
 if(Array.isArray(value))return value.map(semanticBlocks);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!['id','x','y','collapsed','comment','editable','deletable','movable'].includes(key)).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,semanticBlocks(item)]));
 return value;
}
export function programFingerprint(project:Project){const files=sortedSourceFiles(project.sourceFiles);return createHash('sha256').update(JSON.stringify(project.mode==='code'?{mode:project.mode,source:project.pythonSource??project.source,...(project.pythonSource===undefined?{}:{language:'python',...(project.pythonFiles?{files:Object.entries(project.pythonFiles).sort(([a],[b])=>a.localeCompare(b))}:{})}),...(files.length?{sourceFiles:files}:{})}:{mode:project.mode,workspace:semanticBlocks(project.workspace)})).digest('hex');}
export function recordActivity(activity:Activity,project:Project,date=new Date()):Activity{
 if(activity.fingerprints[project.id]===undefined)return seedActivity(activity,project);
 const hash=programFingerprint(project);if(activity.fingerprints[project.id]===hash)return activity;
 const days={...activity.days},day=localDay(date);days[day]=Math.min(1000000,(days[day]??0)+1);
 const retained=Object.fromEntries(Object.entries(days).sort(([a],[b])=>b.localeCompare(a)).slice(0,3660));
 const fingerprints={...activity.fingerprints,[project.id]:hash};if(Object.keys(fingerprints).length>10000)delete fingerprints[Object.keys(fingerprints)[0]!];
 return ActivitySchema.parse({days:retained,fingerprints});
}
/** Opening or copying establishes a comparison point, never an activity day. */
export function seedActivity(activity:Activity,project:Project):Activity{
 if(activity.fingerprints[project.id]!==undefined)return activity;
 const fingerprints={...activity.fingerprints,[project.id]:programFingerprint(project)};
 if(Object.keys(fingerprints).length>10000)delete fingerprints[Object.keys(fingerprints)[0]!];
 return ActivitySchema.parse({days:activity.days,fingerprints});
}
