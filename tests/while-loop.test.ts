import {it,expect} from 'vitest';
import * as Blockly from 'blockly';
import {programWorkspace,toProgram} from '../apps/desktop/renderer/blocks';
import {interpret,RobotSimulation,worlds} from '../packages/simulator';
import {validateProgram,type Program} from '../packages/codegen';
export const countedWhile:Program={setup:[{kind:'set',name:'count',value:{kind:'number',value:0}},{kind:'while',condition:{kind:'binary',op:'<',left:{kind:'variable',name:'count'},right:{kind:'number',value:3}},maxIterations:3,body:[{kind:'print',text:'iteration'},{kind:'wait',ms:100},{kind:'set',name:'count',value:{kind:'binary',op:'+',left:{kind:'variable',name:'count'},right:{kind:'number',value:1}}}]},{kind:'print',text:'done'}],loop:[]};
it('condition loops survive Blockly and exit exactly at their allowed boundary',()=>{
 const workspace=new Blockly.Workspace();try{
  Blockly.serialization.workspaces.load(programWorkspace(countedWhile),workspace);const program=toProgram(workspace);
  expect(interpret(program,1000).map(e=>[e.timeMs,e.value])).toEqual([[0,'iteration'],[100,'iteration'],[200,'iteration'],[300,'done']]);
  const sim=new RobotSimulation(program,worlds[0]!);sim.step(20);expect(sim.state.status).toBe('completed');expect(sim.state.variables.count).toBe(3);expect(sim.state.log.at(-1)).toBe('300 ms: done');
 }finally{workspace.dispose();}
});
it('a permanently true empty condition loop faults instead of hanging or running its following instruction',()=>{
 const program:Program={setup:[{kind:'while',condition:{kind:'number',value:1},maxIterations:3,body:[]},{kind:'print',text:'unreachable'}],loop:[]};
 expect(()=>interpret(program,1000)).toThrow('LOOP_BUDGET');
 const sim=new RobotSimulation(program,worlds[0]!);sim.step();expect(sim.state.error).toContain('LOOP_BUDGET');expect(sim.state.log).toEqual([]);
 for(const maxIterations of [0,-1,1.5,1001])expect(()=>validateProgram({setup:[{...program.setup[0] as Extract<typeof program.setup[number],{kind:'while'}>,maxIterations}],loop:[]})).toThrow('LOOP_BUDGET_RANGE');
});
