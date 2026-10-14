import {RobotSimulation,WorldSchema} from '../simulator';
import {EncoderCounterAdapter,validateEncoderConfiguration,type EncoderConfiguration} from '../simulator/encoder';
import type {Program,Instruction,Expression} from '../codegen';
export const encoderDefaults:EncoderConfiguration={counterBits:16,countsPerWheelRevolution:360,wheelCircumferenceMeters:.2,maximumCountsPerSample:1000};
export const encoderMotionProgram:Program={setup:[{kind:'drive',left:30,right:30},{kind:'wait',ms:1000},{kind:'stop'},{kind:'wait',ms:200},{kind:'drive',left:-30,right:-30},{kind:'wait',ms:500},{kind:'stop'},{kind:'wait',ms:200}],loop:[]};
export function encoderMotionExperiment(config:EncoderConfiguration=encoderDefaults,maximumSpeedMps=.6){
 validateEncoderConfiguration(config);if(!Number.isFinite(maximumSpeedMps)||maximumSpeedMps<.3||maximumSpeedMps>.9)throw new Error('ENCODER_PLANT');
 const world=WorldSchema.parse({id:'L31-encoder-motion',width:3,height:3,start:{x:1,y:1,heading:0},goal:{x:2,y:2,radius:.1},obstacles:[],line:[],robot:{maxSpeed:maximumSpeedMps,track:.18,acceleration:1.25,radius:.12}});
 const simulation=new RobotSimulation(encoderMotionProgram,world),left=new EncoderCounterAdapter(config),right=new EncoderCounterAdapter(config);
 let leftTravel=0,rightTravel=0;
 const raw=(travel:number)=>{const count=Math.trunc(travel/config.wheelCircumferenceMeters*config.countsPerWheelRevolution),modulus=2**config.counterBits;return (count%modulus+modulus)%modulus;};
 const rows=[{timeMs:0,left:left.accept({timeMs:0,rawCount:0,epoch:0}),right:right.accept({timeMs:0,rawCount:0,epoch:0}),modeledLeftTravelMeters:0,modeledRightTravelMeters:0}];
 const trace=[structuredClone(simulation.state)];
 for(let tick=0;tick<150&&simulation.state.status!=='completed'&&simulation.state.status!=='error';tick++){
  const frame=simulation.step();trace.push(frame);leftTravel+=frame.left*.02;rightTravel+=frame.right*.02;
  rows.push({timeMs:frame.timeMs,left:left.accept({timeMs:frame.timeMs,rawCount:raw(leftTravel),epoch:0}),right:right.accept({timeMs:frame.timeMs,rawCount:raw(rightTravel),epoch:0}),modeledLeftTravelMeters:leftTravel,modeledRightTravelMeters:rightTravel});
 }
 return {schemaVersion:1,origin:'wheel-travel-quantization-model',config:{...config},maximumSpeedMps,world,program:structuredClone(encoderMotionProgram),rows,trace,noEncoderAlternative:{origin:'nominal-timing-estimate',distanceMeters:.6*.3*(1-.5),assumptions:'Uses fixed nominal speed 0.6 m/s and commanded durations, not encoder feedback or an observed physical distance'},physicalVerification:'NOT RUN'} as const;
}
const n=(value:number):Expression=>({kind:'number',value}),v=(name:string):Expression=>({kind:'variable',name});
function countWorksheet(countsPerWheelRevolution:number):Program{
 const body:Instruction[]=[{kind:'set',name:'counts_per_revolution',value:n(countsPerWheelRevolution)},{kind:'set',name:'circumference_m',value:n(.2)}];
 for(const counts of [180,360,-90])body.push({kind:'set',name:'declared_counts',value:n(counts)},{kind:'set',name:'distance_m',value:{kind:'binary',op:'*',left:{kind:'binary',op:'/',left:v('declared_counts'),right:v('counts_per_revolution')},right:v('circumference_m')}},{kind:'printValue',label:'declared distance m=',value:v('distance_m')},{kind:'wait',ms:20});
 return {setup:body,loop:[]};
}
export const encoderArtifact={starter:countWorksheet(200),reference:countWorksheet(360)};
export function decodeEncoderSamples(text:string,config:EncoderConfiguration=encoderDefaults){
 if(typeof text!=='string'||text.length>10000)throw new Error('ENCODER_TEXT');
 const lines=text.trim().split(/\r?\n/);if(lines.length<2||lines.length>100)throw new Error('ENCODER_TEXT');
 const adapter=new EncoderCounterAdapter(config);
 const rows=lines.map(line=>{if(!/^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*$/.test(line))throw new Error('ENCODER_TEXT');const [timeMs,rawCount,epoch]=line.split(',').map(value=>Number(value.trim()));return adapter.accept({timeMs:timeMs!,rawCount:rawCount!,epoch:epoch!});});
 return {schemaVersion:1,origin:'learner-entered-counts',config:{...config},rawInput:text,rows,physicalVerification:'NOT RUN'} as const;
}
