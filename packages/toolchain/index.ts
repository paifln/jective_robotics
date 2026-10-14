import {snapshotEnvironment,EnvironmentSnapshotSchema} from './environment';
import {spawn,type ChildProcess} from 'node:child_process';
import {mkdir,writeFile,readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {StringDecoder} from 'node:string_decoder';
import {ProcessJournal} from './process-journal';
import {readJournalPage,copyJournal} from './journal-reader';
import {indicatorPin} from '../profiles/project';
import {verifyProjectProfile} from '../profiles/binding';
import {ProjectSchema,type Project,type BuildResult} from '../contracts';
import {sourceEntries,sortedSourceFiles} from '../contracts/source-files';
import {verifySourceSnapshot} from './source-snapshot';
import {z} from 'zod';
import type {BuildStage,BuildStageEvent} from '../contracts/build-stage';
export function buildSourceHash(project:Project){const hash=createHash('sha256').update(project.source).update(JSON.stringify(verifyProjectProfile(project).profile)).update(JSON.stringify(project.wiring??{}));const files=sortedSourceFiles(project.sourceFiles);if(files.length)hash.update('\0sourceFiles\0').update(JSON.stringify(files));return hash.digest('hex');}
export class ToolchainService {
  private hashing=false;private hashInterrupted=false;
  private async environment(coreVersion:string){this.hashing=true;this.hashInterrupted=false;try{return await this.snapshotter(this.executable,this.root,coreVersion,()=>this.hashInterrupted);}finally{this.hashing=false;}}
  private child:ChildProcess|null=null;
  private running=false;
  private interrupted=false;
  private latestBuild=new Map<string,string>();
  private latestEnvironment=new Map<string,string>();
  private journals=new Map<string,string>();
  private rememberJournal(id:string,path:string){this.journals.set(id,path);if(this.journals.size>50)this.journals.delete(this.journals.keys().next().value!);}
  private journalPath(id:unknown){const path=this.journals.get(z.uuid().parse(id));if(!path)throw new Error('PROCESS_LOG_UNAVAILABLE');return path;}
  journalPage(id:unknown,offset:unknown){return readJournalPage(this.root,this.journalPath(id),offset);}
  exportJournal(id:unknown,destination:string){return copyJournal(this.root,this.journalPath(id),destination);}
  constructor(readonly executable:string,readonly root:string,private readonly snapshotter:typeof snapshotEnvironment=snapshotEnvironment,private readonly onStage:(event:BuildStageEvent)=>void=()=>{}){}
  async config(){await mkdir(this.root,{recursive:true});const file=join(this.root,'arduino-cli.yaml');await writeFile(file,JSON.stringify({directories:{data:join(this.root,'data'),downloads:join(this.root,'downloads'),user:join(this.root,'user')},board_manager:{additional_urls:['https://espressif.github.io/arduino-esp32/package_esp32_index.json']}}));return file;}
  async run(args:string[],timeout=180000,rawLogPath?:string):Promise<{code:number|null;log:string;stdout:string;stderr:string;interrupted:boolean}>{
    if(this.running)throw new Error('TOOLCHAIN_BUSY');this.running=true;this.interrupted=false;
    let config:string;try{config=await this.config();}catch(e){this.running=false;throw e;}
    if(this.interrupted){this.running=false;return {code:null,log:'',stdout:'',stderr:'',interrupted:true};}
    let journal:ProcessJournal|undefined;
    try{if(rawLogPath)journal=await ProcessJournal.open(rawLogPath,()=>this.cancel());}catch(error){this.running=false;throw error;}
    if(this.interrupted){try{await journal?.close();}finally{this.running=false;}return {code:null,log:'',stdout:'',stderr:'',interrupted:true};}
    return new Promise((resolve,reject)=>{
      const child=spawn(this.executable,[...args,'--config-file',config],{shell:false,windowsHide:true});this.child=child;let log='',stdout='',stderr='';let settled=false;
      const timer=setTimeout(()=>this.cancel(),timeout);
      const finish=()=>{clearTimeout(timer);this.child=null;this.running=false;};
      const stdoutDecoder=new StringDecoder('utf8'),stderrDecoder=new StringDecoder('utf8');
      const tail=(text:string)=>{text=text.slice(-1000000);const first=text.charCodeAt(0);return first>=0xdc00&&first<=0xdfff?text.slice(1):text;};
      const append=(pipe:'stdout'|'stderr',text:string)=>{if(pipe==='stdout')stdout=tail(stdout+text);else stderr=tail(stderr+text);log=tail(log+text);};
      const capture=(pipe:'stdout'|'stderr',chunk:Buffer)=>{journal?.write(chunk,()=>{child.stdout?.pause();child.stderr?.pause();},()=>{child.stdout?.resume();child.stderr?.resume();});append(pipe,(pipe==='stdout'?stdoutDecoder:stderrDecoder).write(chunk));};
      child.stdout?.on('data',(chunk:Buffer)=>capture('stdout',chunk));child.stderr?.on('data',(chunk:Buffer)=>capture('stderr',chunk));
      child.once('error',e=>{if(!settled){settled=true;void (async()=>{try{await journal?.close();}finally{finish();}})().then(()=>reject(new Error('CLI_UNAVAILABLE: '+e.message)),reject);}});
      child.once('close',code=>{if(!settled){append('stdout',stdoutDecoder.end());append('stderr',stderrDecoder.end());settled=true;void (async()=>{try{await journal?.close();return {code,log,stdout,stderr,interrupted:this.interrupted};}finally{finish();}})().then(resolve,reject);}});
    });
  }
  cancel(){if(this.hashing){this.hashInterrupted=true;return true;}if(!this.running)return false;this.interrupted=true;if(!this.child)return true;this.child.stdout?.resume();this.child.stderr?.resume();if(process.platform==='win32'&&this.child.pid){const target=this.child;const killer=spawn('taskkill.exe',['/pid',String(target.pid),'/T','/F'],{shell:false,windowsHide:true,stdio:'ignore'});killer.on('error',()=>target.kill());return true;}return this.child.kill();}
  async compile(project:Project):Promise<BuildResult>{
    project=ProjectSchema.parse(project);
    const stage=(value:BuildStage)=>this.onStage({projectId:project.id,stage:value});
    this.latestBuild.delete(project.id);this.latestEnvironment.delete(project.id);if(project.mode==='blocks')indicatorPin(project);
    const profile=verifyProjectProfile(project).profile;if(profile.provisional)throw new Error('WIRING_UNASSIGNED: JECTIVE hardware is provisional');
    stage('toolchain');const version=await this.run(['version']);if(version.code!==0||!version.stdout.includes('Version: 1.5.1 '))throw new Error('CLI_VERSION_MISMATCH: requires Arduino CLI 1.5.1');
    const cores=await this.run(['core','list','--json']);if(cores.code!==0)throw new Error('CORE_QUERY_FAILED: '+cores.log);
    const installed=z.object({platforms:z.array(z.object({id:z.string(),installed_version:z.string().optional()}))}).parse(JSON.parse(cores.stdout));
    const core=installed.platforms.find(p=>p.id===profile.core);if(!core?.installed_version)throw new Error('CORE_MISSING: run the approved toolchain setup procedure');if(core.installed_version!==profile.coreVersion)throw new Error('CORE_VERSION_MISMATCH: requires '+profile.coreVersion);
    stage('environment-before');const environment=await this.environment(profile.coreVersion);
    const operationId=randomUUID();const sourceHash=buildSourceHash(project);
    const folder=join(this.root,'builds',operationId);const sketch=join(folder,'sketch');const output=join(folder,'output');
    await mkdir(sketch,{recursive:true});await mkdir(output);const sourceFileHashes:Record<string,string>={};for(const [name,text]of sourceEntries(project)){await writeFile(join(sketch,name),text,{flag:'wx'});sourceFileHashes[name]=createHash('sha256').update(text).digest('hex');}
    this.rememberJournal(operationId,join(folder,'compiler.raw.log'));
    stage('compile');const result=await this.run(['compile','--clean','--fqbn',profile.fqbn,'--build-path',output,sketch],180000,join(folder,'compiler.raw.log'));
    if(result.code===0){
      stage('environment-after');const environmentAfter=await this.environment(profile.coreVersion);
      if(environmentAfter.sha256!==environment.sha256){
        // Preserve the failed integrity check for diagnosis without publishing any
        // upload candidate. The compiler's exit code alone is not build success.
        await writeFile(join(folder,'manifest.json'),JSON.stringify({operationId,state:'failed',sourceHash,artifacts:[],exitCode:result.code,log:result.log,rawLogFile:'compiler.raw.log',error:'BUILD_ENVIRONMENT_CHANGED',profile,cliVersion:version.stdout.trim(),coreVersion:core.installed_version,fqbn:profile.fqbn,environment,environmentAfter,sourceFileHashes,artifactHashes:{}},null,2),{flag:'wx'});
        throw new Error('BUILD_ENVIRONMENT_CHANGED');
      }
    }
    stage('artifacts');
    const artifacts=result.code===0?(await readdir(output)).filter(f=>f.endsWith('.bin')||f.endsWith('.elf')):[];
    const state:BuildResult['state']=result.interrupted||result.code===null?'interrupted':result.code===0&&artifacts.includes('sketch.ino.bin')&&artifacts.includes('sketch.ino.elf')?'succeeded':'failed';
    const manifest={operationId,state,sourceHash,artifacts,exitCode:result.code,log:result.log};
    const hashes:Record<string,string>={};for(const f of artifacts)hashes[f]=createHash('sha256').update(await readFile(join(output,f))).digest('hex');
    await writeFile(join(folder,'manifest.json'),JSON.stringify({...manifest,rawLogFile:'compiler.raw.log',profile,cliVersion:version.stdout.trim(),coreVersion:core.installed_version,fqbn:profile.fqbn,environment,sourceFileHashes,artifactHashes:hashes},null,2));if(state==='succeeded'){this.latestBuild.set(project.id,operationId);this.latestEnvironment.set(project.id,environment.sha256);}return manifest;
  }
  async upload(project:Project,operationId:string,port:string):Promise<BuildResult>{
   project=ProjectSchema.parse(project);
   if(project.mode==='blocks')indicatorPin(project);const profile=verifyProjectProfile(project).profile;if(profile.provisional)throw new Error('WIRING_UNASSIGNED');if(!/^COM[1-9]\d{0,3}$/i.test(port))throw new Error('PORT_INVALID');if(this.latestBuild.get(project.id)!==operationId)throw new Error('BUILD_STALE: compile this source successfully before upload');
   const folder=join(this.root,'builds',z.uuid().parse(operationId));const manifest=z.object({state:z.literal('succeeded'),sourceHash:z.string().regex(/^[a-f0-9]{64}$/),artifacts:z.array(z.string()).refine(files=>new Set(files).size===files.length&&files.includes('sketch.ino.bin')&&files.includes('sketch.ino.elf'),'BUILD_ARTIFACTS_INCOMPLETE'),artifactHashes:z.record(z.string(),z.string().regex(/^[a-f0-9]{64}$/))}).parse(JSON.parse(await readFile(join(folder,'manifest.json'),'utf8')));if(manifest.sourceHash!==buildSourceHash(project))throw new Error('BUILD_STALE');for(const file of manifest.artifacts){if(!/^[a-zA-Z0-9_.-]+$/.test(file)||createHash('sha256').update(await readFile(join(folder,'output',file))).digest('hex')!==manifest.artifactHashes[file])throw new Error('ARTIFACT_CHANGED');}
   await verifySourceSnapshot(folder,project);
   const environment=EnvironmentSnapshotSchema.parse(JSON.parse(await readFile(join(folder,'manifest.json'),'utf8')).environment);if(environment.sha256!==this.latestEnvironment.get(project.id)||(await this.environment(profile.coreVersion)).sha256!==environment.sha256)throw new Error('BUILD_ENVIRONMENT_CHANGED');
   const uploadId=randomUUID();this.rememberJournal(uploadId,join(folder,'upload-'+uploadId+'.raw.log'));const result=await this.run(['upload','--fqbn',profile.fqbn,'--port',port,'--input-dir',join(folder,'output'),join(folder,'sketch')],180000,join(folder,'upload-'+uploadId+'.raw.log'));const value:BuildResult={operationId:uploadId,sourceHash:manifest.sourceHash,state:result.interrupted||result.code===null?'interrupted':result.code===0?'succeeded':'failed',exitCode:result.code,log:result.log,artifacts:[]};await writeFile(join(folder,'upload-'+value.operationId+'.json'),JSON.stringify({...value,rawLogFile:'upload-'+uploadId+'.raw.log',port,handshake:'NOT RUN',physical:'NOT RUN'},null,2));return value;
  }
}
