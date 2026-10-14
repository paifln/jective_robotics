import {describe,it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {ActivitySchema,recordActivity,seedActivity,programFingerprint,localDay} from '../packages/persistence/activity';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import type {Project} from '../packages/contracts';
import {createCodeCopy} from '../packages/codegen/conversion';
import {createProjectCopy} from '../packages/contracts/project-copy';
const project:Project={schemaVersion:1,id:'a60e6c6f-e2de-4e6a-9a79-845f8a55c39a',name:'Activity test',profileId:'esp32-devkit-reference',mode:'code',source:'void setup(){}\nvoid loop(){}',workspace:{},revision:0};
describe('saved program activity',()=>{
 it('registers a native copy before an immediate first edit, without recording a day or changing the original',async()=>{
  const root=await mkdtemp(join(tmpdir(),'jective-copy-activity-')),store=new WorkspaceStore(join(root,'workspace.sqlite'));
  try{store.activityBaseline(project);expect(store.project(project.id)).toBeNull();expect(store.activity().days).toEqual({});
   const copy=createProjectCopy(project,'fd5c0906-5aa0-4b3e-9b36-1881ad789f96');store.duplicate(project,copy);store.completedSave(copy);expect(store.activity().days).toEqual({});
   store.completedSave({...copy,source:copy.source+'\n// edited copy'});expect(Object.values(store.activity().days)).toEqual([1]);expect(store.project(project.id)?.source).toBe(project.source);
   const blocks={...project,mode:'blocks' as const},code=createCodeCopy(blocks,'a94486c5-0d76-4735-b1a5-3c85e834d32a');store.conversion(blocks,code);store.completedSave({...code,source:code.source+'\n// reviewed immediate edit'});expect(Object.values(store.activity().days)).toEqual([2]);
  }finally{store.close();await rm(root,{recursive:true,force:true});}
 });
 it('counts changed saves, ignores metadata and groups days locally',()=>{
  const date=new Date(2026,0,2,0,1),empty={days:{},fingerprints:{}};expect(localDay(date)).toBe('2026-01-02');
  const first=recordActivity(empty,project,date);expect(first.days).toEqual({});
  expect(recordActivity(first,{...project,name:'Rename',revision:5},new Date(2026,0,3))).toBe(first);
  const second=recordActivity(first,{...project,source:project.source+'\n// changed'},date);expect(second.days['2026-01-02']).toBe(1);
  expect(recordActivity(second,{...project,source:'void setup(){pinMode(2,OUTPUT);}\nvoid loop(){}'},new Date(2026,0,3)).days['2026-01-03']).toBe(1);
 });
 it('seeds openings without credit and never replaces an existing saved comparison point',()=>{
  const baseline=seedActivity({days:{},fingerprints:{}},project);expect(baseline.days).toEqual({});expect(recordActivity(baseline,project)).toBe(baseline);
  const changed={...project,source:project.source+'\n// first edit'};expect(seedActivity(baseline,changed)).toBe(baseline);expect(Object.values(recordActivity(baseline,changed).days)).toEqual([1]);
 });
 it('ignores moving blocks, generated ids and comments but counts changed commands',()=>{
  const p={...project,mode:'blocks' as const,workspace:{blocks:{blocks:[{id:'one',type:'jective_wait',x:1,y:2,fields:{MS:100}}]}}};
  const moved={...p,workspace:{blocks:{blocks:[{y:500,x:40,id:'new',type:'jective_wait',comment:'note',fields:{MS:100}}]}}};expect(programFingerprint(p)).toBe(programFingerprint(moved));
  expect(programFingerprint({...p,workspace:{blocks:{blocks:[{type:'jective_wait',fields:{MS:200}}]}}})).not.toBe(programFingerprint(p));
 });
 it('bounds retained history and fingerprints and validates imported records',()=>{
  const days=Object.fromEntries(Array.from({length:3660},(_,i)=>{const d=new Date(2010,0,i+1);return [localDay(d),1];}));
  const fingerprints=Object.fromEntries(Array.from({length:10000},(_,i)=>[`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`,'a'.repeat(64)]));
  const next=recordActivity({days,fingerprints},project,new Date(2026,0,2));expect(Object.keys(next.days)).toHaveLength(3660);expect(Object.keys(next.fingerprints)).toHaveLength(10000);
  expect(ActivitySchema.safeParse({days:{'2026-01-02':-1},fingerprints:{}}).success).toBe(false);expect(ActivitySchema.safeParse({...next,extra:true}).success).toBe(false);
 });
 it('only explicit successful saves count and records survive reopening and backup',async()=>{
  const root=await mkdtemp(join(tmpdir(),'jective-activity-'));let store:WorkspaceStore|null=new WorkspaceStore(join(root,'workspace.sqlite'));try{
   store.autosave(project);store.snapshot(project,'Draft');expect(store.activity().days).toEqual({});
   store.activityBaseline(project);store.completedSave(project);expect(store.activity().days).toEqual({});const edited={...project,source:project.source+'\n// actual edit'};store.completedSave(edited);store.completedSave({...edited,revision:2,name:'Renamed'});expect(Object.values(store.activity().days)).toEqual([1]);
   store.autosave({...project,source:'Changed recovery only'});expect(Object.values(store.activity().days)).toEqual([1]);
   store.preferences({sidebarCollapsed:true});store.close();store=new WorkspaceStore(join(root,'workspace.sqlite'));expect(store.state().sidebarCollapsed).toBe(true);expect(Object.values(store.activity().days)).toEqual([1]);
   const restored=new WorkspaceStore(join(root,'restored.sqlite'));try{populateBackup(restored,inspectBackup(store.path));expect(restored.activity()).toEqual(store.activity());expect(restored.state().sidebarCollapsed).toBe(true);}finally{restored.close();}
   store.db.exec("CREATE TRIGGER fail_activity BEFORE UPDATE ON settings WHEN NEW.key='activity' BEGIN SELECT RAISE(ABORT,'test failure'); END;");
   expect(()=>store!.completedSave({...project,source:'changed and rejected'})).toThrow('test failure');expect(store.project(project.id)?.source).toBe('Changed recovery only');expect(Object.values(store.activity().days)).toEqual([1]);
  }finally{store?.close();await rm(root,{recursive:true,force:true});}
 });
});
