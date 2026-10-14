import {it,expect} from 'vitest';
import {debounceArtifact} from '../packages/content/lesson-debounce';
import {RobotSimulation} from '../packages/simulator';
import {generate} from '../packages/codegen';
it('L13 produces exactly one filtered action per intended press across ten bouncing trials',()=>{
 const world=debounceArtifact.world!;
 const starter=new RobotSimulation(debounceArtifact.starter,world).step(260),reference=new RobotSimulation(debounceArtifact.reference,world).step(260);
 expect(starter.variables.raw_actions).toBe(40);expect(starter.variables.debounced_actions).toBe(40);expect(reference.variables.raw_actions).toBe(40);expect(reference.variables.debounced_actions).toBe(10);
 const presses=reference.log.filter(line=>line.endsWith(': DEBOUNCED_PRESS'));expect(presses).toEqual(Array.from({length:10},(_,trial)=>`${220+trial*500} ms: DEBOUNCED_PRESS`));expect(reference.log.filter(line=>line.endsWith(': DEBOUNCED_RELEASE'))).toEqual(Array.from({length:10},(_,trial)=>`${380+trial*500} ms: DEBOUNCED_RELEASE`));
 for(let repeat=0;repeat<10;repeat++)expect(new RobotSimulation(debounceArtifact.reference,world).step(260)).toEqual(reference);
 expect(()=>generate(debounceArtifact.reference,2)).toThrow('SENSOR_DRIVER_REQUIRED');
});
it('the stability filter accepts holds, rejects brief pulses and rearms only after stable release',()=>{
 const world=debounceArtifact.world!;
 const held=new RobotSimulation(debounceArtifact.reference,{...world,buttonEvents:[{timeMs:100,pressed:true}]}).step(50);expect(held.variables.debounced_actions).toBe(1);expect(held.log).toContain('140 ms: DEBOUNCED_PRESS');
 const pulse=new RobotSimulation(debounceArtifact.reference,{...world,buttonEvents:[{timeMs:100,pressed:true},{timeMs:120,pressed:false}]}).step(50);expect(pulse.variables.raw_actions).toBe(1);expect(pulse.variables.debounced_actions).toBe(0);
 const twice=new RobotSimulation(debounceArtifact.reference,{...world,buttonEvents:[{timeMs:100,pressed:true},{timeMs:300,pressed:false},{timeMs:500,pressed:true}]}).step(50);expect(twice.variables.debounced_actions).toBe(2);expect(twice.log).toContain('340 ms: DEBOUNCED_RELEASE');
 const unaligned=new RobotSimulation(debounceArtifact.reference,{...world,buttonEvents:[{timeMs:101,pressed:true}]}).step(50);expect(unaligned.log).toContain('160 ms: DEBOUNCED_PRESS');
});
