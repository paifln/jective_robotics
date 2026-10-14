import {it,expect} from 'vitest';
import type {Project} from '../packages/contracts';
import {compilerDiagnostics} from '../packages/toolchain/diagnostics';
import {readFileSync} from 'node:fs';
const project:Project={schemaVersion:1,id:'8af8fd35-a398-4a06-872e-6963c6964241',name:'Diagnostic fixture',profileId:'esp32-devkit-reference',mode:'code',source:'',sourceFiles:{'behavior.cpp':''},workspace:{},revision:0};
it('binds navigation to the current build and rejects external same-name files',()=>{
 const id=project.id,own='C:/workspace/builds/'+id+'/sketch/behavior.cpp';
 const log=[own,'C:/core/behavior.cpp','behavior.cpp','C:/workspace/builds/00000000-0000-0000-0000-000000000000/sketch/behavior.cpp','C:/core/../builds/'+id+'/sketch/behavior.cpp'].map(p=>p+':2:3: error: issue').join('\n');
 expect(compilerDiagnostics(log,project,id)).toHaveLength(1);
 expect(compilerDiagnostics(log,project,'')).toEqual([]);
 expect(compilerDiagnostics(log,project,'../bad')).toEqual([]);
 expect(compilerDiagnostics(own.toUpperCase().replaceAll('/','\\')+':2:3: error: issue',project,id)[0]?.file).toBe('behavior.cpp');
});
it('preserves navigation for four recorded actual compiler failures with matching operation IDs',()=>{
 const receipt=JSON.parse(readFileSync('evidence/build-errors/compiler.json','utf8')) as {complete:boolean;results:{bad:{log:string;operationId:string}}[]};
 expect(receipt.complete).toBe(true);expect(receipt.results).toHaveLength(4);
 for(const {bad} of receipt.results){expect(compilerDiagnostics(bad.log,project,bad.operationId).some(d=>d.kind==='error'||d.kind==='fatal error')).toBe(true);expect(compilerDiagnostics(bad.log,project,'00000000-0000-0000-0000-000000000000')).toEqual([]);}
});
it('maps actual GCC-format Windows and Unix paths only to known project files',()=>{
 expect(compilerDiagnostics('C:\\Users\\School\\build\\behavior.cpp:6:19: error: unknownPhase is not declared\r\n/tmp/sketch/sketch.ino:3:1: warning: unused\n/tmp/core/Arduino.h:2:4: error: external header',project)).toEqual([{file:'behavior.cpp',line:6,column:19,kind:'error',message:'unknownPhase is not declared'},{file:'sketch.ino',line:3,column:1,kind:'warning',message:'unused'}]);expect(compilerDiagnostics('BEHAVIOR.CPP:1:1: note: reference\nbehavior.cpp:2:2: fatal error: missing',project).map(d=>d.kind)).toEqual(['note','fatal error']);
});
it('bounds navigation entries and messages and rejects malformed positions',()=>{
 expect(compilerDiagnostics('behavior.cpp:0:1: error: zero\nbehavior.cpp:1:0: error: zero\nbehavior.cpp:1000000:1: error: huge\n',project)).toEqual([]);expect(compilerDiagnostics(Array(40).fill('behavior.cpp:1:1: error: issue').join('\n'),project)).toHaveLength(30);expect(compilerDiagnostics('behavior.cpp:1:1: error: '+'x'.repeat(5000),project)[0]?.message).toHaveLength(4000);expect(compilerDiagnostics('sketch.ino:1:1: error: main',{...project,sourceFiles:undefined})[0]?.file).toBe('sketch.ino');
});
