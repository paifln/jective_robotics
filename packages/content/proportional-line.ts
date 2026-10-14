import type {Program,Instruction,Expression} from '../codegen';
import {RobotSimulation,WorldSchema} from '../simulator';
export function proportionalCorrection(error:number,gain:number,limit=30){
 if(!Number.isFinite(error)||Math.abs(error)>1||!Number.isFinite(gain)||gain<0||gain>100||!Number.isFinite(limit)||limit<1||limit>30)throw new Error('LINE_P_CONFIG');
 return Math.max(-limit,Math.min(limit,gain*error));
}
const n=(value:number):Expression=>({kind:'number',value}),v=(name:string):Expression=>({kind:'variable',name});
const binary=(op:'<'|'>'|'=='|'&&'|'-',left:Expression,right:Expression):Expression=>({kind:'binary',op,left,right});
const branch=(condition:Expression,then:Instruction[],otherwise:Instruction[]=[]):Instruction=>({kind:'if',condition,then,otherwise});
const state=(value:number):Instruction=>({kind:'set',name:'p_state',value:n(value)});
/** Binary reflectance gives errors -1, 0, 1. Each branch applies the same bounded P rule. */
export function proportionalLineProgram(gain:number):Program{
 const correction=proportionalCorrection(1,gain);
 const lost=binary('&&',binary('==',v('p_left'),n(1)),binary('==',v('p_right'),n(1)));
 const error=binary('-',v('p_right'),v('p_left'));
 const output=branch(binary('==',v('p_state'),n(0)),[branch(binary('>',v('p_error'),n(0)),[{kind:'drive',left:20-correction,right:20+correction}],[branch(binary('<',v('p_error'),n(0)),[{kind:'drive',left:20+correction,right:20-correction}],[{kind:'drive',left:20,right:20}])])],[{kind:'stop'}]);
 return {setup:[state(0),{kind:'repeat',count:300,body:[{kind:'set',name:'p_left',value:{kind:'sensor',sensor:'lineLeft'}},{kind:'set',name:'p_right',value:{kind:'sensor',sensor:'lineRight'}},{kind:'set',name:'p_error',value:error},branch({kind:'sensor',sensor:'button'},[state(2)],[branch(binary('==',v('p_state'),n(0)),[branch(lost,[state(1)])])]),output,{kind:'wait',ms:20}]},{kind:'stop'},{kind:'wait',ms:300}],loop:[]};
}
export const proportionalLineWorld=WorldSchema.parse({id:'L29-proportional-line',width:2,height:2,start:{x:.5,y:.988,heading:0},goal:{x:1.7,y:1,radius:.05},obstacles:[],line:[{x:.3,y:1},{x:1.8,y:1}],robot:{probeForward:.08,probeSeparation:.02,track:.18,maxSpeed:.6,acceleration:1.25,radius:.12}});
export function runProportionalLine(gain:number){
 const program=proportionalLineProgram(gain),simulation=new RobotSimulation(program,structuredClone(proportionalLineWorld));
 const trace=[structuredClone(simulation.state)];
 const commands:{timeMs:number;error:number;correction:number;left:number;right:number;state:number}[]=[];
 for(let tick=0;tick<350&&simulation.state.status!=='completed'&&simulation.state.status!=='error';tick++){
  const timeMs=simulation.state.timeMs,frame=simulation.step();trace.push(frame);
  if(timeMs<6000){const error=frame.variables.p_error!,state=frame.variables.p_state!,correction=proportionalCorrection(error,gain);commands.push({timeMs,error,correction:state===0?correction:0,left:state===0?20-correction:0,right:state===0?20+correction:0,state});}
 }
 let previousSign=0,reversals=0;for(const command of commands){const sign=Math.sign(command.correction);if(sign&&previousSign&&sign!==previousSign)reversals++;if(sign)previousSign=sign;}
 const tracking=trace.filter(frame=>frame.timeMs<=6000),rmsError=Math.sqrt(tracking.reduce((sum,frame)=>sum+(frame.pose.y-1)**2,0)/tracking.length);
 return {schemaVersion:1,origin:'actual-robot-simulation',gain,correctionLimit:30,baseCommand:20,world:structuredClone(proportionalLineWorld),program,commands,trace,metrics:{rmsLateralMeters:rmsError,maximumLateralMeters:Math.max(...tracking.map(frame=>Math.abs(frame.pose.y-1))),firstCenteredMs:commands.find(command=>command.state===0&&command.error===0)?.timeMs??null,correctionReversals:reversals,progressMeters:simulation.state.pose.x-proportionalLineWorld.start.x,lostAtMs:commands.find(command=>command.state===1)?.timeMs??null,saturatedSamples:commands.filter(command=>Math.abs(command.correction)===30).length},physicalVerification:'NOT RUN'} as const;
}
export const proportionalLineArtifact={starter:proportionalLineProgram(1),reference:proportionalLineProgram(8),world:proportionalLineWorld};
export function compareProportionalTrials(gains:readonly number[]){
 if(gains.length!==3||new Set(gains).size!==3)throw new Error('LINE_P_THREE_DISTINCT_GAINS');
 return gains.map(runProportionalLine);
}
