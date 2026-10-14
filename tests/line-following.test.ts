import {test,expect} from 'vitest';
import {lineDecision,TwoSensorLineFollower} from '../packages/content/line-following';
import {calibrateLine} from '../packages/content/line-calibration';
import {lineFollowingArtifact,lineFollowingProgram} from '../packages/content/line-following-artifact';
import {RobotSimulation} from '../packages/simulator';
import {runLineCase,lineCases} from '../packages/content/line-following-experiment';
test('two-sensor table covers center, both corrections and loss with correct turn sign',()=>{
 for(const [left,right,state,a,b] of [[0,0,'centered',20,20],[0,1,'left',10,20],[1,0,'right',20,10],[1,1,'lost',0,0]] as const){
  expect(lineDecision(left,right)).toBe(state);expect(new TwoSensorLineFollower().tick({timeMs:0,left,right,stopRequested:false})).toMatchObject({state,left:a,right:b});
 }
});
test('loss and uncertain input stop immediately and cannot silently rearm',()=>{
 for(const readings of [[1,1],[null,0],[NaN,0],[-1,0],[2,0],[.5,0]] as const){
  const controller=new TwoSensorLineFollower();controller.tick({timeMs:0,left:0,right:0,stopRequested:false});
  expect(controller.tick({timeMs:20,left:readings[0],right:readings[1],stopRequested:false})).toMatchObject({left:0,right:0,stopLatched:true});
  expect(controller.tick({timeMs:40,left:0,right:0,stopRequested:false})).toMatchObject({left:0,right:0,stopLatched:true});
 }
 expect(lineDecision(.4,.9,calibrateLine([.1,.15,.2],[.8,.85,.9]))).toBe('fault');
});
test('manual stop and late updates latch faults; malformed clocks are rejected',()=>{
 for(const input of [{timeMs:20,stopRequested:true},{timeMs:101,stopRequested:false}]){
  const controller=new TwoSensorLineFollower();controller.tick({timeMs:0,left:0,right:0,stopRequested:false});expect(controller.tick({...input,left:0,right:0})).toMatchObject({state:'fault',left:0,right:0});
 }
 const controller=new TwoSensorLineFollower();controller.tick({timeMs:0,left:0,right:0,stopRequested:false});
 for(const timeMs of [0,-1,.5,NaN,120001])expect(()=>controller.tick({timeMs,left:0,right:0,stopRequested:false})).toThrow('LINE_FOLLOW_TIME');
});
test('actual geometry yields all four table cases and reference agrees on each first command',()=>{
 for(const [y,state] of [[1,0],[.988,1],[1.012,2],[1.1,3]] as const){
  const simulation=new RobotSimulation(lineFollowingProgram(),{...structuredClone(lineFollowingArtifact.world!),start:{x:.5,y,heading:0}});
  const initial={left:simulation.state.lineLeft,right:simulation.state.lineRight};
  const expected=new TwoSensorLineFollower().tick({timeMs:0,...initial,stopRequested:false});
  const actual=simulation.step();expect(actual.variables.line_state).toBe(state);
  // Both wheels initially accelerate by the same amount. Only after the slower
  // wheel reaches its target can measured wheel-speed asymmetry appear.
  expect(actual.left).toBeCloseTo(expected.left===0?0:.025);expect(actual.right).toBeCloseTo(expected.right===0?0:.025);
  for(let tick=0;tick<3;tick++)simulation.step();
  expect(Math.sign(simulation.state.right-simulation.state.left)).toBe(Math.sign(expected.right-expected.left));
  expect(actual.collision).toBe(false);
 }
});
test('reference stops at the real finite line end; unsafe starter continues after loss',()=>{
 const ends=[];
 for(const reference of [false,true]){
  const simulation=new RobotSimulation(reference?lineFollowingArtifact.reference:lineFollowingArtifact.starter,lineFollowingArtifact.world!);
  const trace=[];for(let tick=0;tick<500&&simulation.state.status!=='completed';tick++)trace.push(simulation.step());
  expect(simulation.state.status).toBe('completed');expect(trace.every(frame=>!frame.collision)).toBe(true);
  ends.push(simulation.state.pose.x);
  if(reference){const loss=trace.find(frame=>frame.variables.line_state===3)!;expect(loss).toBeDefined();const settled=trace.find(frame=>frame.timeMs>=loss.timeMs&&frame.left===0&&frame.right===0)!;expect(settled.timeMs-loss.timeMs).toBeLessThanOrEqual(100);expect(trace.filter(frame=>frame.timeMs>=settled.timeMs).every(frame=>frame.left===0&&frame.right===0)).toBe(true);}
 }
 expect(ends[0]!-ends[1]!).toBeGreaterThan(.2);
});
test('four actual fixture traces preserve every sampled decision and their stop interval',()=>{
 for(const caseId of lineCases){
  const result=runLineCase(caseId),controller=new TwoSensorLineFollower();expect(result.expected).toBe(caseId);expect(result.decisions).toHaveLength(400);
  for(const decision of result.decisions){const expected=controller.tick({timeMs:decision.timeMs,left:decision.leftSample,right:decision.rightSample,stopRequested:false});expect(decision.state).toBe(expected.state);}
  expect(result.trace.at(-1)!.status).toBe('completed');expect(result.trace.every(frame=>!frame.collision)).toBe(true);expect(result.stopRequestMs).not.toBeNull();expect(result.settledStopMs!-result.stopRequestMs!).toBeLessThanOrEqual(100);
 }
 expect(()=>runLineCase('unknown' as 'centered')).toThrow('LINE_CASE');
});
test('actual worker program prioritizes a scheduled manual stop and remains stopped after release',()=>{
 const simulation=new RobotSimulation(lineFollowingProgram(),{...structuredClone(lineFollowingArtifact.world!),buttonEvents:[{timeMs:800,pressed:true},{timeMs:1000,pressed:false}]});
 const trace=[];for(let tick=0;tick<450&&simulation.state.status!=='completed';tick++)trace.push(simulation.step());
 expect(trace.find(frame=>frame.variables.line_state===4)!.timeMs).toBe(820);
 expect(trace.filter(frame=>frame.timeMs>=900).every(frame=>frame.left===0&&frame.right===0&&frame.variables.line_state===4)).toBe(true);
});
