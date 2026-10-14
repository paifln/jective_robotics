import {expect,it} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {WorkspaceStore} from '../packages/persistence/workspace';
import type {Project,Assignment,Submission} from '../packages/contracts';
const project=():Project=>({schemaVersion:1,id:randomUUID(),name:'Lifecycle',profileId:'esp32-devkit-reference',mode:'code',source:'',workspace:{},revision:0});
it('deleting a project removes its snapshots and only clears its own recovery pointer',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'jective-lifecycle-'));const store=new WorkspaceStore(join(dir,'store.sqlite'));
 try{const a=project(),b=project();expect(store.project(a.id)).toBeNull();expect(store.restoreSnapshot(999)).toBeNull();store.autosave(a);store.snapshot(a,'Original');const snapshot=store.snapshots(a.id)[0]!;expect(store.restoreSnapshot(snapshot.id)).toEqual(a);store.autosave(b);store.snapshot(b,'Keep');store.progress('L01','started');store.removeProject(a.id);expect(store.project(a.id)).toBeNull();expect(store.snapshots(a.id)).toEqual([]);expect(store.restoreSnapshot(snapshot.id)).toBeNull();expect(store.state().recovery).toEqual(b);expect(store.snapshots(b.id)).toHaveLength(1);store.removeProject(b.id);expect(store.state().recovery).toBeNull();expect(store.state().recent).toEqual([]);expect(store.state().progress.L01).toBe('started');store.removeProject(b.id);
 }finally{store.close();await rm(dir,{recursive:true,force:true});}
});
it('a failed SQLite transaction rolls back all writes and leaves the connection usable',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'jective-rollback-'));const store=new WorkspaceStore(join(dir,'store.sqlite'));
 try{expect(()=>store.transaction(()=>{store.db.prepare('INSERT INTO settings VALUES(?,?)').run('locale','ru');throw new Error('fixture failure');})).toThrow('fixture failure');expect(store.setting('locale','en')).toBe('en');store.preferences({locale:'kk'});expect(store.state().locale).toBe('kk');}finally{store.close();await rm(dir,{recursive:true,force:true});}
});
it('classroom rejects missing references, unknown rubric items and replacement grades without changing the first grade',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'jective-grade-'));const store=new WorkspaceStore(join(dir,'store.sqlite'));
 try{const a:Assignment={schemaVersion:1,id:randomUUID(),classId:randomUUID(),title:'Review',lessonIds:['L03'],dueDate:'',instructions:'Explain evidence',permittedProfiles:['esp32-devkit-reference'],rubric:[{id:'evidence',title:'Evidence',maxScore:10}],starter:project()};const s:Submission={schemaVersion:1,id:randomUUID(),assignmentId:a.id,learnerId:'student',version:1,project:project(),evidence:[],submittedAt:'2026-10-10'};expect(()=>store.submission(s)).toThrow('ASSIGNMENT_UNKNOWN');expect(()=>store.grade({submissionId:s.id,scores:{evidence:5},feedback:''})).toThrow('SUBMISSION_UNKNOWN');store.assignment(a);store.assignment(a);store.submission(s);expect(()=>store.grade({submissionId:s.id,scores:{unknown:1},feedback:''})).toThrow('RUBRIC_SCORE_RANGE');const grade={submissionId:s.id,scores:{evidence:5},feedback:'First review'};store.grade(grade);expect(()=>store.grade({...grade,feedback:'Replacement'})).toThrow('GRADE_EXISTS');expect(store.classroom().grades).toEqual([grade]);}finally{store.close();await rm(dir,{recursive:true,force:true});}
});
it('a newer database schema is refused and its data stays intact',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'jective-version-'));const path=join(dir,'store.sqlite');const db=new DatabaseSync(path);db.exec('CREATE TABLE sentinel(value TEXT); INSERT INTO sentinel VALUES(\'keep\'); PRAGMA user_version=2;');db.close();
 try{expect(()=>new WorkspaceStore(path)).toThrow('WORKSPACE_NEWER_VERSION');const reopened=new DatabaseSync(path);try{expect(reopened.prepare('SELECT value FROM sentinel').get()?.value).toBe('keep');}finally{reopened.close();}}finally{await rm(dir,{recursive:true,force:true});}
});
