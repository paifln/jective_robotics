import {readFile,mkdir,writeFile} from 'node:fs/promises';
const text=await readFile('MASTER_PROMPT.txt','utf8');
const sections=[...text.matchAll(/^(\d{1,2}) ([^\r\n]+)/gm)].map(m=>({id:'S'+m[1],requirement:m[2],status:'PARTIAL / NOT IMPLEMENTED',files:[],evidence:[],remaining:'See original section; all details remain binding.'}));
const criteria=[...text.matchAll(/^(AC\d\d) ([^\r\n]+)/gm)].map(m=>({id:m[1],requirement:m[2],status:'NOT MET',files:[],evidence:[],remaining:'Full acceptance not yet run.'}));
await mkdir('docs',{recursive:true});await writeFile('docs/requirements.json',JSON.stringify({source:'MASTER_PROMPT.txt',sections,criteria},null,2));
