import {WorldSchema,RobotConfigSchema,type World} from './world-schema';
import {additionalPracticeWorlds} from './practice-worlds';
export {WorldSchema,RobotConfigSchema,type World} from './world-schema';
import {formatPrintedValue} from '../codegen/print-value';
import {rayDistance} from './ray';
import {injectedDistance,type DistanceInput} from './distance';
import {checkedSound} from './sound';
import {checkedPWMPercent} from '../profiles/pwm';
import {sampleAnalog} from './analog';
import {validateFunctions,type FunctionProgram,type FunctionInstruction,type FunctionDefinition} from '../codegen/functions';
import {evaluateExpression} from './expression';
import {interpretFunctions} from './functions';
import {checkedWaitMs,validateProgram,type Program,type Instruction,type Expression} from '../codegen';
import {z} from 'zod';
export interface TraceEvent {timeMs:number;kind:'led'|'print'|'pwm'|'sound'|'soundStop';value:boolean|string|number;channel?:1|2;durationMs?:number}
export function interpret(program:Program|FunctionProgram,durationMs:number,maxInstructions=10000):TraceEvent[]{
 if('functions' in program)return interpretFunctions(program,durationMs,maxInstructions);
 validateProgram(program);if(!Number.isFinite(durationMs)||durationMs<0||durationMs>3600000)throw new Error('SIM_DURATION');
 let time=0;let steps=0;const trace:TraceEvent[]=[];const vars:Record<string,number>={};
 const expression=(e:Expression):number=>evaluateExpression(e,name=>vars[name]??0,()=>{throw new Error('Use the robot world simulator for sensor expressions');});
 const execute=(instructions:Instruction[])=>{for(const i of instructions){if(++steps>maxInstructions)throw new Error('SIM_INSTRUCTION_BUDGET');if(time>durationMs)return;if(i.kind==='wait')time+=i.ms;else if(i.kind==='waitValue')time+=checkedWaitMs(expression(i.value));else if(i.kind==='sound'){checkedSound(i);trace.push({timeMs:time,kind:'sound',value:i.frequencyHz,durationMs:i.durationMs});}else if(i.kind==='soundStop')trace.push({timeMs:time,kind:'soundStop',value:0});else if(i.kind==='pwm')trace.push({timeMs:time,kind:'pwm',value:checkedPWMPercent(expression(i.value)),...(i.channel===2?{channel:2 as const}:{})});else if(i.kind==='printValue')trace.push({timeMs:time,kind:'print',value:formatPrintedValue(i.label,expression(i.value))});else if(i.kind==='led'||i.kind==='print')trace.push({timeMs:time,kind:i.kind,value:i.kind==='led'?i.on:i.text,...(i.kind==='led'&&i.channel===2?{channel:2 as const}:{})});else if(i.kind==='set')vars[i.name]=expression(i.value);else if(i.kind==='if')execute(expression(i.condition)?i.then:i.otherwise);else if(i.kind==='repeat')for(let n=0;n<i.count;n++)execute(i.body);else if(i.kind==='while'){let iterations=0;while(time<=durationMs&&expression(i.condition)){if(++steps>maxInstructions)throw new Error('SIM_INSTRUCTION_BUDGET');if(iterations++>=i.maxIterations)throw new Error('LOOP_BUDGET');execute(i.body);}}else throw new Error('Use the robot world simulator for motion blocks');}};
 execute(program.setup);while(time<=durationMs&&program.loop.length>0)execute(program.loop);return trace;
}
export interface Pose {x:number;y:number;heading:number}
export interface Obstacle {x:number;y:number;width:number;height:number}
const point=z.object({x:z.number().finite(),y:z.number().finite()}).strict();
export const worlds:World[]=[
 {id:'open-test-area',width:4,height:3,start:{x:.5,y:1.5,heading:0},goal:{x:3.5,y:1.5,radius:.2},obstacles:[],line:[]},
 {id:'straight-line',width:4,height:3,start:{x:.5,y:1.5,heading:0},goal:{x:3.5,y:1.5,radius:.2},obstacles:[],line:[{x:.5,y:1.5},{x:3.5,y:1.5}]},
 {id:'curved-line-junction',width:4,height:3,start:{x:.5,y:1,heading:0},goal:{x:3.5,y:2,radius:.2},obstacles:[],line:[{x:.5,y:1},{x:1.5,y:1},{x:2,y:1.5},{x:2.5,y:2},{x:3.5,y:2},{x:2.5,y:2},{x:2.5,y:2.7}]},
 {id:'obstacle-course',width:4,height:3,start:{x:.5,y:1.5,heading:0},goal:{x:3.5,y:1.5,radius:.2},obstacles:[{x:1.3,y:0,width:.3,height:1.7},{x:2.5,y:1.3,width:.3,height:1.7}],line:[]},
 {id:'maze',width:4,height:3,start:{x:.4,y:.5,heading:0},goal:{x:3.6,y:2.5,radius:.2},obstacles:[{x:1,y:0,width:.2,height:2},{x:2,y:1,width:.2,height:2},{x:3,y:0,width:.2,height:2}],line:[]},
 {id:'delivery-challenge',width:4,height:3,start:{x:.5,y:.5,heading:0},goal:{x:3.5,y:2.5,radius:.2},obstacles:[{x:1.5,y:1,width:1,height:1}],line:[]},
 {id:'slalom',width:5,height:3,start:{x:.4,y:1.5,heading:0},goal:{x:4.6,y:1.5,radius:.2},obstacles:[{x:1.2,y:1.1,width:.25,height:.8},{x:2.4,y:1.1,width:.25,height:.8},{x:3.6,y:1.1,width:.25,height:.8}],line:[]},
 {id:'parking',width:4,height:3,start:{x:.5,y:.5,heading:0},goal:{x:3.2,y:2.3,radius:.18},obstacles:[{x:2.6,y:1.7,width:.15,height:1},{x:3.65,y:1.7,width:.15,height:1}],line:[]},
 {id:'square-track',width:4,height:3,start:{x:.5,y:.5,heading:0},goal:{x:.5,y:1,radius:.15},obstacles:[],line:[{x:.5,y:.5},{x:3.5,y:.5},{x:3.5,y:2.5},{x:.5,y:2.5},{x:.5,y:1}]},
 {id:'narrow-passage',width:5,height:3,start:{x:.5,y:1.5,heading:0},goal:{x:4.5,y:1.5,radius:.2},obstacles:[{x:1.5,y:0,width:2,height:1.2},{x:1.5,y:1.8,width:2,height:1.2}],line:[{x:.5,y:1.5},{x:4.5,y:1.5}]},
 {id:'warehouse',width:5,height:4,start:{x:.5,y:.5,heading:0},goal:{x:4.5,y:3.5,radius:.2},obstacles:[{x:1.2,y:1,width:.6,height:2},{x:2.4,y:1,width:.6,height:2},{x:3.6,y:1,width:.6,height:2}],line:[]},
 {id:'sensor-bend',width:4,height:3,start:{x:.5,y:.5,heading:0},goal:{x:3.5,y:2.5,radius:.2},obstacles:[{x:2,y:0,width:.2,height:1.6}],line:[{x:.5,y:.5},{x:1.5,y:.5},{x:1.5,y:2.5},{x:3.5,y:2.5}]},
 ...additionalPracticeWorlds,
];
export function stepDrive(pose:Pose,leftMps:number,rightMps:number,trackM:number,dtSeconds:number):Pose{
 if(![pose.x,pose.y,pose.heading,leftMps,rightMps,trackM,dtSeconds].every(Number.isFinite)||trackM<=0||dtSeconds<0||dtSeconds>.1)throw new Error('KINEMATICS_RANGE');
 const velocity=(leftMps+rightMps)/2;const omega=(rightMps-leftMps)/trackM;const turn=omega*dtSeconds;
 if(Math.abs(omega)<1e-10)return {...pose,x:pose.x+velocity*Math.cos(pose.heading)*dtSeconds,y:pose.y+velocity*Math.sin(pose.heading)*dtSeconds};
 return {x:pose.x+velocity/omega*(Math.sin(pose.heading+turn)-Math.sin(pose.heading)),y:pose.y-velocity/omega*(Math.cos(pose.heading+turn)-Math.cos(pose.heading)),heading:pose.heading+turn};
}
export function collides(world:World,pose:Pick<Pose,'x'|'y'>&{heading?:number},radius=.12):boolean{
 if(pose.x<radius||pose.y<radius||pose.x>world.width-radius||pose.y>world.height-radius)return true;
 return world.obstacles.some(o=>{const x=Math.max(o.x,Math.min(pose.x,o.x+o.width));const y=Math.max(o.y,Math.min(pose.y,o.y+o.height));return Math.hypot(pose.x-x,pose.y-y)<=radius;});
}
export function lineReflectance(world:World,x:number,y:number,lineWidth=.03):number{
 for(let i=1;i<world.line.length;i++){const a=world.line[i-1]!;const b=world.line[i]!;const dx=b.x-a.x,dy=b.y-a.y;const length=dx*dx+dy*dy;const t=length===0?0:Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/length));if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<=lineWidth/2)return 0;}return 1;
}
export const RobotStateSchema=z.object({timeMs:z.number().min(0).max(120000),pose:point.extend({heading:z.number().finite()}),left:z.number().finite(),right:z.number().finite(),distance:z.number().finite().min(0).max(5).nullable(),distanceStatus:z.enum(['valid','missing','outOfRange']),distanceSource:z.enum(['ray','injected']),lineLeft:z.number().finite(),lineRight:z.number().finite(),led:z.boolean(),ledSecondary:z.boolean(),ledDuty:z.number().min(0).max(100),ledSecondaryDuty:z.number().min(0).max(100),collision:z.boolean(),goal:z.boolean(),activeBlock:z.string().nullable(),log:z.array(z.string().max(1200)).max(200),sound:z.object({frequencyHz:z.number().int().min(20).max(20000),endTimeMs:z.number().int().min(1).max(180000)}).strict().nullable(),status:z.enum(['ready','running','completed','error','cancelled']),error:z.string().nullable(),variables:z.record(z.string(),z.number().finite())}).strict().refine(state=>(state.distanceStatus==='valid')===(state.distance!==null),'DISTANCE_STATE_INVALID');
export type RobotState=z.infer<typeof RobotStateSchema>;
export class RobotSimulation {
 readonly state:RobotState;private distanceInput:DistanceInput|undefined;private button:boolean;private buttonEventIndex=0;private frame=new Map<string,number>();private definitions=new Map<string,FunctionDefinition>();private variables:Record<string,number>={};private target=[0,0];private wake=0;private iterator:Generator<Instruction>;private exhausted=false;private config:z.infer<typeof RobotConfigSchema>;private randomState:number;
 constructor(readonly program:Program|FunctionProgram,readonly world:World,private readonly interactive=false){if('functions' in program)this.definitions=validateFunctions(program).definitions;else validateProgram(program);const validatedWorld=WorldSchema.safeParse(world);if(!validatedWorld.success){if(validatedWorld.error.issues.some(i=>i.message==='SIM_INVALID_START'))throw new Error('SIM_INVALID_START');throw validatedWorld.error;}this.distanceInput=validatedWorld.data.distanceInput;this.button=world.inputs?.button??false;this.config=RobotConfigSchema.parse(world.robot??{});this.randomState=this.config.seed;if(collides(world,world.start,this.config.radius))throw new Error('SIM_INVALID_START');this.state={timeMs:0,pose:{...world.start},left:0,right:0,distance:0,distanceStatus:'valid',distanceSource:'ray',lineLeft:1,lineRight:1,led:false,ledSecondary:false,ledDuty:0,ledSecondaryDuty:0,collision:false,goal:false,activeBlock:null,log:[],sound:null,status:'ready',error:null,variables:this.variables};this.iterator=this.run();this.sensors();}
 private noise(){this.randomState=(Math.imul(this.randomState,1664525)+1013904223)>>>0;return (this.randomState/4294967296*2-1)*this.config.noise;}
 private *instructions(list:FunctionInstruction[]):Generator<Instruction>{for(const i of list){if(i.kind==='call'){yield {kind:'wait',ms:0,blockId:i.blockId};const definition=this.definitions.get(i.name)!;const values=i.arguments.map(e=>this.expression(e)),previous=this.frame;this.frame=new Map(definition.parameters.map((name,index)=>[name,values[index]!]));try{yield* this.instructions(definition.body);}finally{this.frame=previous;}}else if(i.kind==='if')yield* this.instructions(this.expression(i.condition)?i.then:i.otherwise);else if(i.kind==='while'){let iterations=0;while(this.expression(i.condition)){if(iterations++>=i.maxIterations)throw new Error('LOOP_BUDGET');yield {kind:'wait',ms:0,blockId:i.blockId};yield* this.instructions(i.body);}}else if(i.kind==='repeat'){for(let n=0;n<i.count;n++){yield {kind:'wait',ms:0,blockId:i.blockId};yield* this.instructions(i.body);}}else yield i;}}
 private *run():Generator<Instruction>{while(this.interactive)yield {kind:"wait",ms:20};yield* this.instructions(this.program.setup);while(this.program.loop.length){yield* this.instructions(this.program.loop);yield {kind:'wait',ms:0};}}
 private readButton():number{const events=this.world.buttonEvents??[];while(this.buttonEventIndex<events.length&&events[this.buttonEventIndex]!.timeMs<=this.state.timeMs)this.button=events[this.buttonEventIndex++]!.pressed;return Number(this.button);}
 private readAnalog(sensor:'analogCounts'|'analogVolts'):number{if(!this.world.analog)throw new Error('ANALOG_MODEL_REQUIRED');const sample=sampleAnalog(this.world.analog,this.state.timeMs);return sensor==='analogCounts'?sample.counts:sample.volts;}
 private expression(e:Expression):number{return evaluateExpression(e,name=>this.frame.get(name)??this.variables[name]??0,sensor=>{if(sensor==='analogCounts'||sensor==='analogVolts')return this.readAnalog(sensor);const s=this.state;if(sensor==='distanceValid')return Number(s.distanceStatus==='valid');if(sensor==='distance'){if(s.distance===null)throw new Error('DISTANCE_READING_INVALID: '+s.distanceStatus);return s.distance;}return sensor==='timeMs'?s.timeMs:sensor==='lineLeft'?s.lineLeft:sensor==='lineRight'?s.lineRight:sensor==='heading'?s.pose.heading:sensor==='x'?s.pose.x:sensor==='y'?s.pose.y:this.readButton();});}
 private sensors(){const p=this.state.pose,c=Math.cos(p.heading),s=Math.sin(p.heading);this.state.lineLeft=lineReflectance(this.world,p.x+this.config.probeForward*c-this.config.probeSeparation/2*s,p.y+this.config.probeForward*s+this.config.probeSeparation/2*c);this.state.lineRight=lineReflectance(this.world,p.x+this.config.probeForward*c+this.config.probeSeparation/2*s,p.y+this.config.probeForward*s-this.config.probeSeparation/2*c);const ray=rayDistance(this.world,p,this.config.distanceMax,this.noise());this.state.distance=ray.meters;this.state.distanceStatus=ray.status;this.state.distanceSource=ray.source;if(this.distanceInput){const reading=injectedDistance(this.distanceInput,this.state.timeMs,this.config.distanceMax);this.state.distance=reading.meters;this.state.distanceStatus=reading.status;this.state.distanceSource=reading.source;}this.state.goal=Math.hypot(p.x-this.world.goal.x,p.y-this.world.goal.y)<=this.world.goal.radius;}
 private apply(i:Instruction){if(i.kind==='drive')this.target=[i.left/100*this.config.maxSpeed,i.right/100*this.config.maxSpeed];else if(i.kind==='stop')this.target=[0,0];else if(i.kind==='set'){const value=this.expression(i.value);if(this.frame.has(i.name))this.frame.set(i.name,value);else this.variables[i.name]=value;}else if(i.kind==='sound'){checkedSound(i);this.state.sound={frequencyHz:i.frequencyHz,endTimeMs:this.state.timeMs+i.durationMs};}else if(i.kind==='soundStop')this.state.sound=null;else if(i.kind==='pwm'){const duty=checkedPWMPercent(this.expression(i.value));if(i.channel===2){this.state.ledSecondaryDuty=duty;this.state.ledSecondary=duty>0;}else{this.state.ledDuty=duty;this.state.led=duty>0;}}else if(i.kind==='led'){if(i.channel===2){this.state.ledSecondary=i.on;this.state.ledSecondaryDuty=i.on?100:0;}else{this.state.led=i.on;this.state.ledDuty=i.on?100:0;}}else if(i.kind==='printValue'){this.state.log.push(`${this.state.timeMs} ms: ${formatPrintedValue(i.label,this.expression(i.value))}`);if(this.state.log.length>200)this.state.log.shift();}else if(i.kind==='print'){this.state.log.push(`${this.state.timeMs} ms: ${i.text}`);if(this.state.log.length>200)this.state.log.shift();}}
 driveInteractive(command:Extract<Instruction,{kind:'drive'|'stop'|'led'}>){
  if(!this.interactive)throw new Error('SIM_INTERACTIVE_REQUIRED');
  if(this.state.status==='error'||this.state.status==='cancelled'||this.state.status==='completed')return;
  this.apply(command);
 }
 readInteractive(sensor:Extract<Expression,{kind:'sensor'}>['sensor']){
  if(sensor==='distance')return this.state.distance;
  return this.expression({kind:'sensor',sensor});
 }
 finishInteractive(status:'completed'|'cancelled'|'error',error:string|null=null){
  if(status==='cancelled')return this.cancel();
  this.target=[0,0];this.state.left=0;this.state.right=0;this.state.sound=null;
  this.exhausted=true;this.iterator.return(undefined);
  this.state.status=status;this.state.error=error;
  return structuredClone(this.state);
 }
 cancel():RobotState{if(this.state.status==='ready'||this.state.status==='running'){this.target=[0,0];this.state.left=0;this.state.right=0;this.state.sound=null;this.state.activeBlock=null;this.state.status='cancelled';this.exhausted=true;this.iterator.return(undefined);this.state.log.push(`${this.state.timeMs} ms: CANCELLED`);if(this.state.log.length>200)this.state.log.shift();}return structuredClone(this.state);}
 step(ticks=1):RobotState{if(!Number.isInteger(ticks)||ticks<1||ticks>1000)throw new Error('SIM_TICK_RANGE');for(let tick=0;tick<ticks;tick++){if(this.state.status==='error'||this.state.status==='completed'||this.state.status==='cancelled')break;this.state.status='running';try{if(this.state.timeMs>=120000)throw new Error('SIM_TIME_LIMIT');let budget=1000;while(this.state.timeMs>=this.wake&&!this.exhausted){if(--budget<0)throw new Error('SIM_INSTRUCTION_BUDGET');const next=this.iterator.next();if(next.done){this.exhausted=true;this.target=[0,0];break;}const i=next.value;this.state.activeBlock=i.blockId??null;if(i.kind==='wait'||i.kind==='waitValue'){const ms=i.kind==='wait'?i.ms:checkedWaitMs(this.expression(i.value));this.wake=this.state.timeMs+ms;if(ms>0)break;}else this.apply(i);}
 const approach=(value:number,target:number)=>value+Math.max(-this.config.acceleration*.02,Math.min(this.config.acceleration*.02,target-value));this.state.left=approach(this.state.left,this.target[0]!);this.state.right=approach(this.state.right,this.target[1]!);const proposed=stepDrive(this.state.pose,this.state.left,this.state.right,this.config.track,.02);this.state.collision=collides(this.world,proposed,this.config.radius);if(this.state.collision){this.state.left=0;this.state.right=0;this.target=[0,0];}else this.state.pose=proposed;this.state.timeMs+=20;if(this.state.sound&&this.state.timeMs>=this.state.sound.endTimeMs)this.state.sound=null;this.sensors();if(this.exhausted&&!this.state.sound&&Math.abs(this.state.left)+Math.abs(this.state.right)<.001)this.state.status='completed';}catch(e){this.state.status='error';this.state.error=String(e);this.state.sound=null;this.target=[0,0];this.state.left=0;this.state.right=0;}}return structuredClone(this.state);}
}
