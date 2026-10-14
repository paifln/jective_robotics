import {execFileSync} from 'node:child_process';
import {readFile,lstat} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';

const git=(args,options={})=>execFileSync('git',args,{maxBuffer:20*1024*1024,...options}).toString();
const files=[...new Set(git(['ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(Boolean))];
const available=new Set(files),issues=[];
const patterns=[['provider-key',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}/],['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/],['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['aws-access-key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/]];
let bytes=0;
for(const path of files){
 let info;try{info=await lstat(path);}catch{issues.push({path,code:'MISSING_FILE'});continue;}
 if(info.isSymbolicLink()){issues.push({path,code:'SYMLINK_REVIEW'});continue;}
 if(!info.isFile())continue;bytes+=info.size;
 if(info.size>25*1024*1024)issues.push({path,code:'LARGE_FILE_REVIEW'});
 if(info.size<=25*1024*1024&&!/\.(png|jpe?g|gif|ogg|wav|mp3|ttf|woff2?|ico|bmp|pdf|zip|exe)$/i.test(path)){
  let text=await readFile(path,'utf8');
  // This exact header-only string tests a rejection path; it contains no PEM payload.
  if(path==='tests/review-workflow.test.ts'){
   const header=['-----BEGIN','PRIVATE KEY-----'].join(' ');
   text=text.replaceAll("'"+header+"'",'').replaceAll('"'+header+'"','');
  }
  for(const [code,pattern] of patterns)if(pattern.test(text))issues.push({path,code});
 }
}
const tracked=git(['ls-files','-z']).split('\0').filter(Boolean);
function ignored(paths){
 try{return git(['check-ignore','--no-index','-z','--stdin'],{input:paths.join('\0')+'\0'}).split('\0').filter(Boolean);}catch(error){if(error.status===1)return [];throw error;}
}
if(tracked.length)for(const path of ignored(tracked))issues.push({path,code:'IGNORED_BUT_TRACKED'});
const privateSamples=['.env','.env.local','services/assistant/runtime.env','services/assistant/provider.secret.json','services/assistant/master.key','services/assistant/credentials.json','student/assistant.json','student/workspace.sqlite-wal','node_modules/example/index.js','dist/main.cjs','release/setup.exe','.toolchain/bin/arduino-cli.exe','.verification/private.json','evidence/local-run/screenshot.png','evidence/local-run/traces.json'];
const excluded=new Set(ignored(privateSamples));for(const path of privateSamples)if(!excluded.has(path))issues.push({path,code:'IGNORE_RULE_MISSING'});
const template='services/assistant/deploy/runtime.env.example';if(ignored([template]).length)issues.push({path:template,code:'TEMPLATE_IGNORED'});

const matrix=JSON.parse(await readFile('docs/requirements.json','utf8'));
const references=[...new Set([...matrix.sections,...matrix.criteria].flatMap(row=>[...row.files,...row.evidence]))];
const present=path=>available.has(path)||files.some(file=>file.startsWith(path.replace(/\/$/,'')+'/'));
for(const path of references)if(!present(path))issues.push({path,code:'REQUIREMENT_NOT_IN_CHECKOUT'});
const readme=await readFile('README.md','utf8');
for(const match of readme.matchAll(/\]\(([^)]+)\)/g)){
 const target=match[1];if(/^(?:https?:|#)/.test(target))continue;
 const path=relative(process.cwd(),resolve(decodeURIComponent(target.split('#')[0]))).split(sep).join('/');
 if(!present(path))issues.push({path,code:'README_LINK_NOT_IN_CHECKOUT'});
}
console.log(JSON.stringify({status:issues.length?'FAIL':'PASS',files:files.length,bytes,requirementReferences:references.length,issues,scope:'Candidate Git files and known credential patterns; does not prove absence of all sensitive data.'},null,2));
if(issues.length)process.exitCode=1;
