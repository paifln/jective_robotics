import {z} from 'zod';
/** Flat portable names avoid traversal, Windows devices and case-only collisions. */
export const SourceFileNameSchema=z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}\.(?:h|hpp|cpp)$/).refine(name=>! /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])\./i.test(name),'RESERVED_FILE_NAME');
export const SourceFilesSchema=z.record(SourceFileNameSchema,z.string().max(100000)).refine(files=>Object.keys(files).length<=15,'SOURCE_FILE_COUNT').refine(files=>new Set(Object.keys(files).map(name=>name.toLowerCase())).size===Object.keys(files).length,'SOURCE_FILE_CASE_COLLISION');
export type SourceFiles=z.infer<typeof SourceFilesSchema>;
export interface ProjectSources {source:string;sourceFiles?:SourceFiles}
export function sortedSourceFiles(files:SourceFiles|undefined):[string,string][]{return Object.entries(files??{}).sort(([a],[b])=>a<b?-1:a>b?1:0);}
export function sameSourceInputs(a:ProjectSources,b:ProjectSources){return a.source===b.source&&JSON.stringify(sortedSourceFiles(a.sourceFiles))===JSON.stringify(sortedSourceFiles(b.sourceFiles));}
export function sourceEntries(project:ProjectSources,mainFile='sketch.ino'):[string,string][]{if(!/^[a-z][a-z0-9_]*\.ino$/.test(mainFile))throw new Error('MAIN_FILE_NAME');return [[mainFile,project.source],...sortedSourceFiles(SourceFilesSchema.parse(project.sourceFiles??{}))];}
