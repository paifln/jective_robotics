import {prepareEnvironmentFixture} from './helpers/toolchain-environment';
import {it,expect} from 'vitest';
import {mkdtemp,rm,readFile,writeFile,unlink,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {ToolchainService} from '../packages/toolchain';
import type {Project} from '../packages/contracts';
class SourceFixture extends ToolchainService{
 calls:string[][]=[];
 override async run(args:string[]){this.calls.push(args);if(args[0]==='version')return {code:0,log:'Version: 1.5.1 fixture',stdout:'Version: 1.5.1 fixture',stderr:'',interrupted:false};if(args[0]==='core')return {code:0,log:JSON.stringify({platforms:[{id:'esp32:esp32',installed_version:'3.3.12'}]}),stdout:JSON.stringify({platforms:[{id:'esp32:esp32',installed_version:'3.3.12'}]}),stderr:'',interrupted:false};if(args[0]==='compile'){const output=args[args.indexOf('--build-path')+1]!;for(const name of ['sketch.ino.bin','sketch.ino.elf'])await writeFile(join(output,name),'explicit fixture artifact');}return {code:0,log:'explicit fixture',stdout:'explicit fixture',stderr:'',interrupted:false};}
}
const project=():Project=>({schemaVersion:1,id:randomUUID(),name:'Source snapshot fixture',profileId:'esp32-devkit-reference',mode:'code',source:'#include "helper.h"\nvoid setup(){}\nvoid loop(){}',sourceFiles:{'helper.h':'// original header\n'},workspace:{},revision:0});
it('writes helper files and rejects changed project headers before any upload invocation',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-source-build-'));try{const service=new SourceFixture(await prepareEnvironmentFixture(root),root),p=project(),build=await service.compile(p);expect(await readFile(join(root,'builds',build.operationId,'sketch','helper.h'),'utf8')).toBe(p.sourceFiles!['helper.h']);await expect(service.upload({...p,sourceFiles:{'helper.h':'changed'}},build.operationId,'COM3')).rejects.toThrow('BUILD_STALE');expect(service.calls.some(args=>args[0]==='upload')).toBe(false);}
 finally{await rm(root,{recursive:true,force:true});}
});
it('rejects modified, missing and replaced snapshot files and incomplete source manifests',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-source-tamper-'));try{const service=new SourceFixture(await prepareEnvironmentFixture(root),root),p=project(),build=await service.compile(p),folder=join(root,'builds',build.operationId),header=join(folder,'sketch','helper.h'),manifestPath=join(folder,'manifest.json'),original=JSON.parse(await readFile(manifestPath,'utf8'));
 for(const text of ['short',p.sourceFiles!['helper.h']!.replace('original','modified')]){await writeFile(header,text);await expect(service.upload(p,build.operationId,'COM3')).rejects.toThrow('SOURCE_FILE_CHANGED');}await unlink(header);await expect(service.upload(p,build.operationId,'COM3')).rejects.toThrow('SOURCE_FILE_CHANGED');await writeFile(header,p.sourceFiles!['helper.h']!);for(const hashes of [{}, {...original.sourceFileHashes,'extra.h':'0'.repeat(64)}, {...original.sourceFileHashes,'helper.h':'0'.repeat(64)},Object.fromEntries(Array.from({length:17},(_,i)=>['f'+i+'.h','0'.repeat(64)]))]){await writeFile(manifestPath,JSON.stringify({...original,sourceFileHashes:hashes}));await expect(service.upload(p,build.operationId,'COM3')).rejects.toThrow();}await writeFile(manifestPath,JSON.stringify(original));
 // A directory junction is unprivileged on Windows and cannot pass the file test.
 await unlink(header);await symlink(root,header,process.platform==='win32'?'junction':'dir');await expect(service.upload(p,build.operationId,'COM3')).rejects.toThrow('SOURCE_FILE_CHANGED');expect(service.calls.some(args=>args[0]==='upload')).toBe(false);
 }
 finally{await rm(root,{recursive:true,force:true});}
});
it('validates file paths before asking the CLI to do work',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-source-invalid-'));try{const service=new SourceFixture(await prepareEnvironmentFixture(root),root);await expect(service.compile({...project(),sourceFiles:{'../escape.cpp':''}})).rejects.toThrow();expect(service.calls).toEqual([]);}
 finally{await rm(root,{recursive:true,force:true});}
});
