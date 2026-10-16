import {it,expect,vi} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,lstat,readdir,rm,symlink,utimes} from 'node:fs/promises';
import {createReadStream,appendFileSync,truncateSync,type ReadStream} from 'node:fs';
import {Readable} from 'node:stream';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {snapshotEnvironment,snapshotEnvironmentUsing} from '../packages/toolchain/environment';
import {EnvironmentProgressSchema,type EnvironmentProgress} from '../packages/contracts/build-stage';
import {prepareEnvironmentFixture} from './helpers/toolchain-environment';
it('prefetches at most eight sibling stats and rejects a disappearing sibling',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-metadata-'));
 try{
  const cli=await prepareEnvironmentFixture(root),core=join(root,'data','packages','esp32','hardware','esp32','3.3.12');
  for(let i=0;i<19;i++)await writeFile(join(core,`header-${i}.h`),'content');
  const expected=await snapshotEnvironment(cli,root,'3.3.12');let active=0,peak=0;
  const delayed=(async(path)=>{active++;peak=Math.max(peak,active);try{await new Promise(done=>setTimeout(done,2));return await lstat(path);}finally{active--;}}) as typeof lstat;
  expect(await snapshotEnvironmentUsing(cli,root,'3.3.12',()=>false,{lstat:delayed,readdir,createReadStream})).toEqual(expected);
  // Eight prefetched siblings and up to eight concurrent post-read checks.
  expect(peak).toBeGreaterThan(1);expect(peak).toBeLessThanOrEqual(16);expect(active).toBe(0);
  const missing=(async(path)=>{if(String(path)===join(core,'header-7.h'))throw Object.assign(new Error('MISSING_SIBLING'),{code:'ENOENT'});return lstat(path);}) as typeof lstat;
  await expect(snapshotEnvironmentUsing(cli,root,'3.3.12',()=>false,{lstat:missing,readdir,createReadStream})).rejects.toThrow('MISSING_SIBLING');
 }finally{await rm(root,{recursive:true,force:true});}
});
it('reports only completed content verification and keeps observer failures out of the digest',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-progress-'));
 try{
  const cli=await prepareEnvironmentFixture(root),progress:EnvironmentProgress[]=[];
  const expected=await snapshotEnvironment(cli,root,'3.3.12');
  expect(await snapshotEnvironment(cli,root,'3.3.12',()=>false,value=>{progress.push(value);})).toEqual(expected);
  expect(progress.length).toBeGreaterThan(0);expect(progress.at(-1)).toMatchObject({files:expected.files,bytes:expected.bytes});
  for(let i=0;i<progress.length;i++){expect(EnvironmentProgressSchema.safeParse(progress[i]).success).toBe(true);expect(Object.keys(progress[i]!).sort()).toEqual(['bytes','elapsedMs','files']);if(i){expect(progress[i]!.files).toBeGreaterThanOrEqual(progress[i-1]!.files);expect(progress[i]!.bytes).toBeGreaterThanOrEqual(progress[i-1]!.bytes);}}
  expect(await snapshotEnvironment(cli,root,'3.3.12',()=>false,()=>{throw new Error('PRESENTATION_ONLY');})).toEqual(expected);
 }finally{await rm(root,{recursive:true,force:true});}
});
it('bounds out-of-order metadata behind a slow file while preserving the complete digest',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-reorder-'));let release!:()=>void,pending:Promise<unknown>|undefined;
 const gate=new Promise<void>(done=>{release=done;});let started=0;
 try{
  const cli=await prepareEnvironmentFixture(root),core=join(root,'data','packages','esp32','hardware','esp32','3.3.12'),names=Array.from({length:2200},(_,i)=>'virtual-'+i+'.h');
  const small=await lstat(cli);small.size=1;
  const virtual=(path:unknown)=>String(path).startsWith(join(core,'virtual-'));
  const io=(blocked:boolean)=>({
   lstat:(async(path)=>virtual(path)?small:lstat(path)) as typeof lstat,
   readdir:(async(path)=>String(path)===core?['platform.txt',...names]:readdir(path)) as typeof readdir,
   createReadStream:(path:Parameters<typeof createReadStream>[0])=>Readable.from((async function*(){started++;if(blocked&&String(path)===cli)await gate;yield virtual(path)?Buffer.from('x'):await readFile(path);})()) as ReadStream
  });
  const expected=await snapshotEnvironmentUsing(cli,root,'3.3.12',()=>false,io(false));started=0;
  pending=snapshotEnvironmentUsing(cli,root,'3.3.12',()=>false,io(true));
  await vi.waitFor(()=>expect(started).toBeGreaterThan(1000),{timeout:3000});await new Promise(done=>setTimeout(done,50));
  expect(started).toBeLessThanOrEqual(1024);release();expect(await pending).toEqual(expected);expect(expected.files).toBe(2202);
 }finally{release();await pending?.catch(()=>{});await rm(root,{recursive:true,force:true});}
});
it('small and empty files use bounded buffers without changing the full content digest',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-buffers-'));
 try{
  const cli=await prepareEnvironmentFixture(root),core=join(root,'data','packages','esp32','hardware','esp32','3.3.12');
  await writeFile(join(core,'empty.h'),'');await writeFile(join(core,'large.a'),Buffer.alloc(1024*1024+7,65));
  const legacy=await snapshotEnvironmentUsing(cli,root,'3.3.12',()=>false,{lstat,readdir,createReadStream:path=>createReadStream(path,{highWaterMark:256*1024})});
  const options=new Map<string,unknown>();
  const bounded=await snapshotEnvironmentUsing(cli,root,'3.3.12',()=>false,{lstat,readdir,createReadStream:(path,settings)=>{options.set(String(path),settings);return createReadStream(path,settings);}});
  expect(bounded).toEqual(legacy);expect(bounded.files).toBe(4);
  for(const [path,settings]of options){const {size}=await lstat(path);expect(settings).toEqual({highWaterMark:Math.max(1,Math.min(256*1024,size)),...(size>0?{start:0,end:size-1}:{})});}
 }finally{await rm(root,{recursive:true,force:true});}
});
it('bounded reads still reject growth and truncation after the initial stat',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-size-change-'));
 try{
  const cli=await prepareEnvironmentFixture(root);
  const changed=(mutate:()=>void)=>snapshotEnvironmentUsing(cli,root,'3.3.12',()=>false,{lstat,readdir,createReadStream:(path,options)=>{if(String(path)===cli)mutate();return createReadStream(path,options);}});
  await expect(changed(()=>appendFileSync(cli,'unexpected growth'))).rejects.toThrow('ENVIRONMENT_CHANGED_DURING_READ');
  await expect(changed(()=>truncateSync(cli,1))).rejects.toThrow('ENVIRONMENT_CHANGED_DURING_READ');
 }finally{await rm(root,{recursive:true,force:true});}
});
it('a slow stream does not stall free hashing slots, while concurrency and digest stay bounded',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-pool-'));let release!:()=>void,pending:Promise<unknown>|undefined;
 const gate=new Promise<void>(resolve=>{release=resolve;});let active=0,peak=0,started=0;
 try{
  const cli=await prepareEnvironmentFixture(root),core=join(root,'data','packages','esp32','hardware','esp32','3.3.12');
  for(let i=0;i<20;i++)await writeFile(join(core,'sample-'+i+'.txt'),'bounded fixture '+i);
  const baseline=await snapshotEnvironment(cli,root,'3.3.12');
  pending=snapshotEnvironmentUsing(cli,root,'3.3.12',()=>false,{lstat,readdir,createReadStream:path=>Readable.from((async function*(){
   active++;started++;peak=Math.max(peak,active);
   try{if(String(path)===cli)await gate;yield await readFile(path);}finally{active--;}
  })()) as ReadStream});
  await vi.waitFor(()=>expect(started).toBeGreaterThan(8),{timeout:1000});expect(peak).toBeLessThanOrEqual(8);
  release();expect(await pending).toEqual(baseline);expect(active).toBe(0);
 }finally{release();await pending?.catch(()=>{});await rm(root,{recursive:true,force:true});}
});

