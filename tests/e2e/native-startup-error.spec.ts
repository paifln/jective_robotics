import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
const executable:unknown=createRequire(resolve('package.json'))('electron');
if(typeof executable!=='string')throw new Error('ELECTRON_EXECUTABLE_UNAVAILABLE');
const electronPath=executable;

test('a corrupt workspace produces a branded startup explanation without clearing its bytes',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-startup-native-')),database=join(root,'workspace.sqlite'),hook=join(root,'dialog-fixture.cjs');
 const sentinel='EXPLICIT CORRUPT DATABASE FIXTURE';
 await writeFile(database,sentinel);
 // Source-process hook observes native options; it is not shipped or enabled in production.
 await writeFile(hook,"const {dialog}=require('electron'); dialog.showMessageBox=async(...args)=>{const o=args.at(-1);process.stdout.write('JECTIVE_DIALOG_FIXTURE '+JSON.stringify({title:o.title,branded:!!o.icon&&!o.icon.isEmpty(),detail:o.detail,message:o.message,buttons:o.buttons})+'\\n');return {response:0,checkboxChecked:false};};");
 const env:NodeJS.ProcessEnv={...process.env,JECTIVE_WORKSPACE_ROOT:root};delete env.ELECTRON_RUN_AS_NODE;delete env.JECTIVE_ASSISTANT_SERVER;delete env.JECTIVE_ASSISTANT_TOKEN;
 try{
  const result=await new Promise<{code:number|null;stdout:string;stderr:string}>((resolve,reject)=>{
   const child=spawn(electronPath,['-r',hook,'.'],{env,windowsHide:true});let stdout='',stderr='';
   const timer=setTimeout(()=>{child.kill();reject(new Error('OWNED_STARTUP_FIXTURE_TIMEOUT'));},20000);
   child.stdout.on('data',chunk=>stdout=(stdout+String(chunk)).slice(-16000));child.stderr.on('data',chunk=>stderr=(stderr+String(chunk)).slice(-16000));child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',code=>{clearTimeout(timer);resolve({code,stdout,stderr});});
  });
  expect(result.code).toBe(0);const line=result.stdout.split('\n').find(line=>line.startsWith('JECTIVE_DIALOG_FIXTURE '));expect(line).toBeTruthy();const dialog=JSON.parse(line!.slice('JECTIVE_DIALOG_FIXTURE '.length));expect(dialog.branded).toBe(true);expect(dialog.title).toContain('JECTIVE');expect(dialog.message).toContain('Локальные данные проектов не очищены');expect(dialog.detail).toBe('JECTIVE OPERATION_FAILED');expect(dialog.buttons).toEqual(['Закрыть']);expect(await readFile(database,'utf8')).toBe(sentinel);
 }finally{if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-startup-native-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
