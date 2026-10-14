import {it,expect} from 'vitest';
import * as Blockly from 'blockly';
import {formatPrintedValue} from '../packages/codegen/print-value';
import {generate,validateProgram,type Program} from '../packages/codegen';
import type {FunctionProgram} from '../packages/codegen/functions';
import {interpret,RobotSimulation,worlds} from '../packages/simulator';
import {programWorkspace,toFunctionProgram as toProgram} from '../apps/desktop/renderer/blocks';
import {localizeBlocks} from '../apps/desktop/renderer/block-locale';
const number=(value:number)=>({kind:'number' as const,value});
it('prints bounded finite values with explicit deterministic six-place rounding',()=>{
 for(const [value,expected] of [[0,'0.000000'],[-0,'0.000000'],[.5,'0.500000'],[-.5,'-0.500000'],[.0000005,'0.000001'],[-.0000005,'-0.000001'],[-.0000001,'0.000000'],[1e9,'1000000000.000000'],[-1e9,'-1000000000.000000']] as const)expect(formatPrintedValue('V=',value)).toBe('V='+expected);
 for(const value of [NaN,Infinity,-Infinity,1e9+1,-1e9-1])expect(()=>formatPrintedValue('V=',value)).toThrow('PRINT_VALUE_RANGE');
 for(const label of ['x\0', 'x'.repeat(1001)])expect(()=>formatPrintedValue(label,1)).toThrow('TEXT_RANGE');expect(()=>formatPrintedValue(null as unknown as string,1)).toThrow('TEXT_RANGE');
});
it('evaluates current variables and nested expressions rather than printing their names',()=>{
 const program:Program={setup:[{kind:'set',name:'voltage',value:number(.5)},{kind:'printValue',label:'voltage_V=',value:{kind:'binary',op:'*',left:{kind:'variable',name:'voltage'},right:number(2)}},{kind:'wait',ms:100},{kind:'set',name:'voltage',value:number(-.25)},{kind:'printValue',label:'voltage_V=',value:{kind:'variable',name:'voltage'}}],loop:[]};
 expect(interpret(program,200).filter(e=>e.kind==='print')).toEqual([{timeMs:0,kind:'print',value:'voltage_V=1.000000'},{timeMs:100,kind:'print',value:'voltage_V=-0.250000'}]);expect(new RobotSimulation(program,worlds[0]!).step(10).log).toEqual(['0 ms: voltage_V=1.000000','100 ms: voltage_V=-0.250000']);expect(generate(program,null)).toContain('j_print_value("voltage_V=", jv_voltage)');
});
it('preserves function parameters across waits and real Blockly serialization/localization',()=>{
 const program:FunctionProgram={setup:[{kind:'call',name:'report',arguments:[number(.5)]},{kind:'call',name:'report',arguments:[number(1.25)]}],loop:[],functions:[{name:'report',parameters:['value'],body:[{kind:'wait',ms:20},{kind:'printValue',label:'Қазақша значение_V=',value:{kind:'variable',name:'value'}}]}]};
 const workspace=new Blockly.Workspace();try{Blockly.serialization.workspaces.load(programWorkspace(program),workspace);for(const locale of ['en','ru','kk'] as const){localizeBlocks(workspace,locale);const restored=toProgram(workspace);const values=interpret(restored,200).filter(e=>e.kind==='print').map(e=>e.value);expect(values).toEqual(['Қазақша значение_V=0.500000','Қазақша значение_V=1.250000']);expect(new RobotSimulation(restored,worlds[0]!).step(10).log.map(e=>e.split(' ms: ')[1])).toEqual(values);expect(generate(restored,null)).toContain('jp_value');}}finally{workspace.dispose();}
});
it('faults before misleading output for invalid expressions, ranges or labels',()=>{
 for(const value of [number(1e9+1),{kind:'binary' as const,op:'/' as const,left:number(1),right:number(0)}]){const program:Program={setup:[{kind:'printValue',label:'measurement=',value},{kind:'print',text:'UNREACHABLE'}],loop:[]};expect(()=>interpret(program,200)).toThrow();const state=new RobotSimulation(program,worlds[0]!).step();expect(state.status).toBe('error');expect(state.log).toEqual([]);expect(generate(program,null)).toContain('if (!j_print_value');}
 expect(()=>validateProgram({setup:[{kind:'printValue',label:'bad\0',value:number(1)}],loop:[]})).toThrow('TEXT_RANGE');expect(()=>validateProgram({setup:[{kind:'printValue',label:'value',value:number(Infinity)}],loop:[]})).toThrow('NUMBER_RANGE');expect(()=>generate({setup:[{kind:'printValue',label:'distance_m=',value:{kind:'sensor',sensor:'distance'}}],loop:[]},null)).toThrow('SENSOR_DRIVER_REQUIRED');
});
