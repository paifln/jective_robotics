import {WorldSchema,stepDrive,collides} from '../simulator';
import {rayDistance} from '../simulator/ray';
import {ObstacleAvoidance} from '../simulator/obstacle-avoidance';
import {steeringWorld} from './differential-experiment';
export function avoidanceWorld(scenario:'recovery'|'blocked'|'body-contact'){
 if(!['recovery','blocked','body-contact'].includes(scenario))throw new Error('AVOIDANCE_WORLD_CASE');
 return WorldSchema.parse({...structuredClone(steeringWorld),id:'L26-'+scenario,width:2.8,height:2.8,goal:{x:2.6,y:2.6,radius:.1},obstacles:scenario==='body-contact'?[{x:1.6,y:1.59,width:.15,height:.1}]:scenario==='recovery'?[{x:1.84,y:1.4,width:.1,height:.2}]:[
  {x:1.7,y:1.2,width:.1,height:.6},{x:1.2,y:1.7,width:.6,height:.1},{x:1.2,y:1.2,width:.1,height:.6},{x:1.2,y:1.2,width:.6,height:.1}
 ]});
}
export function avoidanceWorldExperiment(scenario:'recovery'|'blocked'|'body-contact'){
 const world=avoidanceWorld(scenario);
 const controller=new ObstacleAvoidance();let pose={...world.start},left=0,right=0,collisionLatched=false;const rows=[];
 for(let timeMs=0;timeMs<4000;timeMs+=20){
  const reading=rayDistance(world,pose,2),input={timeMs,distanceMeters:reading.meters,valid:reading.status==='valid',stopRequested:collisionLatched||timeMs>=3800};
  const control=controller.tick(input),before={...pose};
  const approach=(value:number,command:number)=>value+Math.max(-world.robot!.acceleration*.02,Math.min(world.robot!.acceleration*.02,command/100*world.robot!.maxSpeed-value));
  left=approach(left,control.left);right=approach(right,control.right);
  const proposed=stepDrive(pose,left,right,world.robot!.track,.02),collision=collides(world,proposed,world.robot!.radius);
  if(collision){left=0;right=0;collisionLatched=true;}else pose=proposed;
  rows.push({input,reading,control,before,after:{...pose},leftMps:left,rightMps:right,collision});
 }
 return {schemaVersion:1,lessonId:'L26',origin:'geometry-controller-model',scenario,world,rows,
  assumptions:'Uses shared simulator kinematics, ray and collision functions with 20 ms acceleration updates. Independent controller loop, not Blockly worker execution. Explicit bounded stop at 3800 ms. No physical scheduling or motor safety equivalence claimed.',physicalVerification:'NOT RUN'} as const;
}
