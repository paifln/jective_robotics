import {it,expect} from 'vitest';
import {stateMachineArtifact} from '../packages/content/lesson-state-machine';
import {RobotSimulation} from '../packages/simulator';
import {generate} from '../packages/codegen';
it('L12 exposes the missing transition and passes the same four-press regression after repair',()=>{
 const world=stateMachineArtifact.world!;
 const starter=new RobotSimulation(stateMachineArtifact.starter,world).step(25),reference=new RobotSimulation(stateMachineArtifact.reference,world).step(25);
 expect(starter.log).toEqual(['0 ms: STATE_IDLE','100 ms: STATE_ACTIVE','200 ms: STATE_DONE','300 ms: MISSING_RETURN','400 ms: MISSING_RETURN']);expect(starter.variables.state).toBe(2);expect(starter.led).toBe(false);
 expect(reference.log).toEqual(['0 ms: STATE_IDLE','100 ms: STATE_ACTIVE','200 ms: STATE_DONE','300 ms: STATE_IDLE','400 ms: STATE_ACTIVE']);expect(reference.variables.state).toBe(1);expect(reference.led).toBe(true);
 for(let repeat=0;repeat<10;repeat++)expect(new RobotSimulation(stateMachineArtifact.reference,world).step(25)).toEqual(reference);
 expect(()=>generate(stateMachineArtifact.reference,2)).toThrow('SENSOR_DRIVER_REQUIRED');
});
it('one held or initially pressed button produces only one transition and release rearms it',()=>{
 const world=stateMachineArtifact.world!;
 for(const scenario of [{...world,buttonEvents:[{timeMs:100,pressed:true}]},{...world,inputs:{button:true},buttonEvents:[]}]){
  const state=new RobotSimulation(stateMachineArtifact.reference,scenario).step(25);expect(state.log).toHaveLength(2);expect(state.variables.state).toBe(1);
 }
 const state=new RobotSimulation(stateMachineArtifact.reference,{...world,buttonEvents:[{timeMs:100,pressed:true},{timeMs:200,pressed:false},{timeMs:300,pressed:true}]}).step(25);expect(state.log.at(-1)).toBe('300 ms: STATE_DONE');expect(state.variables.state).toBe(2);
});
