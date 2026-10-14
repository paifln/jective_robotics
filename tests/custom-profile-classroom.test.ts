import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {zipSync,strToU8} from 'fflate';
import {profiles} from '../packages/profiles';
import {profileHash} from '../packages/profiles/registry';
import type {Project,Assignment,Submission} from '../packages/contracts';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import {encodeArchive,decodeArchive} from '../packages/persistence/archives';
const definition={...profiles[0]!,id:'classroom-custom'};const project:Project={schemaVersion:1,id:randomUUID(),name:'Bound classroom project',profileId:definition.id,profileDefinition:definition,profileVersion:definition.version,profileHash:profileHash(definition),mode:'code',source:'',workspace:{},revision:0};
const assignment:Assignment={schemaVersion:1,id:randomUUID(),classId:randomUUID(),title:'Custom profile assignment',lessonIds:['L03'],dueDate:'',instructions:'Record limits',permittedProfiles:[definition.id],rubric:[{id:'evidence',title:'Evidence',maxScore:10}],starter:project};
const submission:Submission={schemaVersion:1,id:randomUUID(),assignmentId:assignment.id,learnerId:'learner',version:1,project,evidence:[],submittedAt:'2026-10-10'};
const altered={...project,profileDefinition:{...definition,name:'Changed after binding'}};
it('project, assignment and submission archives reject altered custom bindings on both export and import',()=>{
 for(const [kind,value,changed] of [['project',project,altered],['assignment',assignment,{...assignment,starter:altered}],['submission',submission,{...submission,project:altered}]] as const){expect(decodeArchive(encodeArchive(kind,value)).value).toEqual(value);expect(()=>encodeArchive(kind,changed)).toThrow('PROFILE_MIGRATION_REQUIRED');const raw=zipSync({'manifest.json':strToU8(JSON.stringify({format:'jective',version:1,kind})),'content.json':strToU8(JSON.stringify(changed))});expect(()=>decodeArchive(raw)).toThrow('PROFILE_MIGRATION_REQUIRED');}
});
it('SQLite classroom exchange and backup retain bindings and reject altered nested project data',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-custom-class-'));const source=new WorkspaceStore(join(root,'source.sqlite'));const target=new WorkspaceStore(join(root,'target.sqlite'));try{expect(()=>source.assignment({...assignment,starter:altered})).toThrow('PROFILE_MIGRATION_REQUIRED');source.assignment(assignment);expect(()=>source.submission({...submission,project:altered})).toThrow('PROFILE_MIGRATION_REQUIRED');expect(source.submission(submission)).toBe('imported');const path=join(root,'backup.sqlite');await source.backup(path);populateBackup(target,inspectBackup(path));expect(target.classroom()).toEqual(source.classroom());source.db.prepare('UPDATE submissions SET json=? WHERE id=?').run(JSON.stringify({...submission,project:altered}),submission.id);expect(()=>source.classroom()).toThrow('PROFILE_MIGRATION_REQUIRED');await source.backup(path);expect(()=>inspectBackup(path)).toThrow('PROFILE_MIGRATION_REQUIRED');source.db.prepare('UPDATE submissions SET json=? WHERE id=?').run(JSON.stringify(submission),submission.id);source.db.prepare('UPDATE assignments SET json=? WHERE id=?').run(JSON.stringify({...assignment,starter:altered}),assignment.id);await source.backup(path);expect(()=>inspectBackup(path)).toThrow('PROFILE_MIGRATION_REQUIRED');}finally{source.close();target.close();await rm(root,{recursive:true,force:true});}
});
