import {it,expect} from 'vitest';
import {functionsArtifact} from '../packages/content/lesson-functions';
import {generate} from '../packages/codegen';
import {interpret,RobotSimulation,worlds} from '../packages/simulator';
import type {FunctionProgram} from '../packages/codegen/functions';
it('L11 exposes one shared starter defect and repairs both call sites',()=>{
 const starter=interpret(functionsArtifact.starter,1000),reference=interpret(functionsArtifact.reference,1000);
 expect(starter.filter(e=>e.kind==='led'&&!e.value)).toHaveLength(0);expect(reference.filter(e=>e.kind==='led'&&!e.value).map(e=>e.timeMs)).toEqual([100,300]);expect(reference.at(-1)).toEqual({timeMs:300,kind:'print',value:'DONE'});
 expect(new RobotSimulation(functionsArtifact.starter,worlds[0]!).step(30).led).toBe(true);expect(new RobotSimulation(functionsArtifact.reference,worlds[0]!).step(30).led).toBe(false);expect(generate(functionsArtifact.reference,2)).toContain('void jf_pulse(double jp_ms)');
});
it('L11 normal and boundary arguments execute while invalid values produce explicit faults',()=>{
 for(const value of [0,1,100,60000,-1,.5,60001]){
  const program=structuredClone(functionsArtifact.reference) as FunctionProgram;program.setup=[{kind:'call',name:'pulse',arguments:[{kind:'number',value}]},{kind:'print',text:'DONE'}];
  const simulation=new RobotSimulation(program,worlds[0]!);let state=simulation.step();for(let batch=0;batch<4&&state.status==='running';batch++)state=simulation.step(1000);
  if(value<0||!Number.isInteger(value)||value>60000){expect(()=>interpret(program,120000)).toThrow('WAIT_RANGE');expect(state.status).toBe('error');expect(state.error).toContain('WAIT_RANGE');expect(state.log.some(e=>e.includes('DONE'))).toBe(false);}
  else{expect(interpret(program,120000).at(-1)).toEqual({timeMs:value,kind:'print',value:'DONE'});expect(state.status).toBe('completed');expect(state.led).toBe(false);}
 }
});
