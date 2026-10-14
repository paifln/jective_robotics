import {RobotSimulation,WorldSchema,type RobotState} from '../simulator';
import type {Program} from '../codegen';
export const steeringCases=['equal','unequal','opposite'] as const;
export type SteeringCase=typeof steeringCases[number];
export const steeringCommands={equal:[20,20],unequal:[10,20],opposite:[-20,20]} as const;
export const steeringWorld=WorldSchema.parse({id:'L21-steering-comparison',width:4,height:3,start:{x:1.5,y:1.5,heading:0},goal:{x:3.5,y:2.5,radius:.1},obstacles:[],line:[],robot:{track:.18,maxSpeed:.6,acceleration:1.25,radius:.12}});
export function steeringProgram(kind:SteeringCase,signs:[1|-1,1|-1]=[1,1]):Program{
 if(!steeringCases.includes(kind)||signs.length!==2||!signs.every(sign=>sign===1||sign===-1))throw new Error('STEERING_CASE');
 const [left,right]=steeringCommands[kind];
 return {setup:[{kind:'drive',left:left*signs[0],right:right*signs[1]},{kind:'wait',ms:1000},{kind:'stop'},{kind:'wait',ms:200}],loop:[]};
}
export function steeringExperiment(kind:SteeringCase,signs:[1|-1,1|-1]=[1,1]){
 const program=steeringProgram(kind,signs),simulation=new RobotSimulation(program,steeringWorld),trace:RobotState[]=[structuredClone(simulation.state)];
 for(let i=0;i<100;i++){const state=simulation.step();trace.push(state);if(['completed','error','cancelled'].includes(state.status))break;}
 const final=trace.at(-1)!;if(final.status!=='completed'||trace.some(state=>state.collision))throw new Error('STEERING_EXPERIMENT_FAILED');
 return {schemaVersion:1,origin:'simulation',scenario:kind,command:steeringCommands[kind],modeledSigns:signs,units:{position:'m',heading:'rad',wheelVelocity:'m/s',command:'percent of configured model maximum speed'},world:steeringWorld,program,trace,physicalVerification:'NOT RUN'} as const;
}
