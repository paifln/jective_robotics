import {it,expect} from 'vitest';
import {artifacts} from '../packages/content/lessons';
import {interpret,RobotSimulation,worlds} from '../packages/simulator';
const configure=(target:number,stop=0)=>{
 const program=structuredClone(artifacts.L10!.reference);
 for(const i of program.setup)if(i.kind==='set'){
  if(i.name==='target_count')i.value={kind:'number',value:target};
  if(i.name==='stop_requested')i.value={kind:'number',value:stop};
 }
 return program;
};
it('L10 zero, normal, exact-budget and stopped cases finish their activity while keeping the event loop alive',()=>{
 for(const [target,stop,iterations] of [[0,0,0],[3,0,3],[5,0,5],[3,1,0],[4,0,4]]){
  const program=configure(target!,stop!);const trace=interpret(program,1200);
  expect(trace.filter(e=>e.value==='COUNTED').map(e=>e.timeMs)).toEqual([0,100,200]);
  expect(trace.filter(e=>e.value==='CONDITION')).toHaveLength(iterations!);
  expect(trace.find(e=>e.value==='DONE')?.timeMs).toBe(300+iterations!*100);
  expect(trace.filter(e=>e.value==='IDLE').length).toBeGreaterThan(1);
  const sim=new RobotSimulation(program,worlds[0]!);sim.step(60);expect(sim.state.variables.count).toBe(iterations);expect(sim.state.error).toBeNull();expect(sim.state.status).toBe('running');
 }
});
it('L10 missing update and over-budget requests fault; removing outer waits hits the global instruction limit',()=>{
 for(const program of [artifacts.L10!.starter,configure(6)]){
  expect(()=>interpret(program,1200)).toThrow('LOOP_BUDGET');const sim=new RobotSimulation(program,worlds[0]!);sim.step(60);expect(sim.state.error).toContain('LOOP_BUDGET');expect(sim.state.log.some(e=>e.endsWith('DONE'))).toBe(false);
 }
 const program=configure(3);program.loop=program.loop.filter(i=>i.kind!=='waitValue');
 expect(()=>interpret(program,1200)).toThrow('SIM_INSTRUCTION_BUDGET');const sim=new RobotSimulation(program,worlds[0]!);sim.step(60);expect(sim.state.error).toContain('SIM_INSTRUCTION_BUDGET');
});
