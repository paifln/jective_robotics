import {calibrateLine,classifyLine} from './line-calibration';
export type LineDecision='centered'|'left'|'right'|'lost'|'fault';
export interface LineInput {timeMs:number;left:number|null;right:number|null;stopRequested:boolean}
/** This table requires a stripe wider than probe separation: both dark means centered. */
export function lineDecision(left:number|null,right:number|null,calibration=calibrateLine([0,0,0],[1,1,1])):LineDecision{
 const a=classifyLine(left,calibration),b=classifyLine(right,calibration);
 if(a==='uncertain'||b==='uncertain')return 'fault';
 return a==='dark'?(b==='dark'?'centered':'left'):(b==='dark'?'right':'lost');
}
/** A loss requests stop immediately and latches it. Reset requires a new controller. */
export class TwoSensorLineFollower {
 private last=-1;private stopped:LineDecision|null=null;
 constructor(private readonly calibration=calibrateLine([0,0,0],[1,1,1])){}
 tick(input:LineInput){
  if(!Number.isInteger(input.timeMs)||input.timeMs<0||input.timeMs>120000||input.timeMs<=this.last)throw new Error('LINE_FOLLOW_TIME');
  const decision=lineDecision(input.left,input.right,this.calibration);
  if(input.stopRequested||(this.last>=0&&input.timeMs-this.last>100)||decision==='fault')this.stopped='fault';
  else if(decision==='lost'&&!this.stopped)this.stopped='lost';
  this.last=input.timeMs;
  const state=this.stopped??decision;
  return {timeMs:input.timeMs,state,left:state==='centered'?20:state==='left'?10:state==='right'?20:0,right:state==='centered'?20:state==='left'?20:state==='right'?10:0,stopLatched:this.stopped!==null};
 }
}
