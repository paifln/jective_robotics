import {readdir,stat,readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,relative,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
const sevenZip={path7za:resolve('.toolchain/host/7zr.exe')};
const root=resolve('.toolchain/workspace');const files=[];
async function walk(path){for(const entry of await readdir(path,{withFileTypes:true})){const item=join(path,entry.name);if(entry.isSymbolicLink())throw new Error('Symlink not allowed: '+item);if(entry.isDirectory())await walk(item);else if(entry.isFile()){const size=(await stat(item)).size;files.push({path:relative(root,item).replaceAll('\\','/'),size,sha256:createHash('sha256').update(await readFile(item)).digest('hex')});}}}
await mkdir(join(root,'user'),{recursive:true});await walk(join(root,'data'));await walk(join(root,'user'));files.sort((a,b)=>a.path.localeCompare(b.path));await writeFile(join(root,'jective-toolchain-manifest.json'),JSON.stringify({format:'jective-toolchain',version:1,cli:'1.5.1',core:'esp32:esp32@3.3.12',files},null,2));
await mkdir('release',{recursive:true});const output=resolve('release/JECTIVE-offline-toolchain-1.5.1-esp32-3.3.12.7z');
await new Promise((done,reject)=>{const child=spawn(sevenZip.path7za,['a','-t7z','-mx=3',output,'data','user','jective-toolchain-manifest.json'],{cwd:root,shell:false,windowsHide:true,stdio:'inherit'});child.once('error',reject);child.once('exit',code=>code===0?done():reject(new Error('7zip exited '+code)));});
await writeFile('evidence/offline-bundle.json',JSON.stringify({file:output,size:(await stat(output)).size,unpackedBytes:files.reduce((a,f)=>a+f.size,0),sha256:createHash('sha256').update(await readFile(output)).digest('hex'),files:files.length,cleanDisconnectedMachine:'NOT RUN'},null,2));console.log('Offline bundle created and hashed. Clean disconnected deployment NOT RUN.');
