import {readFile,realpath,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {z} from 'zod';

const root=resolve('.');
const row=z.object({id:z.string().min(1),requirement:z.string().min(1),status:z.string().min(1),files:z.array(z.string().min(1)),evidence:z.array(z.string().min(1)),remaining:z.string().min(1)}).strict();
const matrix=z.object({source:z.literal('MASTER_PROMPT.txt'),sections:z.array(row).length(24),criteria:z.array(row).length(15),updated:z.iso.datetime()}).strict().parse(JSON.parse(await readFile('docs/requirements.json','utf8')));
const prompt=await readFile(matrix.source,'utf8');
const sections=new Map([...prompt.matchAll(/^(\d+) (.+)$/gm)].map(match=>['S'+match[1],match[2].trim()]));
const criteria=new Map([...prompt.matchAll(/^(AC\d{2}) (.+)$/gm)].map(match=>[match[1],match[2].trim()]));
function checkRows(rows,expected){
 if(expected.size!==rows.length||new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error('REQUIREMENT_IDS_MISMATCH');
 for(const entry of rows)if(expected.get(entry.id)!==entry.requirement)throw new Error('REQUIREMENT_TEXT_MISMATCH: '+entry.id);
}
checkRows(matrix.sections,sections);checkRows(matrix.criteria,criteria);
const paths=[...new Set([...matrix.sections,...matrix.criteria].flatMap(r=>[...r.files,...r.evidence]))];
for(const path of paths){
 const target=await realpath(resolve(root,path)),inside=relative(root,target);
 if(isAbsolute(inside)||inside==='..'||inside.startsWith('..'+sep))throw new Error('REQUIREMENT_REFERENCE_OUTSIDE_REPOSITORY: '+path);
}
const statuses={};for(const entry of [...matrix.sections,...matrix.criteria])statuses[entry.status]=(statuses[entry.status]??0)+1;
const report={checkedAt:new Date().toISOString(),scope:'Structural traceability only: exact master section/criterion text, unique IDs and existing contained references. Does not prove implementation, content quality, release or hardware acceptance.',sections:sections.size,criteria:criteria.size,references:paths.length,statuses};
await mkdir('.verification/requirements',{recursive:true});await writeFile('.verification/requirements/current-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
