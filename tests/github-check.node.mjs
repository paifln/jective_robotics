import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,copyFile,writeFile,unlink,rm} from 'node:fs/promises';
import {join,resolve,dirname,basename} from 'node:path';
import {tmpdir} from 'node:os';

test('GitHub candidate scan accepts a deleted unused file but rejects a remaining requirement pointing to it',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-github-candidates-'));
 try{
  await mkdir(join(root,'scripts'));await mkdir(join(root,'docs'));
  await copyFile(resolve('scripts/github-check.mjs'),join(root,'scripts/github-check.mjs'));await copyFile(resolve('.gitignore'),join(root,'.gitignore'));
  await writeFile(join(root,'README.md'),'# Isolated candidate scan fixture\n');await writeFile(join(root,'unused.ts'),'export const unused=true;\n');
  await writeFile(join(root,'docs/requirements.json'),JSON.stringify({sections:[],criteria:[]}));
  execFileSync('git',['init','--quiet'],{cwd:root,windowsHide:true});execFileSync('git',['add','--','.gitignore','README.md','scripts/github-check.mjs','docs/requirements.json','unused.ts'],{cwd:root,windowsHide:true,stdio:'pipe'});
  await unlink(join(root,'unused.ts'));
  const passed=JSON.parse(execFileSync(process.execPath,['scripts/github-check.mjs'],{cwd:root,windowsHide:true,encoding:'utf8'}));assert.equal(passed.status,'PASS');assert.deepEqual(passed.issues,[]);
  await writeFile(join(root,'docs/requirements.json'),JSON.stringify({sections:[{files:['unused.ts'],evidence:[]}],criteria:[]}));
  let failed;try{execFileSync(process.execPath,['scripts/github-check.mjs'],{cwd:root,windowsHide:true,encoding:'utf8'});}catch(error){assert.equal(error.status,1);failed=JSON.parse(error.stdout);}
  assert.equal(failed?.status,'FAIL');assert(failed.issues.some(issue=>issue.path==='unused.ts'&&issue.code==='REQUIREMENT_NOT_IN_CHECKOUT'));
 }finally{assert.equal(dirname(root),tmpdir());assert(basename(root).startsWith('jective-github-candidates-'));await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
