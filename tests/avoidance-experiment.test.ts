import {test,expect} from 'vitest';
import {avoidanceExperiment} from '../packages/content/avoidance-experiment';
test('recovery trace records all required states with input provenance and no fabricated pose',()=>{
 const result=avoidanceExperiment('recovery');
 expect([...new Set(result.rows.map(row=>row.output.state))]).toEqual(['move','stop','inspect','turn','retry']);
 expect(result.rows.at(-1)!.output.state).toBe('move');expect(result.rows).toHaveLength(201);
 expect(result.origin).toBe('controller-model');expect(result.physicalVerification).toBe('NOT RUN');
 expect(result.rows[0]!.input.distanceMeters).toBe(1);expect(result.rows[1]!.input.distanceMeters).toBe(.2);
});
test('blocked and temporary-fault sequences remain latched after their declared causes change',()=>{
 expect(avoidanceExperiment('blocked').rows.at(-1)!.output).toMatchObject({state:'blocked',attempts:2,left:0,right:0});
 for(const scenario of ['missing-during-turn','manual-stop'] as const){const result=avoidanceExperiment(scenario);expect(result.rows.find(row=>row.input.timeMs===300)!.output).toMatchObject({state:'fault',left:0,right:0});expect(result.rows.at(-1)!.output.state).toBe('fault');}
 expect(()=>avoidanceExperiment('unknown' as 'blocked')).toThrow('AVOIDANCE_SCENARIO');
});
