import {getCurrentFuseWire,FuseV1Options} from '@electron/fuses';
import {FuseState} from '@electron/fuses/dist/constants.js';
import {extractFile,getRawHeader,statFile} from '@electron/asar';
import {readFile,writeFile,copyFile,rename,mkdtemp,rm,mkdir,readdir} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,dirname,basename} from 'node:path';
import {tmpdir,type as osType,release as osRelease} from 'node:os';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
const version=JSON.parse(await readFile('package.json','utf8')).version;assert(/^0\.8\.\d+$/.test(version));
const snapshot=process.argv[2];if(snapshot)assert(/^[a-zA-Z0-9-]{1,60}$/.test(snapshot),'Snapshot must be a contained verification directory name');
const folder=resolve(snapshot?'.verification/'+snapshot+'/win-unpacked':'.verification/security-package-'+version+'/win-unpacked');
const guard=relative(resolve('.verification'),folder);assert(!guard.startsWith('..')&&!isAbsolute(guard));
const executable=join(folder,'JECTIVE Robotics Studio.exe'),archive=join(folder,'resources','app.asar');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fuses=await getCurrentFuseWire(executable);const expected=new Map([[FuseV1Options.RunAsNode,FuseState.DISABLE],[FuseV1Options.EnableCookieEncryption,FuseState.ENABLE],[FuseV1Options.EnableNodeOptionsEnvironmentVariable,FuseState.DISABLE],[FuseV1Options.EnableNodeCliInspectArguments,FuseState.DISABLE],[FuseV1Options.EnableEmbeddedAsarIntegrityValidation,FuseState.ENABLE],[FuseV1Options.OnlyLoadAppFromAsar,FuseState.ENABLE],[FuseV1Options.GrantFileProtocolExtraPrivileges,FuseState.DISABLE]]);for(const [key,value]of expected)assert.equal(fuses[key],value);
async function builtFiles(directory,prefix=''){
 const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){
  assert(!entry.isSymbolicLink(),'Built assets must not be linked');const name=prefix+entry.name;
  if(entry.isDirectory())files.push(...await builtFiles(join(directory,entry.name),name+'/'));else{assert(entry.isFile());files.push(name);}
 }return files.sort();
}
const files=await builtFiles('dist');for(const file of ['main.cjs','preload.cjs','environment.worker.cjs','renderer/app.js','renderer/app.css','renderer/index.html'])assert(files.includes(file),'Missing built asset: '+file);
const packaged={};for(const file of files){const bytes=extractFile(archive,join('dist',file));assert.equal(sha(bytes),sha(await readFile('dist/'+file)),'Packaged asset differs: '+file);packaged[file]=sha(bytes);}
assert.equal(JSON.parse(extractFile(archive,'package.json')).version,version);assert.equal(sha(await readFile(join(folder,'resources','tools','arduino-cli.exe'))),sha(await readFile('.toolchain/bin/arduino-cli.exe')));
const originalHash=sha(await readFile(archive)),roots=[];let child=null,duplicate=null,backup=null;
async function temporary(){const root=await mkdtemp(join(tmpdir(),'jective-secure-smoke-'));roots.push(root);return root;}
function launch(root){const env={...process.env,JECTIVE_WORKSPACE_ROOT:root};delete env.ELECTRON_RUN_AS_NODE;const p=spawn(executable,[],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';p.stdout.on('data',chunk=>{log=(log+chunk).slice(-32000);});p.stderr.on('data',chunk=>{log=(log+chunk).slice(-32000);});p.on('error',e=>{log+=e.message;});return {p,log:()=>log};}
async function waitUntil(check,timeout){const deadline=Date.now()+timeout;do{if(await check())return true;await new Promise(r=>setTimeout(r,250));}while(Date.now()<deadline);return false;}
async function stop(owned){if(!owned||owned.exitCode!==null||owned.signalCode!==null)return;await new Promise(resolveStop=>{const killer=spawn('taskkill.exe',['/pid',String(owned.pid),'/T','/F'],{windowsHide:true,stdio:'ignore',shell:false});killer.once('error',()=>{owned.kill();resolveStop();});killer.once('exit',resolveStop);});await waitUntil(()=>owned.exitCode!==null||owned.signalCode!==null,5000);}
const report={checkedAt:new Date().toISOString(),host:{os:osType(),release:osRelease(),node:process.version},scope:'Isolated '+osType()+' '+osRelease()+' packaged startup, duplicate instance and intentional ASAR tamper; no physical upload; no installer installation',fuses,packaged};
try{
 const root=await temporary(),start=Date.now(),normal=launch(root);child=normal.p;
 const ready=await waitUntil(async()=>{if(child.exitCode!==null)return false;let db;try{db=new DatabaseSync(join(root,'workspace.sqlite'),{readOnly:true,allowExtension:false});return db.prepare("SELECT value FROM settings WHERE key='onboarded'").get()?.value==='true';}catch{return false;}finally{db?.close();}},30000);
 assert(ready,'Packaged renderer did not complete its workspace IPC initialization: '+normal.log());report.startup={rendererInitialized:true,elapsedMs:Date.now()-start};
 const second=launch(root);duplicate=second.p;assert(await waitUntil(()=>duplicate.exitCode!==null,10000),'Second instance did not exit');assert.equal(duplicate.exitCode,0);assert.equal(child.exitCode,null);report.singleInstance={secondExitCode:duplicate.exitCode,firstStillRunning:true};await stop(child);child=null;
 backup=archive+'.verified-original';await copyFile(archive,backup);const bytes=await readFile(archive),entry=statFile(archive,join('dist','main.cjs')),header=getRawHeader(archive),offset=8+header.headerSize+Number(entry.offset),newline=bytes.indexOf(10,offset);assert(newline>offset&&newline<offset+100);bytes[newline]=32;await writeFile(archive,bytes); // Valid JavaScript: change a newline after a semicolon into a space, keeping the integrity header unchanged.
 const tampered=launch(await temporary());child=tampered.p;assert(await waitUntil(()=>child.exitCode!==null||child.signalCode!==null,20000),'Tampered application did not fail promptly');assert(/integrity|hash/i.test(tampered.log()),'Exit alone is insufficient evidence of integrity enforcement: '+tampered.log());report.tamper={exitCode:child.exitCode,signalCode:child.signalCode,integrityDiagnostic:tampered.log(),mutation:'One whitespace byte in packed main.cjs; integrity header unchanged'};child=null;
}finally{await stop(duplicate);await stop(child);if(backup)await rename(backup,archive);assert.equal(sha(await readFile(archive)),originalHash);for(const root of roots){assert.equal(dirname(root),tmpdir());assert(basename(root).startsWith('jective-secure-smoke-'));await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}}
report.archiveRestored=true;report.exeSha256=sha(await readFile(executable));report.asarSha256=originalHash;
const evidence=snapshot?'evidence/package-snapshots/'+snapshot:'evidence/releases/'+version;await mkdir(evidence,{recursive:true});await writeFile(evidence+'/package-verification.json',JSON.stringify({...report,snapshot:snapshot??null},null,2));console.log('Packaged startup, duplicate instance, binary fuses, all built asset equality and ASAR tamper rejection verified.');



