import {test,expect} from 'vitest';
import {obstacleStopExperiment,obstacleStopProgram} from '../packages/content/obstacle-stop';
import {obstacleStopArtifact} from '../packages/content/obstacle-stop-artifact';
import {RobotSimulation} from '../packages/simulator';
test('near, equality and missing/out-of-range latch stop without ever moving',()=>{
 for(const scenario of ['near','boundary','missing','out-of-range'] as const){
  const result=obstacleStopExperiment(scenario),final=result.trace.at(-1)!;
  expect(final.status).toBe('completed');expect(final.variables.stopped).toBe(1);
  expect(result.displacementMeters).toBe(0);expect(result.trace.every(state=>state.left===0&&state.right===0)).toBe(true);
  expect(final.log.some(line=>line.includes(scenario==='missing'||scenario==='out-of-range'?'INVALID_STOP':'THRESHOLD_STOP'))).toBe(true);
 }
});
test('strictly above threshold and far readings allow bounded forward motion and finish stopped',()=>{
 for(const scenario of ['far','above-boundary'] as const){
  const result=obstacleStopExperiment(scenario),final=result.trace.at(-1)!;
  expect(final.status).toBe('completed');expect(final.variables.stopped).toBe(0);
  expect(result.displacementMeters).toBeCloseTo(.24,10);expect(final.left).toBe(0);expect(final.right).toBe(0);
 }
});
test('missing data while moving latches stop and restoring valid data does not restart',()=>{
 const result=obstacleStopExperiment('lost-then-restored');
 expect(result.trace.find(state=>state.timeMs===200)!.left).toBeGreaterThan(0);
 expect(result.trace.find(state=>state.timeMs===220)!.variables.stopped).toBe(1);
 expect(result.trace.filter(state=>state.timeMs>=320).every(state=>state.left===0&&state.right===0)).toBe(true);
 expect(result.trace.at(-1)!.distance).toBe(1);expect(result.trace.at(-1)!.variables.stopped).toBe(1);
 expect(result.trace.at(-1)!.log.filter(line=>line.includes('INVALID_STOP'))).toHaveLength(1);
});
test('unsafe starter fails on missing distance instead of treating it as clear',()=>{
 const result=obstacleStopExperiment('missing',.3,false),final=result.trace.at(-1)!;
 expect(final.status).toBe('error');expect(final.error).toContain('DISTANCE_READING_INVALID');expect(final.left).toBe(0);
 expect(result.physicalVerification).toBe('NOT RUN');
});
test('threshold is configurable and rejects malformed values',()=>{
 for(const value of [NaN,Infinity,.19,.81])expect(()=>obstacleStopProgram(value)).toThrow('OBSTACLE_STOP_CONFIG');
 for(const value of [.2,.8])expect(obstacleStopExperiment('boundary',value).displacementMeters).toBe(0);
 expect(()=>obstacleStopExperiment('other' as 'far')).toThrow('OBSTACLE_STOP_CASE');
});
test('ray-cast world obstacle triggers a latched stop with clearance and no collision',()=>{
 const result=obstacleStopExperiment('ray-obstacle'),final=result.trace.at(-1)!;
 expect(result.world.distanceInput).toBeUndefined();expect(result.displacementMeters).toBeGreaterThan(0);
 expect(final.status).toBe('completed');expect(final.variables.stopped).toBe(1);
 expect(final.distanceSource).toBe('ray');expect(final.distance!).toBeLessThanOrEqual(.3);
 expect(result.trace.every(state=>!state.collision)).toBe(true);
 expect(result.world.obstacles[0]!.x-final.pose.x).toBeGreaterThan(result.world.robot!.radius);
 expect(final.left).toBe(0);expect(final.right).toBe(0);
});
test('stop observations separate request time from settled velocity and body clearance',()=>{
 const lost=obstacleStopExperiment('lost-then-restored');
 expect(lost.stopping).toMatchObject({reason:'invalid-reading',requestedAtMs:200});
 expect(lost.stopping!.settlingMs).toBeGreaterThan(0);
 expect(lost.stopping!.travelAfterRequestMeters).toBeGreaterThan(0);
 const request=lost.trace.find(state=>state.timeMs===lost.stopping!.requestedAtMs)!,settled=lost.trace.find(state=>state.timeMs===lost.stopping!.settledAtMs)!;
 expect(lost.stopping!.travelAfterRequestMeters).toBeCloseTo(settled.pose.x-request.pose.x,12);
 expect(obstacleStopExperiment('boundary').stopping).toMatchObject({reason:'threshold',requestedAtMs:0,settlingMs:0,travelAfterRequestMeters:0});
 expect(obstacleStopExperiment('far').stopping!.requestedAtMs).toBe(2000);
 expect(obstacleStopExperiment('ray-obstacle').stopping!.bodyClearanceMeters).toBeGreaterThan(0);
 expect(obstacleStopExperiment('missing',.3,false).stopping).toBeNull();
});
test('learner artifacts expose the missing-data defect and reference matches the actual lab trace',()=>{
 for(const reference of [false,true]){
  const simulation=new RobotSimulation(reference?obstacleStopArtifact.reference:obstacleStopArtifact.starter,obstacleStopArtifact.world!);
  const trace=[structuredClone(simulation.state)];
  for(let tick=0;tick<150&&!['completed','error'].includes(simulation.state.status);tick++)trace.push(simulation.step());
  const final=trace.at(-1)!;
  if(reference){expect(final.status).toBe('completed');expect(trace).toEqual(obstacleStopExperiment('lost-then-restored').trace);}
  else{expect(final.status).toBe('error');expect(final.error).toContain('DISTANCE_READING_INVALID');expect(final.timeMs).toBe(200);expect(final.left).toBe(0);expect(final.right).toBe(0);}
 }
});
test('ray-world threshold comparisons reach the lower limit and larger thresholds stop earlier',()=>{
 const late=obstacleStopExperiment('ray-obstacle',.2),normal=obstacleStopExperiment('ray-obstacle',.3),early=obstacleStopExperiment('ray-obstacle',.34);
 expect(early.displacementMeters).toBe(0);
 expect(normal.stopping!.reason).toBe('threshold');
 expect(normal.stopping!.bodyClearanceMeters).toBeGreaterThan(0);
 expect(late.displacementMeters).toBeGreaterThan(normal.displacementMeters);
 expect(late.stopping!.reason).toBe('threshold');
 expect(late.trace.at(-1)!.distance!).toBeLessThanOrEqual(.2);
 expect(late.trace.at(-1)!.variables.stopped).toBe(1);
 expect(late.stopping!.bodyClearanceMeters).toBeGreaterThan(0);
 expect(late.trace.every(state=>!state.collision)).toBe(true);
 expect(obstacleStopExperiment('ray-obstacle',.8).stopping).toMatchObject({reason:'threshold',requestedAtMs:0,bodyClearanceMeters:.22000000000000008});
});
