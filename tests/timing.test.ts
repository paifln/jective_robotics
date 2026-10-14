import {it,expect} from 'vitest';
import * as Blockly from 'blockly';
import {artifacts} from '../packages/content/lessons';
import {interpret,RobotSimulation,worlds} from '../packages/simulator';
import {generate,validateProgram,type Program} from '../packages/codegen';
import {programWorkspace,toProgram} from '../apps/desktop/renderer/blocks';
import {cooperativeTimingSource} from '../packages/content/timing-source';
import {readFileSync} from 'node:fs';
it('the offline in-app cooperative template matches the compiled example exactly',()=>{expect(cooperativeTimingSource).toBe(readFileSync('examples/two-indicator-cooperative.ino','utf8'));});
it('two indicator channels remain independent through Blockly save/reload and both simulators',()=>{
 const program=artifacts.L04!.reference;const workspace=new Blockly.Workspace();
 try{
  Blockly.serialization.workspaces.load(programWorkspace(program),workspace);
  const restored=toProgram(workspace);
  const trace=interpret(restored,1300);
  expect(trace.filter(e=>e.kind==='led'&&e.value===true).map(e=>[e.timeMs,e.channel??1])).toEqual([[0,1],[300,2],[1000,1],[1300,2]]);
  const simulation=new RobotSimulation(restored,worlds[0]!);
  const initial=simulation.step();expect([initial.led,initial.ledSecondary]).toEqual([true,false]);
  const second=simulation.step(15);expect([second.led,second.ledSecondary]).toEqual([false,true]);
  expect(()=>generate(restored,2)).toThrow('SECOND_INDICATOR_WIRING_REQUIRED');
 }finally{workspace.dispose();}
});
it('rejects malformed indicator values and invalid channel numbers',()=>{
 for(const instruction of [{kind:'led',on:'false'},{kind:'led',on:true,channel:3}])expect(()=>validateProgram({setup:[instruction],loop:[]} as Program)).toThrow('INDICATOR_INVALID');
});
