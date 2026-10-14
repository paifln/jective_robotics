import {test,expect} from 'vitest';
import {ObstacleAvoidance} from '../packages/simulator/obstacle-avoidance';
test('ticks traverse move stop inspect turn retry and recover on a clear route',()=>{
 const controller=new ObstacleAvoidance();
 const trace=Array.from({length:100},(_,index)=>controller.tick({timeMs:index*20,distanceMeters:index===0||index>=71?1:.2,valid:true,stopRequested:false}));
 expect([...new Set(trace.map(row=>row.state))]).toEqual(['move','stop','inspect','turn','retry']);
 expect(trace.at(-1)!.state).toBe('move');expect(trace.at(-1)!.attempts).toBe(1);
 expect(trace.filter(row=>['stop','inspect','retry'].includes(row.state)).every(row=>row.left===0&&row.right===0)).toBe(true);
});
test('a permanently blocked route exhausts attempts and stays stopped even after clearance',()=>{
 const controller=new ObstacleAvoidance(.3,2);
 const trace=Array.from({length:200},(_,index)=>controller.tick({timeMs:index*20,distanceMeters:.2,valid:true,stopRequested:false}));
 expect(trace.at(-1)!).toMatchObject({state:'blocked',attempts:2,left:0,right:0});
 expect(controller.tick({timeMs:4000,distanceMeters:1,valid:true,stopRequested:false}).state).toBe('blocked');
});
test('invalid data or manual stop interrupts a turn on the same tick and cannot auto-rearm',()=>{
 for(const fault of [{distanceMeters:null,valid:false,stopRequested:false},{distanceMeters:1,valid:true,stopRequested:true},{distanceMeters:NaN,valid:true,stopRequested:false}]){
  const controller=new ObstacleAvoidance();
  for(let timeMs=0;timeMs<=220;timeMs+=20)controller.tick({timeMs,distanceMeters:.2,valid:true,stopRequested:false});
  expect(controller.tick({timeMs:240,...fault})).toMatchObject({state:'fault',left:0,right:0});
  expect(controller.tick({timeMs:260,distanceMeters:1,valid:true,stopRequested:false})).toMatchObject({state:'fault',left:0,right:0});
 }
});
test('configuration and time are bounded and one tick cannot bypass several states',()=>{
 for(const args of [[.1,2],[NaN,2],[.3,0],[.3,4]])expect(()=>new ObstacleAvoidance(...args as [number,number])).toThrow('AVOIDANCE_CONFIG');
 const controller=new ObstacleAvoidance();controller.tick({timeMs:0,distanceMeters:.2,valid:true,stopRequested:false});
 expect(controller.tick({timeMs:100,distanceMeters:.2,valid:true,stopRequested:false}).state).toBe('inspect');
 expect(()=>controller.tick({timeMs:99,distanceMeters:1,valid:true,stopRequested:false})).toThrow('AVOIDANCE_TIME');
});
test('late servicing latches fault while the exact 100 ms cadence boundary is accepted',()=>{
 const late=new ObstacleAvoidance(),boundary=new ObstacleAvoidance();
 for(const controller of [late,boundary])expect(controller.tick({timeMs:0,distanceMeters:1,valid:true,stopRequested:false}).left).toBe(20);
 expect(late.tick({timeMs:101,distanceMeters:1,valid:true,stopRequested:false})).toMatchObject({state:'fault',left:0,right:0});
 expect(late.tick({timeMs:121,distanceMeters:1,valid:true,stopRequested:false}).state).toBe('fault');
 expect(boundary.tick({timeMs:100,distanceMeters:1,valid:true,stopRequested:false})).toMatchObject({state:'move',left:20});
});
test('duplicate timestamps cannot advance retry to movement or service an old reading twice',()=>{
 const controller=new ObstacleAvoidance();
 for(let timeMs=0;timeMs<200;timeMs+=20)controller.tick({timeMs,distanceMeters:.2,valid:true,stopRequested:false});
 expect(controller.tick({timeMs:200,distanceMeters:1,valid:true,stopRequested:false}).state).toBe('retry');
 expect(()=>controller.tick({timeMs:200,distanceMeters:1,valid:true,stopRequested:false})).toThrow('AVOIDANCE_TIME');
 expect(controller.tick({timeMs:220,distanceMeters:1,valid:true,stopRequested:false}).state).toBe('move');
 expect(()=>controller.tick({timeMs:220,distanceMeters:1,valid:true,stopRequested:false})).toThrow('AVOIDANCE_TIME');
 expect(controller.tick({timeMs:240,distanceMeters:1,valid:true,stopRequested:false}).state).toBe('move');
});
