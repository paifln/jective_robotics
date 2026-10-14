import {it,expect} from 'vitest';
import {generateFunctions} from '../packages/codegen';
import type {FunctionProgram} from '../packages/codegen/functions';
const number=(value:number)=>({kind:'number' as const,value});
it('generates dependency-first functions and distinct parameter/global names',()=>{
 const program:FunctionProgram={setup:[{kind:'set',name:'ms',value:number(7)},{kind:'call',name:'outer',arguments:[number(20)]}],loop:[],functions:[{name:'outer',parameters:['ms'],body:[{kind:'call',name:'pulse',arguments:[{kind:'variable',name:'ms'}]}]},{name:'pulse',parameters:['ms'],body:[{kind:'waitValue',value:{kind:'variable',name:'ms'}},{kind:'set',name:'ms',value:number(3)}]}]};
 const source=generateFunctions(program,null);expect(source.indexOf('void jf_pulse')).toBeLessThan(source.indexOf('void jf_outer'));expect(source).toContain('double jp_ms');expect(source).toContain('double jv_ms = 0;');expect(source).toContain('jp_ms = j_value;');expect(source).toContain('j_wait_ms(jp_ms)');expect(source).toContain('jf_outer(ja_');
});
it('keeps hardware restrictions for function bodies and validates call graphs',()=>{
 const program:FunctionProgram={setup:[],loop:[],functions:[{name:'f',parameters:[],body:[{kind:'led',on:true}]}]};
 expect(()=>generateFunctions(program,null)).toThrow('WIRING_UNASSIGNED');expect(generateFunctions(program,4)).toContain('digitalWrite(4, HIGH)');
 program.functions[0]!.body=[{kind:'led',on:true,channel:2}];expect(()=>generateFunctions(program,4)).toThrow('SECOND_INDICATOR_WIRING_REQUIRED');
 program.functions[0]!.body=[{kind:'drive',left:0,right:0}];expect(()=>generateFunctions(program,4)).toThrow('MOTOR_WIRING_REQUIRED');
 program.functions[0]!.body=[{kind:'waitValue',value:{kind:'sensor',sensor:'button'}}];expect(()=>generateFunctions(program,4)).toThrow('SENSOR_DRIVER_REQUIRED');
 program.functions[0]!.body=[{kind:'call',name:'f',arguments:[]}];expect(()=>generateFunctions(program,4)).toThrow('FUNCTION_RECURSION');
});
