import type {Program,Instruction,Expression} from '../codegen';
import {RobotSimulation,WorldSchema} from '../simulator';
import {proportionalCorrection} from './proportional-line';
export const courseCases=['clear','obstacle','missing','threshold-boundary','manual-stop'] as const;
export type CourseCase=typeof courseCases[number];
export type CourseState='track'|'goal'|'obstacle'|'fault'|'lost'|'timeout';
export interface CourseInput {timeMs:number;left:number|null;right:number|null;distance:number|null;stopRequested:boolean;atFinish:boolean}
/** Priority: manual stop, existing latch, invalid distance, obstacle, lost line, finish, tracking. */
export class CourseController {
 private state:CourseState='track';private last=-1;
 tick(input:CourseInput){
  if(!Number.isInteger(input.timeMs)||input.timeMs<0||input.timeMs>120000||input.timeMs<=this.last)throw new Error('COURSE_TIME');
  if(input.stopRequested||(this.last>=0&&input.timeMs-this.last>100))this.state='fault';
  else if(this.state==='track'){
   if(input.distance===null||!Number.isFinite(input.distance)||input.distance<0||input.distance>2)this.state='fault';
   else if(input.distance<=.3)this.state='obstacle';
   else if(input.left!==0&&input.left!==1||input.right!==0&&input.right!==1)this.state='fault';
   else if(input.left===1&&input.right===1)this.state='lost';
   else if(input.atFinish)this.state='goal';
   else if(input.timeMs>=8000)this.state='timeout';
  }
  this.last=input.timeMs;
  const correction=this.state==='track'?proportionalCorrection(input.right!-input.left!,8):0;
  return {timeMs:input.timeMs,state:this.state,left:this.state==='track'?20-correction:0,right:this.state==='track'?20+correction:0};
 }
}
const n=(value:number):Expression=>({kind:'number',value}),v=(name:string):Expression=>({kind:'variable',name});
const sensor=(value:'distance'|'distanceValid'|'button'|'x'):Expression=>({kind:'sensor',sensor:value});
const binary=(op:'<'|'>'|'=='|'&&',left:Expression,right:Expression):Expression=>({kind:'binary',op,left,right});
const branch=(condition:Expression,then:Instruction[],otherwise:Instruction[]=[]):Instruction=>({kind:'if',condition,then,otherwise});
const state=(value:number):Instruction=>({kind:'set',name:'course_state',value:n(value)});
/** track=0 goal=1 obstacle=2 fault=3 lost=4 timeout=5. Binary sensors; fixed 20 ms service. */
export function courseProgram(checkObstacle=true):Program{
 const lost=binary('&&',binary('==',v('course_left'),n(1)),binary('==',v('course_right'),n(1)));
 const follow=branch(lost,[state(4)],[branch(binary('>',sensor('x'),n(1.35)),[state(1)])]);
 const distance=checkObstacle?branch(sensor('distanceValid'),[branch(binary('>',sensor('distance'),n(.3)),[follow],[state(2)])],[state(3)]):follow;
 const output=branch(binary('==',v('course_state'),n(0)),[branch(binary('<',v('course_left'),v('course_right')),[{kind:'drive',left:12,right:28}],[branch(binary('>',v('course_left'),v('course_right')),[{kind:'drive',left:28,right:12}],[{kind:'drive',left:20,right:20}])])],[{kind:'stop'}]);
 return {setup:[state(0),{kind:'repeat',count:400,body:[{kind:'set',name:'course_left',value:{kind:'sensor',sensor:'lineLeft'}},{kind:'set',name:'course_right',value:{kind:'sensor',sensor:'lineRight'}},branch(sensor('button'),[state(3)],[branch(binary('==',v('course_state'),n(0)),[distance])]),output,{kind:'wait',ms:20}]},branch(binary('==',v('course_state'),n(0)),[state(5)]),{kind:'stop'},{kind:'wait',ms:300}],loop:[]};
}
export function courseWorld(caseId:CourseCase){
 if(!courseCases.includes(caseId))throw new Error('COURSE_CASE');
 return WorldSchema.parse({id:'L30-'+caseId,width:2,height:2,start:{x:.5,y:.988,heading:0},goal:{x:1.35,y:1,radius:.05},obstacles:caseId==='obstacle'?[{x:1.15,y:.7,width:.1,height:.6}]:[],line:[{x:.3,y:1},{x:1.8,y:1}],robot:{probeForward:.08,probeSeparation:.02,track:.18,maxSpeed:.6,acceleration:1.25,radius:.12},...(caseId==='missing'?{distanceInput:{initialMeters:1,events:[{timeMs:800,meters:null},{timeMs:1400,meters:1}]}}:caseId==='threshold-boundary'?{distanceInput:{initialMeters:.3,events:[]}}:{}),...(caseId==='manual-stop'?{buttonEvents:[{timeMs:800,pressed:true},{timeMs:1000,pressed:false}]}:{})});
}
export function runCourse(caseId:CourseCase,reference=true){
 const world=courseWorld(caseId),program=courseProgram(reference),simulation=new RobotSimulation(program,world);
 const trace=[structuredClone(simulation.state)],decisions:{timeMs:number;state:CourseState;left:number;right:number;distance:number|null}[]=[];
 const states:CourseState[]=['track','goal','obstacle','fault','lost','timeout'];
 for(let tick=0;tick<450&&simulation.state.status!=='completed'&&simulation.state.status!=='error';tick++){
  const timeMs=simulation.state.timeMs,distance=simulation.state.distance,frame=simulation.step();trace.push(frame);
  if(timeMs<8000){const state=states[frame.variables.course_state!]!,correction=state==='track'?proportionalCorrection(frame.variables.course_right!-frame.variables.course_left!,8):0;decisions.push({timeMs,state,left:state==='track'?20-correction:0,right:state==='track'?20+correction:0,distance});}
 }
 const final=trace.at(-1)!,request=decisions.find(decision=>decision.state!=='track');
 const stopRequestMs=request?.timeMs??8000,settled=trace.find(frame=>frame.timeMs>=stopRequestMs&&frame.left===0&&frame.right===0)!;
 const collision=trace.some(frame=>frame.collision),goalReached=trace.some(frame=>frame.goal);
 const bodyClearanceMeters=caseId==='obstacle'?world.obstacles[0]!.x-final.pose.x-world.robot!.radius:null;
 return {schemaVersion:1,origin:'actual-robot-simulation',caseId,reference,world,program,trace,decisions,outcome:{state:states[final.variables.course_state!]!,goalReached,collision,coursePassed:final.variables.course_state===1&&goalReached&&!collision,stopRequestMs,settledStopMs:settled?.timeMs??null,bodyClearanceMeters},physicalVerification:'NOT RUN'} as const;
}
export function repeatCourse(caseId:CourseCase,repetitions=3){
 if(!Number.isInteger(repetitions)||repetitions<2||repetitions>5)throw new Error('COURSE_REPETITIONS');
 const runs=Array.from({length:repetitions},()=>runCourse(caseId));
 const x=runs.map(run=>run.trace.at(-1)!.pose.x),y=runs.map(run=>run.trace.at(-1)!.pose.y);
 return {caseId,runs,endpointRangeMeters:Math.hypot(Math.max(...x)-Math.min(...x),Math.max(...y)-Math.min(...y)),repeatabilityScope:'Deterministic simulation only; not physical repeatability'};
}
export const courseArtifact={starter:courseProgram(false),reference:courseProgram(),world:courseWorld('obstacle')};
