import {it,expect,vi} from 'vitest';
import {mkdtemp,readFile,readdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
vi.mock('node:crypto',async original=>({...await original<typeof import('node:crypto')>(),randomUUID:()=> '00000000-0000-4000-8000-000000000042'}));
import {replaceFileAtomically} from '../packages/persistence/atomic-file';
it('pre-publication failure preserves committed bytes and cleans only its owned temporary file',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-atomic-file-')),path=join(root,'project.json');
 try{
  await writeFile(path,'original');await expect(replaceFileAtomically(path,'new',async()=>{throw new Error('EXPLICIT_PRECOMMIT_FAILURE');})).rejects.toThrow('EXPLICIT_PRECOMMIT_FAILURE');expect(await readFile(path,'utf8')).toBe('original');expect(await readdir(root)).toEqual(['project.json']);
  const temporary=path+'.00000000-0000-4000-8000-000000000042.tmp';await writeFile(temporary,'PREEXISTING FILE');await expect(replaceFileAtomically(path,'new')).rejects.toHaveProperty('code','EEXIST');expect(await readFile(path,'utf8')).toBe('original');expect(await readFile(temporary,'utf8')).toBe('PREEXISTING FILE');
 }finally{if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-atomic-file-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true});}
});
