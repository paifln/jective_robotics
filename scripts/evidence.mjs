import {spawn} from 'node:child_process';
import {mkdir,writeFile,copyFile,readFile} from 'node:fs/promises';
const allowed=['typecheck','lint','test','test:coverage','firmware:check','functions:check','pwm:check','test:e2e','package','content:validate'];
const stage=process.argv[2];if(!allowed.includes(stage))throw new Error('Select a known package script');
const npm=process.env.npm_execpath;if(!npm)throw new Error('Run via npm run evidence -- <stage>');
await mkdir('evidence/runs',{recursive:true});const started=new Date().toISOString();let log='';
const packageVersion=JSON.parse(await readFile('package.json','utf8')).version;
const child=spawn(process.execPath,[npm,'run',stage],{shell:false,windowsHide:true,env:process.env});
child.stdout.on('data',b=>{log+=b.toString();process.stdout.write(b);});child.stderr.on('data',b=>{log+=b.toString();process.stderr.write(b);});
const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
const filename=started.replace(/[:.]/g,'-')+'-'+stage.replace(':','-');
const environment=Object.fromEntries(['JECTIVE_EXECUTABLE','JECTIVE_REAL_COMPILER','JECTIVE_TOOLCHAIN_ROOT','JECTIVE_WORKSPACE_ROOT'].filter(key=>process.env[key]).map(key=>[key,process.env[key]]));
await writeFile('evidence/runs/'+filename+'.log',log);await writeFile('evidence/runs/'+filename+'.json',JSON.stringify({packageVersion,command:['node',npm,'run',stage],environment,started,finished:new Date().toISOString(),exitCode:code},null,2));
const report=stage==='test'?'unit.json':stage==='test:coverage'?'coverage/coverage-summary.json':stage==='test:e2e'?'e2e.json':stage==='firmware:check'?'compiler.json':stage==='functions:check'?'functions-lesson/verification.json':stage==='pwm:check'?'pwm/verification.json':stage==='content:validate'?'content.json':null;
if(report){try{await copyFile('test-results/'+report,'evidence/runs/'+filename+'-report.json');}catch(e){console.error('Report snapshot unavailable:',String(e));}}
process.exitCode=code??1;
