import {it,expect} from 'vitest';
import {checkedSound} from '../packages/simulator/sound';
import {interpret,RobotSimulation,RobotStateSchema,worlds} from '../packages/simulator';
import {generate,validateProgram,type Program} from '../packages/codegen';
import type {FunctionProgram} from '../packages/codegen/functions';
import * as Blockly from 'blockly';
import {programWorkspace,toFunctionProgram} from '../apps/desktop/renderer/blocks';
const tone={kind:'sound' as const,frequencyHz:440,durationMs:200};
it('sound commands are nonblocking, expire on the simulation grid and replace the single voice',()=>{
 const program:Program={setup:[tone,{kind:'print',text:'RESPONSIVE'},{kind:'wait',ms:100},{kind:'sound',frequencyHz:880,durationMs:40},{kind:'print',text:'REPLACED'}],loop:[]};
 expect(interpret(program,200)).toEqual([{timeMs:0,kind:'sound',value:440,durationMs:200},{timeMs:0,kind:'print',value:'RESPONSIVE'},{timeMs:100,kind:'sound',value:880,durationMs:40},{timeMs:100,kind:'print',value:'REPLACED'}]);
 const simulation=new RobotSimulation(program,worlds[0]!);const initial=simulation.step();expect(initial.sound).toEqual({frequencyHz:440,endTimeMs:200});expect(initial.log).toContain('0 ms: RESPONSIVE');expect(initial.status).toBe('running');
 simulation.step(4);const replaced=simulation.step();expect(replaced.sound).toEqual({frequencyHz:880,endTimeMs:140});expect(replaced.log).toContain('100 ms: REPLACED');const ended=simulation.step();expect(ended.timeMs).toBe(140);expect(ended.sound).toBeNull();expect(ended.status).toBe('completed');expect(RobotStateSchema.safeParse(ended).success).toBe(true);
 const short=new RobotSimulation({setup:[{...tone,durationMs:1}],loop:[]},worlds[0]!).step();expect(short.sound).toBeNull();expect(short.timeMs).toBe(20);expect(short.status).toBe('completed');
});
it('explicit sound stop, failures and cancellation stop the virtual voice without future commands',()=>{
 const stopped=new RobotSimulation({setup:[tone,{kind:'soundStop'}],loop:[]},worlds[0]!).step();expect(stopped.sound).toBeNull();expect(stopped.status).toBe('completed');
 const simulation=new RobotSimulation({setup:[tone,{kind:'drive',left:20,right:20},{kind:'wait',ms:60000},{kind:'print',text:'UNREACHABLE'}],loop:[]},worlds[0]!);expect(simulation.step().left).toBeGreaterThan(0);const cancelled=simulation.cancel();expect(cancelled.status).toBe('cancelled');expect(cancelled.sound).toBeNull();expect(cancelled.left).toBe(0);expect(cancelled.right).toBe(0);expect(cancelled.log).toContain('20 ms: CANCELLED');expect(simulation.step(1000)).toEqual(cancelled);expect(simulation.cancel()).toEqual(cancelled);expect(RobotStateSchema.safeParse(cancelled).success).toBe(true);
 const before=new RobotSimulation({setup:[tone],loop:[]},worlds[0]!);expect(before.cancel().timeMs).toBe(0);expect(before.step().sound).toBeNull();expect(new RobotSimulation({setup:[],loop:[]},worlds[0]!).step().status).toBe('completed');
 const error=new RobotSimulation({setup:[tone,{kind:'set',name:'bad',value:{kind:'binary',op:'/',left:{kind:'number',value:1},right:{kind:'number',value:0}}}],loop:[]},worlds[0]!);const failed=error.step();expect(failed.status).toBe('error');expect(failed.sound).toBeNull();expect(error.cancel()).toEqual(failed);
});
it('sound boundaries, function calls and actual Blockly serialization preserve timed events',()=>{
 for(const frequencyHz of [20,20000])for(const durationMs of [1,60000])expect(checkedSound({frequencyHz,durationMs})).toEqual({frequencyHz,durationMs});
 for(const frequencyHz of [19,20001,440.5,NaN,Infinity])expect(()=>validateProgram({setup:[{...tone,frequencyHz}],loop:[]})).toThrow('SOUND_FREQUENCY_RANGE');for(const durationMs of [0,60001,.5,NaN,Infinity])expect(()=>checkedSound({...tone,durationMs})).toThrow('SOUND_DURATION_RANGE');
 const program:FunctionProgram={setup:[{kind:'call',name:'signal',arguments:[]}],loop:[],functions:[{name:'signal',parameters:[],body:[tone,{kind:'print',text:'SAME TIME'},{kind:'soundStop'}]}]};expect(interpret(program,0)).toEqual([{timeMs:0,kind:'sound',value:440,durationMs:200},{timeMs:0,kind:'print',value:'SAME TIME'},{timeMs:0,kind:'soundStop',value:0}]);expect(new RobotSimulation(program,worlds[0]!).step().sound).toBeNull();
 const workspace=new Blockly.Workspace();try{Blockly.serialization.workspaces.load(programWorkspace(program),workspace);const parsed=toFunctionProgram(workspace);expect(interpret(parsed,0)).toEqual(interpret(program,0));expect(()=>generate(parsed,2)).toThrow('SOUND_DRIVER_REQUIRED');}finally{workspace.dispose();}
});
