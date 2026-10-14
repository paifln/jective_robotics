import {it,expect} from 'vitest';
import {soundArtifact} from '../packages/content/lesson-sound';
import {interpret,RobotSimulation,worlds} from '../packages/simulator';
it('L16 exposes delayed starter feedback and reference pairs share exact event times',()=>{
 const starter=interpret(soundArtifact.starter,1000);expect(starter.filter(e=>e.kind==='sound').map(e=>e.timeMs)).toEqual([0,320,640]);expect(starter.filter(e=>e.kind==='print').map(e=>e.timeMs)).toEqual([120,440,760,960]);
 const reference=interpret(soundArtifact.reference,1000);expect(reference.filter(e=>e.kind==='sound').map(e=>[e.timeMs,e.value,e.durationMs])).toEqual([[0,440,120],[200,660,120],[400,880,120]]);expect(reference.filter(e=>e.kind==='print').map(e=>e.timeMs)).toEqual([0,200,400,600]);expect(reference.at(-2)).toEqual({timeMs:600,kind:'soundStop',value:0});
 for(let repeat=0;repeat<10;repeat++){const simulation=new RobotSimulation(soundArtifact.reference,worlds[0]!);const completed=simulation.step(31);expect(completed.status).toBe('completed');expect(completed.sound).toBeNull();expect(completed.log).toEqual(['0 ms: READY','200 ms: ACTIVE','400 ms: DONE','600 ms: FINISHED']);const cancelled=new RobotSimulation(soundArtifact.reference,worlds[0]!);cancelled.step();const state=cancelled.cancel();expect(state.sound).toBeNull();expect(state.log).toEqual(['0 ms: READY','20 ms: CANCELLED']);expect(cancelled.step(100)).toEqual(state);}
});
