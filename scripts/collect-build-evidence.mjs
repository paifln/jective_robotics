import {readdir,readFile,mkdir,copyFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const root='.toolchain/workspace/builds';await mkdir('evidence/compiler',{recursive:true});
for(const id of await readdir(root)){const folder=join(root,id);try{const manifest=JSON.parse(await readFile(join(folder,'manifest.json'),'utf8'));for(const file of manifest.artifacts){const bytes=await readFile(join(folder,'output',file));if(createHash('sha256').update(bytes).digest('hex')!==manifest.artifactHashes[file])throw new Error('Artifact checksum mismatch: '+file);}await copyFile(join(folder,'manifest.json'),join('evidence/compiler',id+'.json'));await copyFile(join(folder,'sketch','sketch.ino'),join('evidence/compiler',id+'.ino'));}catch(e){console.error('Incomplete build retained:',id,String(e));}}
