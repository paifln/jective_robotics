import {it,expect,vi} from 'vitest';
import {mkdtemp,rm,readdir,readFile,writeFile,mkdir,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {profiles} from '../packages/profiles';
import {encodeProfile} from '../packages/profiles/exchange';
import {ProfileRegistry} from '../packages/profiles/registry';
const fault=vi.hoisted(()=>({stage:''}));
vi.mock('node:fs/promises',async original=>{
 const fs=await original<typeof import('node:fs/promises')>();const failure=()=>Object.assign(new Error('EXPLICIT TEST INJECTED PROFILE '+fault.stage+' FAILURE'),{code:'EIO'});
 return {...fs,open:async(...args:Parameters<typeof fs.open>)=>{if(String(args[0]).endsWith('.tmp')&&fault.stage==='open')throw failure();const handle=await fs.open(...args);if(!String(args[0]).endsWith('.tmp'))return handle;return new Proxy(handle,{get(target,key){if(key==='writeFile'&&fault.stage==='write')return async()=>{await target.writeFile('partial fixture');throw failure();};if(key==='sync'&&fault.stage==='sync')return async()=>{throw failure();};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});},link:async(...args:Parameters<typeof fs.link>)=>{if(fault.stage==='link')throw failure();return fs.link(...args);}};
});
it.each(['open','write','sync','link'])('injected %s failure leaves no published profile, cleans staging and allows retry',async stage=>{
 const root=await mkdtemp(join(tmpdir(),'jective-profile-fault-'));try{const registry=new ProfileRegistry(root);const p={...profiles[0]!,id:'fault-board'};fault.stage=stage;await expect(registry.import(encodeProfile(p))).rejects.toThrow('EXPLICIT TEST INJECTED PROFILE');fault.stage='';await expect(readFile(join(root,'fault-board.1.1.0.json'))).rejects.toThrow();expect(await readdir(join(root,'.pending'))).toEqual([]);expect(await registry.list()).toEqual(profiles);expect(await registry.import(encodeProfile(p))).toBe('imported');expect((await registry.list()).find(x=>x.id===p.id)).toEqual(p);}finally{fault.stage='';await rm(root,{recursive:true,force:true});}
});
it('staging junctions and non-directory staging entries are rejected without writing outside the registry',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-profile-staging-'));const outside=await mkdtemp(join(tmpdir(),'jective-profile-outside-'));try{const registry=new ProfileRegistry(root);const p={...profiles[0]!,id:'fault-board'};await writeFile(join(root,'.pending'),'sentinel');await expect(registry.import(encodeProfile(p))).rejects.toThrow('PROFILE_REGISTRY_FILE_INVALID');expect(await readFile(join(root,'.pending'),'utf8')).toBe('sentinel');await rm(join(root,'.pending'));await symlink(outside,join(root,'.pending'),'junction');await expect(registry.import(encodeProfile(p))).rejects.toThrow('PROFILE_REGISTRY_FILE_INVALID');expect(await readdir(outside)).toEqual([]);await rm(join(root,'.pending'));await mkdir(join(root,'.pending'));expect(await registry.import(encodeProfile(p))).toBe('imported');}finally{await rm(root,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}
});
