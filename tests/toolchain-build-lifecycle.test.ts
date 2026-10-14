import {prepareEnvironmentFixture} from './helpers/toolchain-environment';
import {it,expect} from 'vitest';
import {mkdtemp,rm,writeFile,readFile,mkdir,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {ToolchainService} from '../packages/toolchain';
import type {Project} from '../packages/contracts';
import {BuildStageEventSchema,type BuildStageEvent} from '../packages/contracts/build-stage';
type Reply={code:number|null;log:string;stdout:string;stderr:string;interrupted:boolean};
// Explicit software fixture: no Arduino executable or serial port is invoked.
class FixtureToolchain extends ToolchainService {
 duringCompile:(()=>Promise<void>)|undefined;calls:string[][]=[];version='Version: 1.5.1 fixture';versionWarning='';cores:Reply={code:0,log:JSON.stringify({platforms:[{id:'esp32:esp32',installed_version:'3.3.12'}]}),stdout:JSON.stringify({platforms:[{id:'esp32:esp32',installed_version:'3.3.12'}]}),stderr:'',interrupted:false};compileReply:Reply={code:0,log:'fixture compile',stdout:'fixture compile',stderr:'',interrupted:false};uploadReply:Reply={code:0,log:'fixture upload',stdout:'fixture upload',stderr:'',interrupted:false};files=['sketch.ino.bin','sketch.ino.elf'];
 override async run(args:string[],_timeout?:number,rawLogPath?:string):Promise<Reply>{this.calls.push(args);if(rawLogPath)await writeFile(rawLogPath,'explicit fixture raw output',{flag:'wx'});if(args[0]==='version')return {code:0,log:this.version+this.versionWarning,stdout:this.version,stderr:this.versionWarning,interrupted:false};if(args[0]==='core')return this.cores;if(args[0]==='compile'){await this.duringCompile?.();const output=args[args.indexOf('--build-path')+1]!;for(const file of this.files)await writeFile(join(output,file),'fixture artifact '+file);return this.compileReply;}if(args[0]==='upload')return this.uploadReply;throw new Error('Unexpected fixture command');}
}
const project=():Project=>({schemaVersion:1,id:randomUUID(),name:'Build lifecycle fixture',profileId:'esp32-devkit-reference',mode:'code',source:'void setup(){}\nvoid loop(){}',workspace:{},revision:0});
it('reports actual build boundaries and never represents a failed compile as post-build integrity success',async()=>fixture(async(s,p)=>{
 const events:BuildStageEvent[]=[],service=new FixtureToolchain(s.executable,s.root,undefined,event=>events.push(event));
 expect((await service.compile(p)).state).toBe('succeeded');
 expect(events.map(e=>e.stage)).toEqual(['toolchain','environment-before','compile','environment-after','artifacts']);
 expect(events.every(e=>e.projectId===p.id&&BuildStageEventSchema.safeParse(e).success)).toBe(true);
 events.length=0;service.compileReply={code:1,log:'explicit invalid fixture',stdout:'explicit invalid fixture',stderr:'',interrupted:false};
 expect((await service.compile(p)).state).toBe('failed');
 expect(events.map(e=>e.stage)).toEqual(['toolchain','environment-before','compile','artifacts']);
 expect(BuildStageEventSchema.safeParse({projectId:p.id,stage:'succeeded'}).success).toBe(false);
 expect(BuildStageEventSchema.safeParse({projectId:'other',stage:'compile'}).success).toBe(false);
}));
it('changed CLI, core or library content and a rewritten environment manifest cannot reach upload',async()=>fixture(async(s,p)=>{
 const build=await s.compile(p),folder=join(s.root,'builds',build.operationId),manifestPath=join(folder,'manifest.json'),manifest=JSON.parse(await readFile(manifestPath,'utf8'));expect(manifest.environment.scope).toBe('cli-selected-core-installed-tools-user-libraries-v2');expect(s.calls.find(c=>c[0]==='compile')).toContain('--clean');
 await writeFile(s.executable,'changed CLI');await expect(s.upload(p,build.operationId,'COM3')).rejects.toThrow('BUILD_ENVIRONMENT_CHANGED');await prepareEnvironmentFixture(s.root);
 const platform=join(s.root,'data','packages','esp32','hardware','esp32','3.3.12','platform.txt');await writeFile(platform,'changed core');await expect(s.upload(p,build.operationId,'COM3')).rejects.toThrow('BUILD_ENVIRONMENT_CHANGED');await prepareEnvironmentFixture(s.root);
 const libs=join(s.root,'user','libraries','Motor');await mkdir(libs,{recursive:true});await writeFile(join(libs,'Motor.h'),'new library');await expect(s.upload(p,build.operationId,'COM3')).rejects.toThrow('BUILD_ENVIRONMENT_CHANGED');await rm(join(s.root,'user'),{recursive:true});
 await writeFile(manifestPath,JSON.stringify({...manifest,environment:{...manifest.environment,sha256:'0'.repeat(64)}}));await expect(s.upload(p,build.operationId,'COM3')).rejects.toThrow('BUILD_ENVIRONMENT_CHANGED');expect(s.calls.some(c=>c[0]==='upload')).toBe(false);
}));
it('an environment changed during compilation cannot publish a successful uploadable build',async()=>fixture(async(s,p)=>{
 const old=await s.compile(p);s.duringCompile=async()=>{await writeFile(s.executable,'changed while compiling');};await expect(s.compile(p)).rejects.toThrow('BUILD_ENVIRONMENT_CHANGED');
 const failedId=(await readdir(join(s.root,'builds'))).find(id=>id!==old.operationId)!;
 const failed=JSON.parse(await readFile(join(s.root,'builds',failedId,'manifest.json'),'utf8'));
 expect(failed).toMatchObject({operationId:failedId,state:'failed',exitCode:0,error:'BUILD_ENVIRONMENT_CHANGED',artifacts:[],artifactHashes:{},log:'fixture compile'});
 expect(failed.environmentAfter.sha256).not.toBe(failed.environment.sha256);expect(failed.sourceFileHashes['sketch.ino']).toMatch(/^[a-f0-9]{64}$/);
 await expect(s.upload(p,old.operationId,'COM3')).rejects.toThrow('BUILD_STALE');await expect(s.upload(p,failedId,'COM3')).rejects.toThrow('BUILD_STALE');expect(s.calls.some(c=>c[0]==='upload')).toBe(false);
}));
it('modified external compiler or SDK content refuses upload and a during-build change invalidates older builds',async()=>fixture(async(s,p)=>{
 const tools=join(s.root,'data','packages','esp32','tools','compiler','fixture');await mkdir(tools,{recursive:true});const compiler=join(tools,'compiler.exe');await writeFile(compiler,'original fixture compiler');const build=await s.compile(p);
 await writeFile(compiler,'modified fixture compiler');await expect(s.upload(p,build.operationId,'COM3')).rejects.toThrow('BUILD_ENVIRONMENT_CHANGED');expect(s.calls.some(c=>c[0]==='upload')).toBe(false);
 await writeFile(compiler,'original fixture compiler');s.duringCompile=async()=>{await writeFile(join(tools,'sdk.a'),'new SDK during build');};await expect(s.compile(p)).rejects.toThrow('BUILD_ENVIRONMENT_CHANGED');await expect(s.upload(p,build.operationId,'COM3')).rejects.toThrow('BUILD_STALE');expect(s.calls.some(c=>c[0]==='upload')).toBe(false);
}));
async function fixture(fn:(service:FixtureToolchain,p:Project)=>Promise<void>){const dir=await mkdtemp(join(tmpdir(),'jective-build-'));try{await fn(new FixtureToolchain(await prepareEnvironmentFixture(dir),dir),project());}finally{await rm(dir,{recursive:true,force:true});}}
it('compiler refuses provisional wiring and wrong, missing or unreadable toolchain versions before compiling',async()=>fixture(async(s,p)=>{
 await expect(s.compile({...p,profileId:'jective-prototype'})).rejects.toThrow('WIRING_UNASSIGNED');expect(s.calls).toEqual([]);s.version='Version: 9.0';await expect(s.compile(p)).rejects.toThrow('CLI_VERSION_MISMATCH');s.version='Version: 1.5.1 fixture';s.cores={code:1,log:'fixture query failure',stdout:'fixture query failure',stderr:'',interrupted:false};await expect(s.compile(p)).rejects.toThrow('CORE_QUERY_FAILED');s.cores={code:0,log:'{bad json',stdout:'{bad json',stderr:'',interrupted:false};await expect(s.compile(p)).rejects.toThrow();s.cores.log=s.cores.stdout=JSON.stringify({platforms:[]});await expect(s.compile(p)).rejects.toThrow('CORE_MISSING');s.cores.log=s.cores.stdout=JSON.stringify({platforms:[{id:'esp32:esp32',installed_version:'3.3.11'}]});await expect(s.compile(p)).rejects.toThrow('CORE_VERSION_MISMATCH');expect(s.calls.some(c=>c[0]==='compile')).toBe(false);
}));
it('successful compilation records artifact hashes; stale source and changed artifacts refuse upload before invoking it',async()=>fixture(async(s,p)=>{
 const build=await s.compile(p);expect(build.state).toBe('succeeded');const folder=join(s.root,'builds',build.operationId);const manifest=JSON.parse(await readFile(join(folder,'manifest.json'),'utf8'));expect(manifest.artifactHashes['sketch.ino.bin']).toMatch(/^[a-f0-9]{64}$/);expect(await readFile(join(folder,'sketch','sketch.ino'),'utf8')).toBe(p.source);await expect(s.upload({...p,source:p.source+' changed'},build.operationId,'COM3')).rejects.toThrow('BUILD_STALE');await writeFile(join(folder,'output','sketch.ino.bin'),'tampered fixture');await expect(s.upload(p,build.operationId,'COM3')).rejects.toThrow('ARTIFACT_CHANGED');expect(s.calls.some(c=>c[0]==='upload')).toBe(false);
}));
it('a failed, incomplete or interrupted rebuild invalidates a previously successful build',async()=>fixture(async(s,p)=>{
 const initial=await s.compile(p);s.compileReply={code:1,log:'fixture failure',stdout:'fixture failure',stderr:'',interrupted:false};expect((await s.compile(p)).state).toBe('failed');await expect(s.upload(p,initial.operationId,'COM3')).rejects.toThrow('BUILD_STALE');s.compileReply={code:0,log:'fixture incomplete',stdout:'fixture incomplete',stderr:'',interrupted:false};s.files=['sketch.ino.bin'];expect((await s.compile(p)).state).toBe('failed');s.files=['sketch.ino.bin','sketch.ino.elf'];s.compileReply={code:null,log:'fixture cancelled',stdout:'fixture cancelled',stderr:'',interrupted:true};expect((await s.compile(p)).state).toBe('interrupted');s.compileReply={code:null,log:'fixture closed',stdout:'fixture closed',stderr:'',interrupted:false};expect((await s.compile(p)).state).toBe('interrupted');
}));
it('incomplete, duplicate and traversal artifact manifests cannot reach the upload command',async()=>fixture(async(s,p)=>{
 const build=await s.compile(p);const path=join(s.root,'builds',build.operationId,'manifest.json');const original=JSON.parse(await readFile(path,'utf8'));for(const artifacts of [[],['sketch.ino.bin'],['sketch.ino.bin','sketch.ino.elf','sketch.ino.bin']]){await writeFile(path,JSON.stringify({...original,artifacts}));await expect(s.upload(p,build.operationId,'COM3')).rejects.toThrow('BUILD_ARTIFACTS_INCOMPLETE');}await writeFile(path,JSON.stringify({...original,artifacts:[...original.artifacts,'../escape.bin']}));await expect(s.upload(p,build.operationId,'COM3')).rejects.toThrow('ARTIFACT_CHANGED');expect(s.calls.some(c=>c[0]==='upload')).toBe(false);
}));
it('upload uses compiled input without rebuilding and records success, failure and interruption distinctly',async()=>fixture(async(s,p)=>{
 const build=await s.compile(p);for(const [reply,state] of [[{code:0,log:'fixture success',stdout:'fixture success',stderr:'',interrupted:false},'succeeded'],[{code:1,log:'fixture failed',stdout:'fixture failed',stderr:'',interrupted:false},'failed'],[{code:null,log:'fixture cancelled',stdout:'fixture cancelled',stderr:'',interrupted:true},'interrupted'],[{code:null,log:'fixture no exit code',stdout:'fixture no exit code',stderr:'',interrupted:false},'interrupted']] as const){s.uploadReply=reply;const result=await s.upload(p,build.operationId,'COM3');expect(result.state).toBe(state);const record=JSON.parse(await readFile(join(s.root,'builds',build.operationId,'upload-'+result.operationId+'.json'),'utf8'));expect(record.physical).toBe('NOT RUN');expect(record.handshake).toBe('NOT RUN');}expect(s.calls.filter(c=>c[0]==='compile')).toHaveLength(1);const upload=s.calls.find(c=>c[0]==='upload')!;expect(upload).toContain('--input-dir');expect(upload).toContain('COM3');
}));

it('parses core JSON from stdout while retaining stderr warnings separately',async()=>fixture(async(s,p)=>{
 s.cores.stderr='Warning: explicit fixture diagnostic';s.cores.log+=s.cores.stderr;
 s.versionWarning='Warning: explicit version diagnostic';
 const result=await s.compile(p);expect(result.state).toBe('succeeded');
 const manifest=JSON.parse(await readFile(join(s.root,'builds',result.operationId,'manifest.json'),'utf8'));
 expect(manifest.cliVersion).toBe(s.version);
 s.cores.stdout='{invalid stdout';s.cores.stderr=JSON.stringify({platforms:[{id:'esp32:esp32',installed_version:'3.3.12'}]});s.cores.log=s.cores.stderr;
 await expect(s.compile(p)).rejects.toThrow();
}));
it('cannot validate a mismatching CLI using a version string printed only to stderr',async()=>fixture(async(s,p)=>{
 s.version='Version: 9.0';s.versionWarning='Version: 1.5.1 fixture';
 await expect(s.compile(p)).rejects.toThrow('CLI_VERSION_MISMATCH');expect(s.calls).toEqual([['version']]);
}));

it('exposes only journals belonging to this service and records compiler/upload raw provenance',async()=>fixture(async(s,p)=>{
 const build=await s.compile(p);expect((await s.journalPage(build.operationId,0)).text).toBe('explicit fixture raw output');const manifest=JSON.parse(await readFile(join(s.root,'builds',build.operationId,'manifest.json'),'utf8'));expect(manifest.rawLogFile).toBe('compiler.raw.log');
 const destination=join(s.root,'export.log');await s.exportJournal(build.operationId,destination);expect(await readFile(destination,'utf8')).toBe('explicit fixture raw output');
 const upload=await s.upload(p,build.operationId,'COM8');expect((await s.journalPage(upload.operationId,0)).text).toBe('explicit fixture raw output');
 const other=new ToolchainService(s.executable,s.root);expect(()=>other.journalPage(build.operationId,0)).toThrow('PROCESS_LOG_UNAVAILABLE');
}));
