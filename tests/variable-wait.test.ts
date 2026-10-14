import {it,expect} from 'vitest';
import * as Blockly from 'blockly';
import {programWorkspace,toProgram} from '../apps/desktop/renderer/blocks';
import {generate,type Program} from '../packages/codegen';
import {interpret,RobotSimulation,worlds} from '../packages/simulator';
const timer=(value:number):Program=>({setup:[{kind:'set',name:'interval_ms',value:{kind:'number',value}}],loop:[{kind:'print',text:'tick'},{kind:'waitValue',value:{kind:'variable',name:'interval_ms'}}]});
it('parameterized waiting survives Blockly and changes observed timing in both simulators',()=>{
 for(const interval of [100,240,1000]){
  const workspace=new Blockly.Workspace();
  try{
   Blockly.serialization.workspaces.load(programWorkspace(timer(interval)),workspace);
   const program=toProgram(workspace);
   expect(interpret(program,interval*2).map(e=>e.timeMs)).toEqual([0,interval,interval*2]);
   const robot=new RobotSimulation(program,worlds[0]!);
   for(let n=0;n<interval*2/20;n++)robot.step();
   expect(robot.state.log.slice(0,2)).toEqual(['0 ms: tick',`${interval} ms: tick`]);
   expect(generate(program,null)).toContain('j_wait_ms(jv_interval_ms)');
  }finally{workspace.dispose();}
 }
});
it('rejects invalid evaluated delays instead of coercing them into unsigned or fractional durations',()=>{
 for(const value of [-1,.5,60001]){
  expect(()=>interpret(timer(value),1000)).toThrow('WAIT_RANGE');
  const robot=new RobotSimulation(timer(value),worlds[0]!);robot.step();
  expect(robot.state.status).toBe('error');
 }
 const source=generate(timer(100),null);
 expect(source).toContain('!isfinite(value)');expect(source).toContain('floor(value) != value');
});
