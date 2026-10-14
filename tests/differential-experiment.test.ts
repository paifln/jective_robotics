import {test,expect} from 'vitest';
import {steeringExperiment,steeringProgram} from '../packages/content/differential-experiment';
test('equal commands move straight, unequal curve and opposite rotate without translation',()=>{
 const equal=steeringExperiment('equal'),unequal=steeringExperiment('unequal'),opposite=steeringExperiment('opposite');
 expect(equal.trace.at(-1)!.pose.x).toBeGreaterThan(1.6);expect(equal.trace.at(-1)!.pose.y).toBeCloseTo(1.5);expect(equal.trace.at(-1)!.pose.heading).toBe(0);
 expect(unequal.trace.at(-1)!.pose.y).toBeGreaterThan(1.5);expect(unequal.trace.at(-1)!.pose.heading).toBeGreaterThan(0);
 expect(opposite.trace.at(-1)!.pose.x).toBeCloseTo(1.5);expect(opposite.trace.at(-1)!.pose.y).toBeCloseTo(1.5);expect(opposite.trace.at(-1)!.pose.heading).toBeGreaterThan(1);
 for(const result of [equal,unequal,opposite]){expect(result.origin).toBe('simulation');expect(result.trace.at(-1)!).toMatchObject({status:'completed',left:0,right:0});expect(result.trace.every(state=>!state.collision)).toBe(true);}
});
test('modeled polarity mismatch and correction preserve independent trajectory evidence',()=>{const wrong=steeringExperiment('equal',[-1,1]);expect(wrong.trace.at(-1)!.pose.heading).toBeGreaterThan(1);expect(wrong.trace.at(-1)!.pose.x).toBeCloseTo(1.5);const corrected=steeringExperiment('equal',[1,1]);expect(corrected.modeledSigns).toEqual([1,1]);expect(corrected.trace.at(-1)!.pose.heading).toBe(0);expect(wrong.modeledSigns).toEqual([-1,1]);});
test('rejects unknown comparisons and malformed sign conventions before running',()=>{expect(()=>steeringProgram('other' as 'equal')).toThrow('STEERING_CASE');expect(()=>steeringProgram('equal',[0,1] as unknown as [1,1])).toThrow('STEERING_CASE');});