it('hashes actual CLI/core/library content and detects equal-sized changes even with preserved timestamps',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-'));try{const cli=await prepareEnvironmentFixture(root),baseline=await snapshotEnvironment(cli,root,'3.3.12');expect(baseline.files).toBe(2);expect(await snapshotEnvironment(cli,root,'3.3.12')).toEqual(baseline);await writeFile(cli,'explicit fixture XYZ bytes');await utimes(cli,new Date(0),new Date(0));expect((await snapshotEnvironment(cli,root,'3.3.12')).sha256).not.toBe(baseline.sha256);await writeFile(cli,'explicit fixture CLI bytes');expect((await snapshotEnvironment(cli,root,'3.3.12')).sha256).toBe(baseline.sha256);const libs=join(root,'user','libraries','Motor','src');await mkdir(libs,{recursive:true});const header=join(libs,'Motor.h');await writeFile(header,'void stop();');const installed=await snapshotEnvironment(cli,root,'3.3.12');expect(installed.sha256).not.toBe(baseline.sha256);await writeFile(header,'void move();');expect((await snapshotEnvironment(cli,root,'3.3.12')).sha256).not.toBe(installed.sha256);await rm(header);expect((await snapshotEnvironment(cli,root,'3.3.12')).sha256).not.toBe(installed.sha256);await expect(snapshotEnvironment(cli,root,'../../other')).rejects.toThrow('CORE_VERSION_INVALID');}
 finally{await rm(root,{recursive:true,force:true});}
});
it('rejects linked library directories instead of following them',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-link-'));try{const cli=await prepareEnvironmentFixture(root),user=join(root,'user');await mkdir(user);await symlink(root,join(user,'libraries'),process.platform==='win32'?'junction':'dir');await expect(snapshotEnvironment(cli,root,'3.3.12')).rejects.toThrow('ENVIRONMENT_LINK_UNSUPPORTED');}finally{await rm(root,{recursive:true,force:true});}
});
it('missing required inputs and a file in place of a library directory fail closed',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-missing-'));try{const cli=await prepareEnvironmentFixture(root);await expect(snapshotEnvironment(join(root,'missing.exe'),root,'3.3.12')).rejects.toThrow();await expect(snapshotEnvironment(cli,root,'3.3.11')).rejects.toThrow();await writeFile(join(root,'user'),'not a directory');await expect(snapshotEnvironment(cli,root,'3.3.12')).rejects.toThrow('ENVIRONMENT_FILE_UNSUPPORTED');}finally{await rm(root,{recursive:true,force:true});}
});
it('rejects a linked ancestor of the selected core and excessive library nesting',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-depth-'));try{const cli=await prepareEnvironmentFixture(root);await rm(join(root,'data'),{recursive:true});await symlink(root,join(root,'data'),process.platform==='win32'?'junction':'dir');await expect(snapshotEnvironment(cli,root,'3.3.12')).rejects.toThrow('ENVIRONMENT_LINK_UNSUPPORTED');await rm(join(root,'data'));await prepareEnvironmentFixture(root);await mkdir(join(root,'user','libraries',...Array.from({length:33},(_,i)=>'level'+i)),{recursive:true});await expect(snapshotEnvironment(cli,root,'3.3.12')).rejects.toThrow('ENVIRONMENT_TOO_DEEP');}finally{await rm(root,{recursive:true,force:true});}
});
it('cancellation stops before opening input files and during streamed input hashing',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-cancel-'));try{const cli=await prepareEnvironmentFixture(root);await expect(snapshotEnvironment(cli,root,'3.3.12',()=>true)).rejects.toThrow('BUILD_INTERRUPTED');let calls=0;await expect(snapshotEnvironment(cli,root,'3.3.12',()=>++calls>1)).rejects.toThrow('BUILD_INTERRUPTED');}finally{await rm(root,{recursive:true,force:true});}
});
it('binds installed compiler and SDK files across packagers, including additions, removals and timestamp-preserving edits',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-tools-'));try{
  const cli=await prepareEnvironmentFixture(root),baseline=await snapshotEnvironment(cli,root,'3.3.12');
  const tools=join(root,'data','packages','esp32','tools','compiler','1.0');await mkdir(tools,{recursive:true});const compiler=join(tools,'compiler.exe');await writeFile(compiler,'compiler AAA');const installed=await snapshotEnvironment(cli,root,'3.3.12');expect(installed.sha256).not.toBe(baseline.sha256);
  await writeFile(compiler,'compiler BBB');await utimes(compiler,new Date(0),new Date(0));expect((await snapshotEnvironment(cli,root,'3.3.12')).sha256).not.toBe(installed.sha256);await writeFile(compiler,'compiler AAA');expect((await snapshotEnvironment(cli,root,'3.3.12')).sha256).toBe(installed.sha256);
  const shared=join(root,'data','packages','builtin','tools','helper','1');await mkdir(shared,{recursive:true});await writeFile(join(shared,'sdk.a'),'SDK bytes');const sdk=await snapshotEnvironment(cli,root,'3.3.12');expect(sdk.sha256).not.toBe(installed.sha256);await rm(join(shared,'sdk.a'));expect((await snapshotEnvironment(cli,root,'3.3.12')).sha256).not.toBe(sdk.sha256);
  await symlink(root,join(tools,'linked-sdk'),process.platform==='win32'?'junction':'dir');await expect(snapshotEnvironment(cli,root,'3.3.12')).rejects.toThrow('ENVIRONMENT_LINK_UNSUPPORTED');
 }finally{await rm(root,{recursive:true,force:true});}
});
