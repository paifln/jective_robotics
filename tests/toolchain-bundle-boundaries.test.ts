import {it,expect,vi} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,readdir,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {importBundle} from '../packages/toolchain/bundle';
const renameFailure=vi.hoisted(()=>({target:'',enabled:false}));
vi.mock('node:fs/promises',async original=>{
 const fs=await original<typeof import('node:fs/promises')>();
 return {...fs,rename:async(from:Parameters<typeof fs.rename>[0],to:Parameters<typeof fs.rename>[1])=>{
  if(renameFailure.enabled&&String(from).startsWith(renameFailure.target+'.import-')&&String(to)===renameFailure.target){renameFailure.enabled=false;throw Object.assign(new Error('EXPLICIT TEST INJECTED COMMIT FAILURE'),{code:'EIO'});}
  return fs.rename(from,to);
 }};
});
const corePath='data/packages/esp32/hardware/esp32/3.3.12/platform.txt';
const payload='EXPLICIT IMPORT VALIDATION FIXTURE, NOT AN ARDUINO CORE';
const file={path:corePath,size:Buffer.byteLength(payload),sha256:createHash('sha256').update(payload).digest('hex')};
const manifest={format:'jective-toolchain',version:1,cli:'1.5.1',core:'esp32:esp32@3.3.12',files:[file]};
it('an explicitly injected final rename failure restores the previous target and removes staging',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-bundle-rollback-'));const source=join(root,'source'),target=join(root,'target');
 try{
  await mkdir(join(source,'data/packages/esp32/hardware/esp32/3.3.12'),{recursive:true});await writeFile(join(source,corePath),payload);await writeFile(join(source,'jective-toolchain-manifest.json'),JSON.stringify(manifest));await mkdir(target);await writeFile(join(target,'sentinel'),'existing');
  renameFailure.target=target;renameFailure.enabled=true;
  await expect(importBundle(source,target)).rejects.toThrow('EXPLICIT TEST INJECTED COMMIT FAILURE');expect(await readFile(join(target,'sentinel'),'utf8')).toBe('existing');expect(await readdir(root)).toEqual(['source','target']);
 }finally{renameFailure.enabled=false;renameFailure.target='';await rm(root,{recursive:true,force:true});}
});
it('verification-only validates files without creating staging or replacing the target',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-bundle-verify-'));const source=join(root,'source'),target=join(root,'target');
 try{
  await mkdir(join(source,'data/packages/esp32/hardware/esp32/3.3.12'),{recursive:true});await writeFile(join(source,corePath),payload);await writeFile(join(source,'jective-toolchain-manifest.json'),JSON.stringify(manifest));await mkdir(target);await writeFile(join(target,'sentinel'),'existing');
  expect(await importBundle(source,target,{verifyOnly:true})).toEqual({files:1,bytes:file.size,previous:null});expect(await readdir(root)).toEqual(['source','target']);expect(await readFile(join(target,'sentinel'),'utf8')).toBe('existing');
  await writeFile(join(source,'jective-toolchain-manifest.json'),JSON.stringify({...manifest,files:[]}));await expect(importBundle(source,target,{verifyOnly:true})).rejects.toThrow('TOOLCHAIN_CORE_MISSING');expect(await readdir(root)).toEqual(['source','target']);
 }finally{await rm(root,{recursive:true,force:true});}
});
it('case-duplicate manifest entries and directories masquerading as files cannot replace a valid target',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-bundle-types-'));const source=join(root,'source'),target=join(root,'target');
 try{
  await mkdir(join(source,'data/packages/esp32/hardware/esp32/3.3.12'),{recursive:true});await writeFile(join(source,corePath),payload);await mkdir(target);await writeFile(join(target,'sentinel'),'existing');
  await writeFile(join(source,'jective-toolchain-manifest.json'),JSON.stringify({...manifest,files:[file,{...file,path:corePath.toUpperCase().replace('DATA/','data/') }]}));await expect(importBundle(source,target)).rejects.toThrow('TOOLCHAIN_PATH_UNSAFE');
  await writeFile(join(source,'jective-toolchain-manifest.json'),JSON.stringify({...manifest,files:[file,{...file,path:'data/packages'}]}));await expect(importBundle(source,target)).rejects.toThrow('TOOLCHAIN_HASH_MISMATCH');expect(await readFile(join(target,'sentinel'),'utf8')).toBe('existing');expect(await readdir(root)).toEqual(['source','target']);
 }finally{await rm(root,{recursive:true,force:true});}
});
it('a directory junction escaping the selected source is rejected before installing its content',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-bundle-junction-'));const source=join(root,'source'),outside=join(root,'outside'),target=join(root,'target');
 try{
  await mkdir(source);await mkdir(join(outside,'packages/esp32/hardware/esp32/3.3.12'),{recursive:true});await writeFile(join(outside,'packages/esp32/hardware/esp32/3.3.12/platform.txt'),payload);await symlink(outside,join(source,'data'),'junction');await writeFile(join(source,'jective-toolchain-manifest.json'),JSON.stringify(manifest));await mkdir(target);await writeFile(join(target,'sentinel'),'existing');
  await expect(importBundle(source,target)).rejects.toThrow('TOOLCHAIN_PATH_UNSAFE');expect(await readFile(join(target,'sentinel'),'utf8')).toBe('existing');expect(await readFile(join(outside,'packages/esp32/hardware/esp32/3.3.12/platform.txt'),'utf8')).toBe(payload);
 }finally{await rm(root,{recursive:true,force:true});}
});
