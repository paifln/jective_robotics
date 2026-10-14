import {test,expect} from 'vitest';
import {proportionalCorrection,runProportionalLine,proportionalLineProgram,compareProportionalTrials,proportionalLineWorld} from '../packages/content/proportional-line';
import {validateProgram} from '../packages/codegen';
import {RobotSimulation} from '../packages/simulator';
test('P correction preserves sign and clips steering before forming bounded wheel commands',()=>{
 expect(proportionalCorrection(.25,8)).toBe(2);expect(proportionalCorrection(-.25,8)).toBe(-2);expect(proportionalCorrection(1,100)).toBe(30);expect(proportionalCorrection(-1,100)).toBe(-30);expect(proportionalCorrection(0,8)).toBe(0);
 for(const [error,gain,limit] of [[NaN,1,30],[2,1,30],[0,-1,30],[0,101,30],[0,1,0],[0,1,31],[0,Infinity,30]])expect(()=>proportionalCorrection(error!,gain!,limit!)).toThrow('LINE_P_CONFIG');
 for(const gain of [0,1,8,40,100])expect(()=>validateProgram(proportionalLineProgram(gain))).not.toThrow();
});
test('three gain trials retain actual geometry, bounded commands and measured response rather than fabricated curves',()=>{
 const trials=[1,8,40].map(runProportionalLine);
 for(const trial of trials){expect(trial.commands).toHaveLength(300);expect(trial.trace.at(-1)!.status).toBe('completed');expect(trial.trace.every(frame=>!frame.collision)).toBe(true);expect(trial.commands.every(command=>Math.abs(command.left)<=50&&Math.abs(command.right)<=50)).toBe(true);expect(trial.metrics.rmsLateralMeters).toBeGreaterThan(0);expect(trial.trace.at(-1)!.left).toBe(0);expect(trial.trace.at(-1)!.right).toBe(0);}
 expect(trials[2]!.metrics.saturatedSamples).toBeGreaterThan(0);expect(trials[0]!.metrics.saturatedSamples).toBe(0);
 expect(new Set(trials.map(trial=>trial.metrics.rmsLateralMeters)).size).toBe(3);
 expect(trials[0]!.metrics.firstCenteredMs).toBeGreaterThan(trials[1]!.metrics.firstCenteredMs!);expect(trials[1]!.metrics.firstCenteredMs).toBeGreaterThan(trials[2]!.metrics.firstCenteredMs!);
 for(const trial of trials){let left=0,right=0;for(const [index,command] of trial.commands.entries()){const approach=(actual:number,target:number)=>actual+Math.max(-.025,Math.min(.025,target-actual));left=approach(left,command.left/100*.6);right=approach(right,command.right/100*.6);expect(trial.trace[index+1]!.left).toBeCloseTo(left,12);expect(trial.trace[index+1]!.right).toBeCloseTo(right,12);}}
});
test('actual P program stops on loss and prioritizes a latched manual stop over returned tracking',()=>{
 for(const manual of [false,true]){
  const world={...structuredClone(proportionalLineWorld),...(manual?{buttonEvents:[{timeMs:800,pressed:true},{timeMs:1000,pressed:false}]}:{start:{x:.5,y:1.1,heading:0}})};
  const simulation=new RobotSimulation(proportionalLineProgram(40),world),trace=[];for(let tick=0;tick<350&&simulation.state.status!=='completed';tick++)trace.push(simulation.step());
  expect(trace.find(frame=>frame.variables.p_state===(manual?2:1))!.timeMs).toBe(manual?820:20);
  expect(trace.filter(frame=>frame.timeMs>=(manual?1100:20)).every(frame=>frame.left===0&&frame.right===0&&frame.variables.p_state===(manual?2:1))).toBe(true);
 }
});
test('comparison requires three distinct valid gains and keeps zero-gain nonresponse visible',()=>{
 for(const gains of [[],[1,8],[1,1,8],[1,8,NaN]])expect(()=>compareProportionalTrials(gains)).toThrow();
 const baseline=compareProportionalTrials([0,8,40])[0]!;expect(baseline.metrics.firstCenteredMs).toBeNull();expect(baseline.metrics.correctionReversals).toBe(0);expect(baseline.metrics.rmsLateralMeters).toBeCloseTo(.012);
});
