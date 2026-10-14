import type {FunctionProgram} from '../packages/codegen/functions';
import {it,expect} from 'vitest';
import {artifacts} from '../packages/content/lessons';
import {RobotSimulation,worlds} from '../packages/simulator';
import type {Program} from '../packages/codegen';
const configure=(program:Program|FunctionProgram,input:number,min=0,max=30)=>{
 const result=structuredClone(program);
 for(const i of result.setup)if(i.kind==='set'){
  if(i.name==='input_value')i.value={kind:'number',value:input};
  if(i.name==='output_min_pct')i.value={kind:'number',value:min};
  if(i.name==='output_max_pct')i.value={kind:'number',value:max};
 }
 return result;
};
it('L08 shows the missing clamp and passes five boundary tests in both output ranges',()=>{
 const starter=new RobotSimulation(configure(artifacts.L08!.starter,110),worlds[0]!).step();expect(starter.variables.output_request_pct).toBe(33);
 for(const [min,max,expected] of [[0,30,[0,0,15,30,30]],[5,25,[5,5,15,25,25]]] as const){
  for(const [index,input] of [-10,0,50,100,110].entries()){
   const state=new RobotSimulation(configure(artifacts.L08!.reference,input,min,max),worlds[0]!).step();
   expect(state.variables.input_value).toBe(input);expect(state.variables.bounded_input).toBe(Math.max(0,Math.min(100,input)));
   expect(state.variables.output_request_pct).toBe(expected[index]);expect(state.pose).toEqual(worlds[0]!.start);expect(state.error).toBeNull();
  }
 }
});
it('L08 equal input limits fail before committing an output',()=>{
 const program=configure(artifacts.L08!.reference,50);
 for(const i of program.setup)if(i.kind==='set'&&i.name==='input_max')i.value={kind:'number',value:0};
 const state=new RobotSimulation(program,worlds[0]!).step();expect(state.error).toContain('DIVISION_BY_ZERO');expect(state.variables.output_request_pct).toBeUndefined();
});
