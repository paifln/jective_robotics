import {it,expect} from 'vitest';
import {mkdtemp,writeFile,readFile,lstat,open,appendFile,truncate,rename,unlink,mkdir,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {hashBuildArtifact,snapshotBuildArtifacts,readBuildManifest} from '../packages/toolchain/build-snapshot';

async function fixture(run:(root:string)=>Promise<void>){const root=await mkdtemp(join(tmpdir(),'jective-build-snapshot-'));try{await run(root);}finally{await rm(root,{recursive:true,force:true});}}
const digest=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
it('hashes actual binary and empty artifacts without reading beyond the bounded window',async()=>fixture(async root=>{
 const binary=Buffer.alloc(1024*1024+7,193);await writeFile(join(root,'sketch.ino.bin'),binary);await writeFile(join(root,'sketch.ino.elf'),'');
 expect(await snapshotBuildArtifacts(root,['sketch.ino.bin','sketch.ino.elf'])).toEqual({hashes:{'sketch.ino.bin':digest(binary),'sketch.ino.elf':digest('')},sizes:{'sketch.ino.bin':binary.length,'sketch.ino.elf':0}});
 expect(await snapshotBuildArtifacts(root,[])).toEqual({hashes:{},sizes:{}});
 const path=join(root,'short-reads.bin');await writeFile(path,'an artifact read through several short reads');let reads=0,closed=false;
 const value=await hashBuildArtifact(path,1024,{lstat:path=>lstat(path,{bigint:true}),open:async path=>{const file=await open(path,'r');return {stat:()=>file.stat({bigint:true}),read:(buffer,offset,length,position)=>{expect(buffer.length).toBeLessThanOrEqual(256*1024);reads++;return file.read(buffer,offset,Math.min(7,length),position);},close:async()=>{await file.close();closed=true;}};}});
 expect(value).toEqual({bytes:44,sha256:digest(await readFile(path))});expect(reads).toBeGreaterThan(2);expect(closed).toBe(true);
}));
it('rejects oversized, missing, directory and linked artifacts and closes rejected handles',async()=>fixture(async root=>{
 const path=join(root,'large.bin');await writeFile(path,Buffer.alloc(33));
 for(const max of [-1,NaN,1024**3+1,32])await expect(hashBuildArtifact(path,max)).rejects.toThrow('ARTIFACT_CHANGED');
 await expect(hashBuildArtifact(join(root,'missing.bin'))).rejects.toThrow('ARTIFACT_CHANGED');await expect(hashBuildArtifact(root)).rejects.toThrow('ARTIFACT_CHANGED');
 const linked=join(root,'linked.bin');await symlink(root,linked,process.platform==='win32'?'junction':'dir');await expect(hashBuildArtifact(linked)).rejects.toThrow('ARTIFACT_CHANGED');
 let closed=false;await expect(hashBuildArtifact(path,1024,{lstat:path=>lstat(path,{bigint:true}),open:async path=>{await writeFile(path,'replaced before open');const file=await open(path,'r');return {stat:()=>file.stat({bigint:true}),read:(...args)=>file.read(...args),close:async()=>{await file.close();closed=true;}};}})).rejects.toThrow('ARTIFACT_CHANGED');expect(closed).toBe(true);
}));
it('rejects growth, truncation, unlink and path replacement during artifact reads',async()=>fixture(async root=>{
 for(const mutate of [async(path:string)=>appendFile(path,'growth'),async(path:string)=>truncate(path,1),async(path:string)=>{await rename(path,path+'.old');await writeFile(path,'original');},async(path:string)=>unlink(path)]){
  const path=join(root,'changing.bin');await writeFile(path,'original');let changed=false,closed=false;
  await expect(hashBuildArtifact(path,1024,{lstat:path=>lstat(path,{bigint:true}),open:async path=>{const file=await open(path,'r');return {stat:()=>file.stat({bigint:true}),read:async(...args)=>{const value=await file.read(...args);if(!changed){changed=true;await mutate(path);}return value;},close:async()=>{await file.close();closed=true;}};}})).rejects.toThrow('ARTIFACT_CHANGED');expect(closed).toBe(true);
 }
}));
it('rejects ambiguous, excessive and traversal output lists before opening their contents',async()=>fixture(async root=>{
 for(const names of [['same.bin','same.bin'],['../escape.bin'],['no-extension'],['space name.bin'],['a'.repeat(201)+'.bin'],Array.from({length:257},(_,i)=>i+'.bin')])await expect(snapshotBuildArtifacts(root,names)).rejects.toThrow('ARTIFACT_CHANGED');
}));
it('bounds and strictly decodes one build manifest, including missing or replaced files',async()=>fixture(async root=>{
 const path=join(root,'manifest.json');await expect(readBuildManifest(root)).rejects.toThrow('BUILD_MANIFEST_INVALID');
 for(const bytes of [Buffer.from([0xc3,0x28]),Buffer.from('{invalid'),Buffer.alloc(4*1024*1024+1,32)]){await writeFile(path,bytes);await expect(readBuildManifest(root)).rejects.toThrow('BUILD_MANIFEST_INVALID');}
 await writeFile(path,Buffer.from('\ufeff{"state":"fixture"}'));expect(await readBuildManifest(root)).toEqual({state:'fixture'});
 await unlink(path);await mkdir(path);await expect(readBuildManifest(root)).rejects.toThrow('BUILD_MANIFEST_INVALID');
}));
