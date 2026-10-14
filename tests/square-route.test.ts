import {test,expect} from 'vitest';
import {squareRouteDefaults,squareRouteTrials,squareRouteProgram,compareSquareRevision} from '../packages/content/square-route';
import {squareRouteArtifact} from '../packages/content/square-route-artifact';
import {RobotSimulation} from '../packages/simulator';

test('four-side route executes every instruction and quarter-turn revision reduces actual closure error',()=>{
 const baseline=squareRouteTrials(),revision=squareRouteTrials({...squareRouteDefaults,turnMs:1180});
 expect(squareRouteProgram().setup).toHaveLength(32);
 expect(baseline.rows.every(row=>row.trace.at(-1)!.status==='completed')).toBe(true);
 expect(revision.summary.meanEndpointErrorMeters).toBeLessThan(baseline.summary.meanEndpointErrorMeters);
 expect(Math.abs(revision.rows[0]!.headingErrorRadians)).toBeLessThan(Math.abs(baseline.rows[0]!.headingErrorRadians));
 expect(baseline.rows[0]!.completionMs).toBe(9620);
 expect(revision.rows[0]!.completionMs).toBe(10340);
});
test('repeated identical conditions preserve raw traces and do not pretend to measure physical repeatability',()=>{
 const result=squareRouteTrials();
 expect(result.rows).toHaveLength(3);
 expect(result.summary.rangeEndpointErrorMeters).toBe(0);
 expect(result.rows[0]!.trace).toEqual(result.rows[1]!.trace);
 expect(result.physicalVerification).toBe('NOT RUN');
 const last=result.rows[0]!.trace.at(-1)!;
 expect(result.rows[0]!.endpointErrorMeters).toBeCloseTo(Math.hypot(last.pose.x-result.world.start.x,last.pose.y-result.world.start.y));
});
test('geometry and command asymmetry are independent recorded variables with different paths',()=>{
 const nominal=squareRouteTrials({...squareRouteDefaults,turnMs:1180});
 const geometry=squareRouteTrials({...squareRouteDefaults,turnMs:1180,trackMeters:.2});
 const imbalance=squareRouteTrials({...squareRouteDefaults,turnMs:1180,rightCommandOffset:3});
 expect(geometry.program).toEqual(nominal.program);
 expect(imbalance.world).toEqual(nominal.world);
 expect(geometry.rows[0]!.trace).not.toEqual(nominal.rows[0]!.trace);
 expect(imbalance.rows[0]!.trace.find(state=>state.timeMs===1000)!.pose.heading).not.toBe(0);
 expect(nominal.rows[0]!.trace.find(state=>state.timeMs===1000)!.pose.heading).toBe(0);
});
test('revision requires a written rationale and stores both actual runs without modifying settings',()=>{
 const baseline={...squareRouteDefaults},revision={...baseline,turnMs:1180};
 expect(()=>compareSquareRevision(baseline,revision,'')).toThrow('SQUARE_REVISION_JUSTIFICATION');
 const result=compareSquareRevision(baseline,revision,'Increase the turn duration after observing under-turn.');
 expect(result.baseline.settings.turnMs).toBe(1000);expect(result.revision.settings.turnMs).toBe(1180);
 expect(baseline).toEqual(squareRouteDefaults);
});
test('invalid settings reject before simulation',()=>{
 for(const change of [{straightMs:0},{straightMs:1001},{turnMs:2020},{turnMs:NaN},{trackMeters:.1},{trackMeters:Infinity},{rightCommandOffset:6},{rightCommandOffset:NaN},{repetitions:1},{repetitions:2.5}])expect(()=>squareRouteTrials({...squareRouteDefaults,...change})).toThrow('SQUARE_ROUTE_CONFIG');
});
test('learner starter/reference artifacts execute with the same world and match laboratory results',()=>{
 for(const reference of [false,true]){
  const simulation=new RobotSimulation(reference?squareRouteArtifact.reference:squareRouteArtifact.starter,squareRouteArtifact.world!);
  const trace=[structuredClone(simulation.state)];
  for(let tick=0;tick<1100&&simulation.state.status!=='completed';tick++)trace.push(simulation.step());
  const expected=squareRouteTrials({...squareRouteDefaults,turnMs:reference?1180:1000});
  expect(trace).toEqual(expected.rows[0]!.trace);
  expect(trace.at(-1)!.status).toBe('completed');
  expect(squareRouteArtifact.world!.id).toBe('L24-square-calibration');
 }
});
test('per-side observations retain actual phase samples and expose curvature separately from closure',()=>{
 const result=squareRouteTrials({...squareRouteDefaults,turnMs:1180}),row=result.rows[0]!;
 expect(row.sides).toHaveLength(4);
 for(const side of row.sides){
  expect(side.chordMeters).toBeCloseTo(.12,10);
  expect(side.straightHeadingChangeRadians).toBeCloseTo(0,10);
  expect(side.turnRadians).toBeCloseTo(1.573333333333,10);
  expect(side.corner).toEqual(row.trace.find(state=>state.timeMs===side.cornerTimeMs)!.pose);
  expect(side.afterTurn).toEqual(row.trace.find(state=>state.timeMs===side.afterTurnTimeMs)!.pose);
 }
 const curved=squareRouteTrials({...squareRouteDefaults,rightCommandOffset:3}).rows[0]!;
 expect(curved.sides.every(side=>side.straightHeadingChangeRadians>0)).toBe(true);
 expect(row.sides[3]!.afterTurnTimeMs).toBeLessThan(row.completionMs);
});
test('bounded corner configurations complete collision-free and justify exports at allowed limits',()=>{
 for(const trackMeters of [.15,.25])for(const rightCommandOffset of [-5,5]){
  const result=squareRouteTrials({...squareRouteDefaults,straightMs:2000,turnMs:2000,trackMeters,rightCommandOffset,repetitions:2});
  expect(result.rows.every(row=>row.trace.at(-1)!.status==='completed'&&!row.trace.some(state=>state.collision))).toBe(true);
 }
 expect(squareRouteTrials({...squareRouteDefaults,straightMs:400,turnMs:400,repetitions:10}).rows).toHaveLength(10);
 expect(()=>compareSquareRevision(squareRouteDefaults,squareRouteDefaults,'x'.repeat(2001))).toThrow('SQUARE_REVISION_JUSTIFICATION');
});
