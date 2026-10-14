import {RobotSimulation} from '../simulator';
import {lineFollowingArtifact} from './line-following-artifact';
import {lineDecision,type LineDecision} from './line-following';
export const lineCases=['centered','left','right','lost'] as const;
export type LineCase=typeof lineCases[number];
export function runLineCase(caseId:LineCase,reference=true){
 if(!lineCases.includes(caseId))throw new Error('LINE_CASE');
 const y={centered:1,left:.988,right:1.012,lost:1.1}[caseId];
 const world={...structuredClone(lineFollowingArtifact.world!),start:{x:.5,y,heading:0}};
 const simulation=new RobotSimulation(reference?lineFollowingArtifact.reference:lineFollowingArtifact.starter,world);
 const initial={left:simulation.state.lineLeft,right:simulation.state.lineRight};
 const expected=lineDecision(initial.left,initial.right);
 const trace=[structuredClone(simulation.state)];
 const decisions:{timeMs:number;leftSample:number;rightSample:number;state:LineDecision}[]=[];
 const states:LineDecision[]=['centered','left','right','lost','fault'];
 for(let tick=0;tick<450&&simulation.state.status!=='completed'&&simulation.state.status!=='error';tick++){
  const sampledAtMs=simulation.state.timeMs;const frame=simulation.step();trace.push(frame);
  if(sampledAtMs<8000)decisions.push({timeMs:sampledAtMs,leftSample:frame.variables.left_sample!,rightSample:frame.variables.right_sample!,state:states[frame.variables.line_state!]!});
 }
 const request=decisions.find(decision=>decision.state==='lost'||decision.state==='fault');
 const settled=request?trace.find(frame=>frame.timeMs>=request.timeMs&&frame.left===0&&frame.right===0):null;
 return {schemaVersion:1,origin:'actual-robot-simulation',caseId,reference,world,initial,expected,decisions,trace,stopRequestMs:request?.timeMs??null,settledStopMs:settled?.timeMs??null,physicalVerification:'NOT RUN'} as const;
}
