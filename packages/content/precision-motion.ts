import {RobotSimulation,WorldSchema} from '../simulator';
import {EncoderCounterAdapter} from '../simulator/encoder';
import {encoderDefaults} from './encoder-experiment';
import type {Program,Instruction} from '../codegen';
export type PrecisionCase='normal'|'missing-feedback'|'manual-stop';
/** Straight target pose: wheel counts estimate translation; their difference estimates heading. */
export class PrecisionController {
 private state:'moving'|'target'|'fault'|'timeout'='moving';private last=-1;
 constructor(private readonly targetMeters:number){if(!Number.isFinite(targetMeters)||targetMeters<.1||targetMeters>.8)throw new Error('PRECISION_TARGET');}
 tick(timeMs:number,leftMeters:number|null,rightMeters:number|null,stopRequested=false){
  if(!Number.isInteger(timeMs)||timeMs<0||timeMs>120000||timeMs<=this.last)throw new Error('PRECISION_TIME');
  if(stopRequested||this.last>=0&&timeMs-this.last>100)this.state='fault';
  const valid=leftMeters!==null&&rightMeters!==null&&[leftMeters,rightMeters].every(Number.isFinite)&&Math.abs(leftMeters)<=2&&Math.abs(rightMeters)<=2;
  if(!valid)this.state='fault';
  if(this.state==='moving'){
   if(timeMs>=10000)this.state='timeout';
   else if((leftMeters!+rightMeters!)/2>=this.targetMeters-.003)this.state='target';
  }
  this.last=timeMs;
  const distance=valid?(leftMeters!+rightMeters!)/2:null,heading=valid?(rightMeters!-leftMeters!)/.18:null;
  const forward=this.state==='moving'?Math.max(5,Math.min(25,(this.targetMeters-distance!)*160)):0,steer=this.state==='moving'?Math.max(-8,Math.min(8,heading!*30)):0;
  return {timeMs,state:this.state,left:this.state==='moving'?Math.max(0,Math.min(30,forward+steer)):0,right:this.state==='moving'?Math.max(0,Math.min(30,forward-steer)):0,estimatedDistanceMeters:distance,estimatedHeadingRadians:heading};
 }
}
export function precisionTrial(mode:'feedback'|'timed'='feedback',targetMeters=.4,maximumSpeedMps=.6,caseId:PrecisionCase='normal'){
 if(!['feedback','timed'].includes(mode)||!Number.isFinite(maximumSpeedMps)||maximumSpeedMps<.4||maximumSpeedMps>.8||!['normal','missing-feedback','manual-stop'].includes(caseId))throw new Error('PRECISION_CONFIG');
 const controller=new PrecisionController(targetMeters),world=WorldSchema.parse({id:'L36-'+caseId,width:3,height:3,start:{x:.5,y:1.5,heading:0},goal:{x:.5+targetMeters,y:1.5,radius:.01},obstacles:[],line:[],robot:{maxSpeed:maximumSpeedMps,track:.18,acceleration:1.25,radius:.12}});
 const drive:Instruction={kind:'drive',left:0,right:0},body:Instruction[]=[drive,{kind:'wait',ms:20}];
 const program:Program={setup:[{kind:'repeat',count:500,body},{kind:'stop'},{kind:'wait',ms:300}],loop:[]},simulation=new RobotSimulation(program,world),left=new EncoderCounterAdapter(encoderDefaults),right=new EncoderCounterAdapter(encoderDefaults);
 let leftTravel=0,rightTravel=0,leftEstimate=0,rightEstimate=0,timedStopped=false;
 left.accept({timeMs:0,rawCount:0,epoch:0});right.accept({timeMs:0,rawCount:0,epoch:0});
 const trace=[structuredClone(simulation.state)],decisions=[];
 const raw=(travel:number)=>Math.trunc(travel/encoderDefaults.wheelCircumferenceMeters*encoderDefaults.countsPerWheelRevolution)%65536;
 const timedDurationMs=Math.round(targetMeters/(.6*.25)*1000/20)*20;
 for(let tick=0;tick<520&&simulation.state.status!=='completed'&&simulation.state.status!=='error';tick++){
  const timeMs=simulation.state.timeMs,missing=caseId==='missing-feedback'&&timeMs>=500&&timeMs<1000,stop=caseId==='manual-stop'&&timeMs===500;
  if(tick<500){
   const decision=controller.tick(timeMs,missing?null:leftEstimate,missing?null:rightEstimate,stop);
   if(mode==='timed'&&(timeMs>=timedDurationMs||decision.state==='fault'||decision.state==='timeout'))timedStopped=true;
   const command=mode==='feedback'?decision:{...decision,state:timedStopped?'timed-stop':'moving',left:timedStopped?0:25,right:timedStopped?0:25};
   (drive as Extract<Instruction,{kind:'drive'}>).left=command.left;(drive as Extract<Instruction,{kind:'drive'}>).right=command.right;decisions.push(command);
  }
  const frame=simulation.step();trace.push(frame);leftTravel+=frame.left*.02;rightTravel+=frame.right*.02;
  if(!missing){leftEstimate=left.accept({timeMs:frame.timeMs,rawCount:raw(leftTravel),epoch:0}).distanceSinceResetMeters;rightEstimate=right.accept({timeMs:frame.timeMs,rawCount:raw(rightTravel),epoch:0}).distanceSinceResetMeters;}
 }
 const final=trace.at(-1)!,terminal=decisions.find(row=>row.state!=='moving'),positionErrorMeters=Math.hypot(final.pose.x-world.goal.x,final.pose.y-world.goal.y);
 return {schemaVersion:1,origin:'actual-robot-simulation-with-quantized-wheel-travel',mode,caseId,targetMeters,maximumSpeedMps,world,execution:'External controller updates a bounded repeat body before each simulator step; decisions contain authoritative applied commands, not a standalone replay program.',encoderConfiguration:{...encoderDefaults},timedDurationMs,trace,decisions,outcome:{state:terminal?.state??'timeout',positionErrorMeters,headingErrorRadians:final.pose.heading,collision:trace.some(row=>row.collision),stopRequestMs:terminal?.timeMs??10000,settledStopMs:trace.find(row=>row.timeMs>=(terminal?.timeMs??10000)&&row.left===0&&row.right===0)?.timeMs??null},physicalVerification:'NOT RUN',scope:'Straight target pose; wheel-travel-derived odometry assumes no slip and known track/circumference. No physical encoder acquisition.'} as const;
}
export function comparePrecision(targetMeters=.4,variation=.15,repetitions=3,caseId:PrecisionCase='normal'){
 if(!Number.isFinite(variation)||variation<0||variation>.2||!Number.isInteger(repetitions)||repetitions<2||repetitions>5)throw new Error('PRECISION_REPETITIONS');
 const runs=Array.from({length:repetitions},(_,index)=>{const maximumSpeedMps=.6*(1+variation*(index/(repetitions-1)*2-1));return {trial:index+1,maximumSpeedMps,feedback:precisionTrial('feedback',targetMeters,maximumSpeedMps,caseId),timed:precisionTrial('timed',targetMeters,maximumSpeedMps,caseId)};});
 return {runs,variation,repetitions,caseId,scope:'Paired deterministic model assumptions, not physical repeatability or sampled motor noise.'};
}
function precisionWorksheet(counts:number):Program{return {setup:[{kind:'print',text:'DECLARED PRECISION COUNT CALCULATION; NOT BOARD FEEDBACK'},{kind:'set',name:'declared_counts',value:{kind:'number',value:counts}},{kind:'set',name:'declared_distance_m',value:{kind:'binary',op:'*',left:{kind:'binary',op:'/',left:{kind:'variable',name:'declared_counts'},right:{kind:'number',value:360}},right:{kind:'number',value:.2}}},{kind:'printValue',label:'declared distance m=',value:{kind:'variable',name:'declared_distance_m'}},{kind:'wait',ms:20}],loop:[]};}
export const precisionArtifact={starter:precisionWorksheet(360),reference:precisionWorksheet(720)};
