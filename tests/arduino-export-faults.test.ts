import {it,expect,vi} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import type {Project} from '../packages/contracts';
const fault=vi.hoisted(()=>({rename:false,temporary:''}));
vi.mock('node:fs/promises',async importOriginal=>{
 const real=await importOriginal<typeof import('node:fs/promises')>();
 return {...real,mkdtemp:async(prefix:string)=>fault.temporary||real.mkdtemp(prefix),rename:async(from:string,to:string)=>{if(fault.rename)throw Object.assign(new Error('Injected publish denial'),{code:'EACCES'});return real.rename(from,to);}};
});
import {exportArduinoProject} from '../packages/persistence/arduino-export';
const project:Project={schemaVersion:1,id:randomUUID(),name:'Export error fixture',profileId:'esp32-devkit-reference',mode:'code',source:'void setup(){}\nvoid loop(){}',sourceFiles:{'helper.h':'#pragma once\n'},workspace:{},revision:0};
it('removes only its own temporary files after an injected publish failure',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-export-error-'));try{fault.rename=true;await expect(exportArduinoProject(project,root)).rejects.toThrow('Injected publish denial');expect(await readdir(root)).toEqual([]);}
 finally{fault.rename=false;await rm(root,{recursive:true,force:true});}
});
it('refuses an unexpected temporary location or basename before any write or cleanup',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-export-guard-'));try{const parent=join(root,'parent'),outside=join(root,'outside'),wrongName=join(parent,'student-work');await mkdir(parent);await mkdir(outside);await mkdir(wrongName);for(const folder of [outside,wrongName])await writeFile(join(folder,'student.txt'),'preserved');for(const folder of [outside,wrongName]){fault.temporary=folder;await expect(exportArduinoProject(project,parent)).rejects.toThrow('EXPORT_TEMP_PATH');expect(await readdir(folder)).toEqual(['student.txt']);expect(await readFile(join(folder,'student.txt'),'utf8')).toBe('preserved');}}
 finally{fault.temporary='';await rm(root,{recursive:true,force:true});}
});
