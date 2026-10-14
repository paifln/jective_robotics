import {test,expect} from 'vitest';
import {avoidanceProgram} from '../packages/content/avoidance-program';
import {avoidanceWorldExperiment} from '../packages/content/avoidance-world';
import {RobotSimulation} from '../packages/simulator';
import {avoidanceArtifact} from '../packages/content/avoidance-artifact';
test('block-program state machine matches independent world controller state and physics at every tick',()=>{
 const states=['move','stop','inspect','turn','retry','blocked','fault'];
 for(const scenario of ['recovery','blocked'] as const){
  const expected=avoidanceWorldExperiment(scenario),simulation=new RobotSimulation(avoidanceProgram(),expected.world);
  for(const row of expected.rows){
   const actual=simulation.step();expect(actual.status).toBe('running');
   expect(states[actual.variables.avoid_state!]).toBe(row.control.state);
   expect(actual.variables.attempts).toBe(row.control.attempts);
   expect(actual.pose.x).toBeCloseTo(row.after.x,12);expect(actual.pose.y).toBeCloseTo(row.after.y,12);expect(actual.pose.heading).toBeCloseTo(row.after.heading,12);
   expect(actual.left).toBeCloseTo(row.leftMps,12);expect(actual.right).toBeCloseTo(row.rightMps,12);expect(actual.collision).toBe(false);
  }
  for(let tick=0;tick<20&&simulation.state.status!=='completed';tick++)simulation.step();
  expect(simulation.state.status).toBe('completed');expect(simulation.state.left).toBe(0);expect(simulation.state.right).toBe(0);
 }
});
test('block program services the modeled stop button during turning and never restarts after release',()=>{
 const world=avoidanceWorldExperiment('blocked').world;
 world.buttonEvents=[{timeMs:300,pressed:true},{timeMs:500,pressed:false}];
 const simulation=new RobotSimulation(avoidanceProgram(),world),trace=[];
 for(let tick=0;tick<100;tick++)trace.push(simulation.step());
 expect(trace.find(state=>state.timeMs===300)!.variables.avoid_state).toBe(3);
 expect(trace.find(state=>state.timeMs===320)!.variables.avoid_state).toBe(6);
 expect(trace.filter(state=>state.timeMs>=500).every(state=>state.variables.avoid_state===6&&state.left===0&&state.right===0)).toBe(true);
});
test('short-turn learner starter exposes a collision that the reference avoids in the same world',()=>{
 for(const reference of [false,true]){
  const simulation=new RobotSimulation(reference?avoidanceArtifact.reference:avoidanceArtifact.starter,avoidanceArtifact.world!);
  let collided=false;for(let tick=0;tick<230&&simulation.state.status!=='completed';tick++)collided=simulation.step().collision||collided;
  expect(simulation.state.status).toBe('completed');expect(collided).toBe(!reference);
 }
 for(const value of [399,401,1601,NaN])expect(()=>avoidanceProgram(value)).toThrow('AVOIDANCE_TURN_CONFIG');
});
