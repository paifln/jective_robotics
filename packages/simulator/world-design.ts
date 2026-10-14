import {z} from 'zod';
import {WorldSchema,collides,stepDrive,type World,type Pose} from './index';
const designPoint=z.object({x:z.number().finite(),y:z.number().finite()}).strict();
export const WorldDesignSchema=z.object({width:z.number().min(1).max(20),height:z.number().min(1).max(20),start:designPoint.extend({headingDegrees:z.number().min(0).max(360)}),goal:designPoint.extend({radius:z.number().min(.01).max(2)}),obstacles:z.array(designPoint.extend({width:z.number().positive().max(20),height:z.number().positive().max(20)})).max(20)}).strict();
export const coordinateUnits={position:'m',heading:'rad',time:'ms'} as const;
export const screenCoordinates={origin:'top-left',positiveX:'right',positiveY:'down',positiveHeading:'clockwise'} as const;
export function createLessonWorld(value:unknown):World {
 const design=WorldDesignSchema.parse(value);const world=WorldSchema.parse({id:'L43-student-world',width:design.width,height:design.height,start:{x:design.start.x,y:design.start.y,heading:design.start.headingDegrees*Math.PI/180},goal:design.goal,obstacles:design.obstacles,line:[]});
 if(collides(world,world.goal,world.goal.radius))throw new Error('WORLD_GOAL_BLOCKED');return world;
}
export const WorldExportSchema=z.object({format:z.literal('jective-world'),schemaVersion:z.literal(1),units:z.object({position:z.literal('m'),heading:z.literal('rad'),time:z.literal('ms')}).strict(),coordinates:z.object({origin:z.literal('top-left'),positiveX:z.literal('right'),positiveY:z.literal('down'),positiveHeading:z.literal('clockwise')}).strict(),world:WorldSchema,physicalVerification:z.literal('NOT RUN')}).strict();
export function exportLessonWorld(world:World){return WorldExportSchema.parse({format:'jective-world',schemaVersion:1,units:coordinateUnits,coordinates:screenCoordinates,world,physicalVerification:'NOT RUN'});}
/** Accept our labeled export or legacy raw world JSON, without guessing units. */
export function parseWorldDocument(text:string):World {
 z.string().max(1000000).parse(text);const value:unknown=JSON.parse(text);
 if(typeof value==='object'&&value!==null&&'format' in value)return WorldExportSchema.parse(value).world;
 return WorldSchema.parse(value);
}
/** A bounded straight pose prediction, using the simulator's real fixed-step kinematics. */
export function predictStraightPose(world:World,distanceMeters:number):Pose {
 const valid=WorldSchema.parse(world);z.number().min(-2).max(2).finite().parse(distanceMeters);
 let pose:Pose={...valid.start};const steps=100,speed=distanceMeters;
 for(let i=0;i<steps;i++){const next=stepDrive(pose,speed,speed,.18,.01);if(collides(valid,next))throw new Error('WORLD_PREDICTION_COLLISION');pose=next;}return pose;
}
