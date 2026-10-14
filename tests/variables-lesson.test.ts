import {it,expect} from 'vitest';
import {artifacts} from '../packages/content/lessons';
import {RobotSimulation,worlds} from '../packages/simulator';
it('L07 parameters control sampling and classification without commanding motion',()=>{
 for(const interval of [100,240,1000])for(const [threshold,speed,label] of [[1,20,'CLEAR'],[3,20,'NEAR'],[3,0,'CLEAR']] as const){
  const program=structuredClone(artifacts.L07!.reference);
  for(const instruction of program.setup)if(instruction.kind==='set'){
   const value=instruction.name==='interval_ms'?interval:instruction.name==='alert_distance_m'?threshold:speed;
   instruction.value={kind:'number',value};
  }
  const sim=new RobotSimulation(program,artifacts.L07!.world!);
  for(let n=0;n<interval*2/20+1;n++)sim.step();
  expect(sim.state.log.slice(0,3)).toEqual([`0 ms: ${label}`,`${interval} ms: ${label}`,`${interval*2} ms: ${label}`]);
  expect(sim.state.pose).toEqual(worlds[0]!.start);
  expect(sim.state.status).not.toBe('error');
 }
});
