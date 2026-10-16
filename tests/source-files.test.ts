import {it,expect} from 'vitest';
import {mkdtemp,rm,readFile,readdir,writeFile,symlink,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID,createHash} from 'node:crypto';
import {ProjectSchema,type Project} from '../packages/contracts';
import {sourceEntries,sortedSourceFiles,sameSourceInputs} from '../packages/contracts/source-files';
import {buildSourceHash} from '../packages/toolchain';
import {verifyProjectProfile} from '../packages/profiles/binding';
import {programFingerprint,recordActivity} from '../packages/persistence/activity';
import {createProjectCopy} from '../packages/contracts/project-copy';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import {encodeArchive,decodeArchive} from '../packages/persistence/archives';
import {exportArduinoProject} from '../packages/persistence/arduino-export';
import {zipSync,strToU8} from 'fflate';
const project=():Project=>({schemaVersion:1,id:randomUUID(),name:'Multiple source fixture',profileId:'esp32-devkit-reference',mode:'code',source:'#include "behavior.h"\nvoid setup(){}\nvoid loop(){step();}\n',sourceFiles:{'behavior.h':'#pragma once\nvoid step();\n','behavior.cpp':'#include "behavior.h"\nvoid step(){}\n'},workspace:{},revision:0});
it('rejects ESP32 compiler response files at project, archive, export and persistence boundaries',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-build-control-')),store=new WorkspaceStore(join(root,'workspace.sqlite'));
 try{
  for(const name of ['build_opt.h','BUILD_OPT.h','Build_Opt.h']){
   const p={...project(),sourceFiles:{[name]:'-DJECTIVE_UNTRUSTED_PROJECT_FLAG'}};
   expect(()=>ProjectSchema.parse(p)).toThrow('RESERVED_BUILD_CONTROL_FILE');
   expect(()=>sourceEntries(p)).toThrow('RESERVED_BUILD_CONTROL_FILE');
   expect(()=>encodeArchive('project',p)).toThrow('RESERVED_BUILD_CONTROL_FILE');
   const forged=zipSync({'manifest.json':strToU8(JSON.stringify({format:'jective',version:1,kind:'project'})),'content.json':strToU8(JSON.stringify(p))});
   expect(()=>decodeArchive(forged)).toThrow('RESERVED_BUILD_CONTROL_FILE');
   expect(()=>store.autosave(p)).toThrow('RESERVED_BUILD_CONTROL_FILE');
   await expect(exportArduinoProject(p,root)).rejects.toThrow('RESERVED_BUILD_CONTROL_FILE');
   expect(store.project(p.id)).toBeNull();
  }
  expect(ProjectSchema.parse({...project(),sourceFiles:{'build_options.h':'#pragma once'}}).sourceFiles).toBeDefined();
 }finally{store.close();await rm(root,{recursive:true,force:true});}
});
it('accepts legacy projects but rejects traversal, Windows devices and case collisions',()=>{
 const p=project();expect(ProjectSchema.parse(p)).toEqual(p);const legacy={...p};delete legacy.sourceFiles;expect(ProjectSchema.parse(legacy)).toEqual(legacy);
 for(const name of ['../escape.cpp','dir/a.h','dir\\a.h','C:a.cpp','a.cpp:stream','con.h','AUX.cpp','COM1.h','lpt9.hpp','a.ino','.h','a.h ','a.H','a..h'])expect(()=>ProjectSchema.parse({...p,sourceFiles:{[name]:''}}),name).toThrow();
 expect(()=>ProjectSchema.parse({...p,sourceFiles:{'Motor.h':'','motor.h':''}})).toThrow('SOURCE_FILE_CASE_COLLISION');expect(()=>sourceEntries(p,'../main.ino')).toThrow('MAIN_FILE_NAME');
});
it('bounds per-file, total source and file count, and keeps file editing out of Blocks',()=>{
 const p=project();expect(()=>ProjectSchema.parse({...p,sourceFiles:{'a.h':'x'.repeat(100001)}})).toThrow();expect(()=>ProjectSchema.parse({...p,sourceFiles:Object.fromEntries(Array.from({length:16},(_,i)=>['a'+i+'.h','']))})).toThrow('SOURCE_FILE_COUNT');expect(()=>ProjectSchema.parse({...p,source:'x'.repeat(450000),sourceFiles:{'a.h':'x'.repeat(50001)}})).toThrow('PROJECT_SOURCE_LIMIT');expect(()=>ProjectSchema.parse({...p,mode:'blocks'})).toThrow('SOURCE_FILES_CODE_ONLY');expect(ProjectSchema.parse({...p,mode:'blocks',sourceFiles:{}}).mode).toBe('blocks');
});
it('hashes all files canonically and retains legacy single-source fingerprints',()=>{
 const p=project(),reordered={...p,sourceFiles:{'behavior.cpp':p.sourceFiles!['behavior.cpp']!,'behavior.h':p.sourceFiles!['behavior.h']!}};expect(sameSourceInputs(p,reordered)).toBe(true);expect(buildSourceHash(p)).toBe(buildSourceHash(reordered));expect(programFingerprint(p)).toBe(programFingerprint(reordered));const edited={...p,sourceFiles:{...p.sourceFiles,'behavior.h':'void step(int value);'}};expect(sameSourceInputs(p,edited)).toBe(false);expect(buildSourceHash(p)).not.toBe(buildSourceHash(edited));expect(programFingerprint(p)).not.toBe(programFingerprint(edited));expect(buildSourceHash({...p,sourceFiles:{'renamed.h':'void step();'}})).not.toBe(buildSourceHash(p));
 const legacy={...p,sourceFiles:undefined};expect(buildSourceHash(legacy)).toBe(createHash('sha256').update(legacy.source).update(JSON.stringify(verifyProjectProfile(legacy).profile)).update('{}').digest('hex'));expect(programFingerprint(legacy)).toBe(createHash('sha256').update(JSON.stringify({mode:'code',source:legacy.source})).digest('hex'));expect(sameSourceInputs(legacy,{...legacy,sourceFiles:{}})).toBe(true);expect(sortedSourceFiles(undefined)).toEqual([]);
 const first=recordActivity({days:{},fingerprints:{}},p,new Date(2026,9,11));expect(first.days).toEqual({});expect(recordActivity(first,reordered,new Date(2026,9,11))).toEqual(first);expect(recordActivity(first,edited,new Date(2026,9,11)).days['2026-10-11']).toBe(1);
});
it('preserves every source through copies, persistence, snapshots, archives and validated backup',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-source-store-'));let store=new WorkspaceStore(join(root,'source.sqlite'));const restored=new WorkspaceStore(join(root,'restore.sqlite'));try{const p=project(),copy=createProjectCopy(p,randomUUID());expect(copy.sourceFiles).toEqual(p.sourceFiles);copy.sourceFiles!['behavior.h']='changed copy';expect(p.sourceFiles!['behavior.h']).not.toBe('changed copy');store.autosave(p);store.snapshot(p,'Sources');const snapshot=store.snapshots(p.id)[0]!;expect(store.restoreSnapshot(snapshot.id)?.sourceFiles).toEqual(p.sourceFiles);const archive=decodeArchive(encodeArchive('project',p));expect(archive.kind).toBe('project');expect(archive.value).toEqual(p);store.close();store=new WorkspaceStore(join(root,'source.sqlite'));expect(store.project(p.id)).toEqual(p);await store.backup(join(root,'backup.sqlite'));populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));expect(restored.project(p.id)).toEqual(p);}
 finally{store.close();restored.close();await rm(root,{recursive:true,force:true});}
});
it('exports a complete Arduino directory and never merges into an existing export',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-source-export-'));try{const p=project(),target=await exportArduinoProject(p,root);for(const [name,text]of sourceEntries(p,'jective_sketch.ino'))expect(await readFile(join(target,name),'utf8')).toBe(text);expect((await readdir(root)).sort()).toEqual(['jective_sketch']);await writeFile(join(target,'student.txt'),'preserve this');await expect(exportArduinoProject({...p,source:'changed'},root)).rejects.toThrow('EXPORT_EXISTS');expect(await readFile(join(target,'jective_sketch.ino'),'utf8')).toBe(p.source);expect(await readFile(join(target,'student.txt'),'utf8')).toBe('preserve this');await expect(exportArduinoProject({...p,sourceFiles:{'../escape.h':''}},root)).rejects.toThrow();expect((await readdir(root)).sort()).toEqual(['jective_sketch']);}
 finally{await rm(root,{recursive:true,force:true});}
});
it('refuses an existing junction/symlink export target without writing through it',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-source-link-'));try{const parent=join(root,'parent'),outside=join(root,'outside');await mkdir(parent);await mkdir(outside);await writeFile(join(outside,'student.txt'),'untouched');await symlink(outside,join(parent,'jective_sketch'),process.platform==='win32'?'junction':'dir');await expect(exportArduinoProject(project(),parent)).rejects.toThrow('EXPORT_EXISTS');expect(await readdir(outside)).toEqual(['student.txt']);}
 finally{await rm(root,{recursive:true,force:true});}
});
