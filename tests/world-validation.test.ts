import {it,expect} from 'vitest';
import {WorldSchema,worlds,RobotSimulation} from '../packages/simulator';
it('rejects out-of-world geometry and invalid robot footprints before simulation',()=>{
 const world=worlds[0]!;
 const invalid=[
  {...world,obstacles:[{x:-.1,y:1,width:.2,height:.2}]},
  {...world,obstacles:[{x:3.9,y:1,width:.2,height:.2}]},
  {...world,line:[{x:2,y:3.01}]},
  {...world,goal:{x:3.9,y:1.5,radius:.2}},
  {...world,start:{x:.1,y:1.5,heading:0}},
  {...world,obstacles:[{x:.4,y:1.4,width:.2,height:.2}]},
  {...world,start:{x:.2,y:1.5,heading:0},robot:{radius:.3}}
 ];
 for(const scenario of invalid)expect(WorldSchema.safeParse(scenario).success).toBe(false);
 for(const scenario of worlds)expect(WorldSchema.safeParse(scenario).success).toBe(true);
 expect(()=>new RobotSimulation({setup:[],loop:[]},invalid[4]!)).toThrow('SIM_INVALID_START');
});
it('accepts wall-aligned obstacles and boundary line endpoints without requiring disjoint rectangles',()=>{
 expect(WorldSchema.safeParse({...worlds[0]!,line:[{x:0,y:0},{x:4,y:3}],obstacles:[{x:2,y:0,width:.5,height:3},{x:2.2,y:0,width:.5,height:1}]}).success).toBe(true);
});
