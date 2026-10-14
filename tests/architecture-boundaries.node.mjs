import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifyBrowserBoundary,checkArchitecture} from '../scripts/architecture-check.mjs';

test('current renderer, workers, preload and contracts respect native/server boundaries',async()=>{
 assert.equal((await checkArchitecture()).status,'PASS');
});
test('transitive native import is refused, even when hidden behind a shared module',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-boundary-'));
 try{
  await writeFile(join(root,'entry.js'),"export {read} from './shared.js';");
  await writeFile(join(root,'shared.js'),"import {readFileSync} from 'node:fs'; export const read=()=>readFileSync('secret');");
  await assert.rejects(verifyBrowserBoundary([join(root,'entry.js')]),/ARCHITECTURE_NATIVE_IMPORT/);
  await writeFile(join(root,'shared.js'),"import {safeStorage} from 'electron'; export const read=()=>safeStorage.isEncryptionAvailable();");
  await assert.rejects(verifyBrowserBoundary([join(root,'entry.js')],{allowPreload:true}),/ARCHITECTURE_NATIVE_IMPORT/);
 }finally{await rm(root,{recursive:true,force:true});}
});
