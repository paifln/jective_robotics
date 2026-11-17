import {access,copyFile,cp,mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

// Reuse installed tools in a project-local SDK; Arduino IDE settings stay intact.
const project=resolve(fileURLToPath(new URL('..',import.meta.url)));
const local=process.env.LOCALAPPDATA;
if(!local)throw new Error('Run this setup on Windows with Arduino AVR Boards 1.8.8 installed.');
const source=join(local,'Arduino15');
const candidates=[join(project,'.toolchain','bin','arduino-cli.exe'),join(local,'Programs','JECTIVE Robotics Studio','resources','tools','arduino-cli.exe'),join(process.env.ProgramFiles??'C:/Program Files','Arduino IDE','resources','app','lib','backend','resources','arduino-cli.exe')];
let executable;
for(const candidate of candidates){try{const version=execFileSync(candidate,['version'],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','ignore']});if(version.includes('Version: 1.5.1 ')){executable=candidate;break;}}catch{/* Try the next installed CLI. */}}
if(!executable)throw new Error('Arduino CLI 1.5.1 not found. Place it in .toolchain/bin/arduino-cli.exe.');
const index=JSON.parse(await readFile(join(source,'package_index.json'),'utf8'));
const avr=index.packages.find(p=>p.name==='arduino')?.platforms.find(p=>p.architecture==='avr'&&p.version==='1.8.8');
if(!avr)throw new Error('Arduino AVR Boards 1.8.8 is missing from the local Arduino index.');
const folders=['arduino/hardware/avr/1.8.8',...avr.toolsDependencies.map(t=>`${t.packager}/tools/${t.name}/${t.version}`),'builtin'];
for(const folder of folders)await access(join(source,'packages',folder));
const root=join(project,'.toolchain','sdk'),data=join(root,'data');
await mkdir(join(project,'.toolchain','bin'),{recursive:true});
if(executable!==candidates[0])await copyFile(executable,candidates[0]);
await mkdir(data,{recursive:true});
for(const folder of folders)await cp(join(source,'packages',folder),join(data,'packages',folder),{recursive:true,force:false,errorOnExist:false});
for(const name of await readdir(source))if(/^(package.*|library)_index\.json(\.sig)?$/.test(name))await copyFile(join(source,name),join(data,name));
await writeFile(join(root,'arduino-cli.yaml'),JSON.stringify({directories:{data,downloads:join(root,'downloads'),user:join(root,'user')}}));
console.log('Arduino Uno tools ready: '+root);
