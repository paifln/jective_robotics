import {it,expect} from 'vitest';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {snapshotEnvironmentInThread} from '../apps/desktop/infrastructure/environment-thread';
import {snapshotEnvironment} from '../packages/toolchain/environment';
import {prepareEnvironmentFixture} from './helpers/toolchain-environment';

async function cleanup(root:string){if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-env-thread-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true});}
it('real worker returns the same content snapshot and propagates missing-file failures',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-thread-'));
 try{
  const worker=join(root,'worker.cjs');await build({entryPoints:['apps/desktop/environment.worker.ts'],outfile:worker,bundle:true,platform:'node',format:'cjs',external:['original-fs']});
  const cli=await prepareEnvironmentFixture(root),expected=await snapshotEnvironment(cli,root,'3.3.12');
  expect(await snapshotEnvironmentInThread(cli,root,'3.3.12',()=>false,worker)).toEqual(expected);
  await expect(snapshotEnvironmentInThread(join(root,'missing.exe'),root,'3.3.12',()=>false,worker)).rejects.toThrow('ENOENT');
 }finally{await cleanup(root);}
});
it('rejects malformed replies, crashes, early exits and cancellation without returning a trusted snapshot',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-env-thread-'));
 try{
  const worker=join(root,'worker.cjs');
  await writeFile(worker,"require('node:worker_threads').parentPort.postMessage({ok:true,value:{sha256:'fake'}})");
  await expect(snapshotEnvironmentInThread('fixture',root,'3.3.12',()=>false,worker)).rejects.toThrow('INVALID_REPLY');
  await writeFile(worker,"throw new Error('FIXTURE_WORKER_CRASH')");
  await expect(snapshotEnvironmentInThread('fixture',root,'3.3.12',()=>false,worker)).rejects.toThrow('FIXTURE_WORKER_CRASH');
  await writeFile(worker,'process.exit(0)');
  await expect(snapshotEnvironmentInThread('fixture',root,'3.3.12',()=>false,worker)).rejects.toThrow('WORKER_EXIT');
  await expect(snapshotEnvironmentInThread('fixture',root,'3.3.12',()=>true,worker)).rejects.toThrow('BUILD_INTERRUPTED');
  await writeFile(worker,'setInterval(()=>{},1000)');let cancelled=false;const pending=snapshotEnvironmentInThread('fixture',root,'3.3.12',()=>cancelled,worker);cancelled=true;
  await expect(pending).rejects.toThrow('BUILD_INTERRUPTED');
  await expect(snapshotEnvironmentInThread('fixture',root,'3.3.12',()=>false,worker,100)).rejects.toThrow('ENVIRONMENT_WORKER_TIMEOUT');
  await expect(snapshotEnvironmentInThread('fixture',root,'3.3.12',()=>false,worker,0)).rejects.toThrow('TIMEOUT_INVALID');
 }finally{await cleanup(root);}
});
