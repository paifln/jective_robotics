import {it,expect} from 'vitest';
import {mkdtemp,writeFile,readFile,readdir,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {readProject,readProjectSnapshot,writeProject} from '../packages/persistence';
import type {Project} from '../packages/contracts';
const project=():Project=>({schemaVersion:1,id:randomUUID(),name:'File boundary fixture',profileId:'esp32-devkit-reference',mode:'code',source:'void setup(){}\nvoid loop(){}',workspace:{},revision:0});
it('file fingerprints detect external edits with an unchanged revision and allow explicit reopen',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-content-conflict-')),path=join(root,'project.json');
 try{
  const saved=await writeProject(path,project(),null),opened=await readProjectSnapshot(path);
  const external={...saved,source:saved.source+'\n// external change without revision update'};
  const bytes=JSON.stringify(external,null,2);await writeFile(path,bytes);
  await expect(writeProject(path,{...saved,name:'local edit'},saved.revision,opened.fingerprint)).rejects.toThrow('PROJECT_CONFLICT');expect(await readFile(path,'utf8')).toBe(bytes);
  const reopened=await readProjectSnapshot(path);const next=await writeProject(path,{...reopened.project,name:'reconciled copy'},reopened.project.revision,reopened.fingerprint);expect(next.source).toBe(external.source);expect(next.revision).toBe(2);
  const current=await readProjectSnapshot(path);const formatted=JSON.stringify(next);await writeFile(path,formatted);
  await expect(writeProject(path,next,next.revision,current.fingerprint)).rejects.toThrow('PROJECT_CONFLICT');expect(await readFile(path,'utf8')).toBe(formatted);expect(await readdir(root)).toEqual(['project.json']);
 }finally{await rm(root,{recursive:true,force:true});}
});
it('matching revisions update, while foreign IDs and stale or fabricated client revisions preserve the committed file',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-file-conflict-'));const path=join(root,'project.json');
 try{
  const original=await writeProject(path,project(),null);const before=await readFile(path,'utf8');
  await expect(writeProject(path,{...original,id:randomUUID()},original.revision)).rejects.toThrow('PROJECT_CONFLICT');expect(await readFile(path,'utf8')).toBe(before);
  for(const revision of [original.revision-1,original.revision+5]){await expect(writeProject(path,{...original,revision},original.revision)).rejects.toThrow('PROJECT_CONFLICT');expect(await readFile(path,'utf8')).toBe(before);expect(await readdir(root)).toEqual(['project.json']);}
  const updated=await writeProject(path,{...original,name:'Updated fixture'},original.revision);expect(updated.revision).toBe(original.revision+1);expect(await readProject(path)).toEqual(updated);expect((await readdir(root)).some(name=>name.endsWith('.tmp'))).toBe(false);
 }finally{await rm(root,{recursive:true,force:true});}
});
it('overlarge reads and writes fail before replacing a readable committed project',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-file-size-'));const path=join(root,'project.json');
 try{
  const original=await writeProject(path,project(),null);const before=await readFile(path,'utf8');
  await expect(writeProject(path,{...original,workspace:{fixture:'x'.repeat(2000001)}},original.revision)).rejects.toThrow('PROJECT_TOO_LARGE');expect(await readFile(path,'utf8')).toBe(before);expect(await readdir(root)).toEqual(['project.json']);
  const oversized=join(root,'oversized.json');await writeFile(oversized,' '.repeat(2000001));await expect(readProject(oversized)).rejects.toThrow('PROJECT_TOO_LARGE');
 }finally{await rm(root,{recursive:true,force:true});}
});
it('failed replacement of a directory cleans its temporary file without deleting the directory',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-file-replace-'));const destination=join(root,'existing-directory');
 try{await mkdir(destination);await expect(writeProject(destination,project(),null)).rejects.toThrow();expect(await readdir(root)).toEqual(['existing-directory']);}
 finally{await rm(root,{recursive:true,force:true});}
});
