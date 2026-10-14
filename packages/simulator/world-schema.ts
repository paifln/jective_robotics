import {z} from 'zod';
import {DistanceInputSchema} from './distance';
import {AnalogModelSchema} from './analog';
export const RobotConfigSchema=z.object({track:z.number().min(.05).max(1).default(.18),radius:z.number().min(.03).max(.5).default(.12),maxSpeed:z.number().min(.05).max(2).default(.6),acceleration:z.number().min(.05).max(5).default(1.25),probeForward:z.number().min(0).max(.5).default(.08),probeSeparation:z.number().min(.005).max(.5).default(.05),distanceMax:z.number().min(.2).max(5).default(2),noise:z.number().min(0).max(.2).default(0),seed:z.number().int().min(0).max(4294967295).default(1)}).strict();
const point=z.object({x:z.number().finite(),y:z.number().finite()}).strict();
export const WorldSchema=z.object({id:z.string().min(1).max(80),width:z.number().min(1).max(20),height:z.number().min(1).max(20),start:point.extend({heading:z.number().finite()}),goal:point.extend({radius:z.number().min(.01).max(2)}),obstacles:z.array(point.extend({width:z.number().positive().max(20),height:z.number().positive().max(20)})).max(100),line:z.array(point).max(1000),inputs:z.object({button:z.boolean()}).strict().optional(),buttonEvents:z.array(z.object({timeMs:z.number().int().min(0).max(119999),pressed:z.boolean()}).strict()).max(2000).optional(),distanceInput:DistanceInputSchema.optional(),analog:AnalogModelSchema.optional(),robot:RobotConfigSchema.optional()}).strict().superRefine((world,ctx)=>{
 const issue=(path:(string|number)[],message:string)=>ctx.addIssue({code:'custom',path,message});
 for(let index=1;index<(world.buttonEvents?.length??0);index++)if(world.buttonEvents![index]!.timeMs<=world.buttonEvents![index-1]!.timeMs)issue(['buttonEvents',index,'timeMs'],'SIM_BUTTON_EVENT_ORDER');
 for(const [index,obstacle] of world.obstacles.entries())if(obstacle.x<0||obstacle.y<0||obstacle.x+obstacle.width>world.width||obstacle.y+obstacle.height>world.height)issue(['obstacles',index],'SIM_OBSTACLE_OUTSIDE_WORLD');
 for(const [index,p] of world.line.entries())if(p.x<0||p.y<0||p.x>world.width||p.y>world.height)issue(['line',index],'SIM_LINE_OUTSIDE_WORLD');
 const goal=world.goal;if(goal.x-goal.radius<0||goal.y-goal.radius<0||goal.x+goal.radius>world.width||goal.y+goal.radius>world.height)issue(['goal'],'SIM_GOAL_OUTSIDE_WORLD');
 const start=world.start,radius=world.robot?.radius??.12;
 const intersects=world.obstacles.some(o=>Math.hypot(start.x-Math.max(o.x,Math.min(start.x,o.x+o.width)),start.y-Math.max(o.y,Math.min(start.y,o.y+o.height)))<=radius);
 if(start.x<radius||start.y<radius||start.x>world.width-radius||start.y>world.height-radius||intersects)issue(['start'],'SIM_INVALID_START');
});
export type World=z.input<typeof WorldSchema>;
