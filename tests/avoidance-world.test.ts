import {test,expect} from 'vitest';
import {avoidanceWorldExperiment} from '../packages/content/avoidance-world';
test('actual ray geometry permits recovery after turning around a narrow obstacle',()=>{
 const result=avoidanceWorldExperiment('recovery');
 expect([...new Set(result.rows.map(row=>row.control.state))]).toEqual(['move','stop','inspect','turn','retry','fault']);
 expect(result.rows.some(row=>row.control.state==='move'&&row.control.attempts>0)).toBe(true);
 expect(result.rows.every(row=>!row.collision)).toBe(true);
 expect(result.rows.at(-1)!.leftMps).toBe(0);expect(result.rows.at(-1)!.rightMps).toBe(0);
 expect(result.rows.some(row=>row.reading.source==='ray'&&row.before.heading>0)).toBe(true);
});
test('enclosed geometry exhausts retries without inventing a clear route or collision',()=>{
 const result=avoidanceWorldExperiment('blocked');
 expect(result.rows.some(row=>row.control.state==='blocked'&&row.control.attempts===2)).toBe(true);
 expect(result.rows.every(row=>!row.collision)).toBe(true);expect(result.physicalVerification).toBe('NOT RUN');
 expect(()=>avoidanceWorldExperiment('other' as 'blocked')).toThrow('AVOIDANCE_WORLD_CASE');
});
test('a body obstacle missed by the thin sensor ray latches contact and prevents repeated drive attempts',()=>{
 const result=avoidanceWorldExperiment('body-contact'),index=result.rows.findIndex(row=>row.collision);
 expect(index).toBeGreaterThan(0);
 const contact=result.rows[index]!;expect(contact.reading.meters!).toBeGreaterThan(.3);
 expect(contact.leftMps).toBe(0);expect(contact.rightMps).toBe(0);
 const later=result.rows.slice(index+1);
 expect(later.every(row=>row.input.stopRequested&&row.control.state==='fault'&&row.control.left===0&&row.control.right===0)).toBe(true);
 expect(later.every(row=>row.after.x===contact.after.x&&row.after.y===contact.after.y)).toBe(true);
});
