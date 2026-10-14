export type AvoidanceState='move'|'stop'|'inspect'|'turn'|'retry'|'blocked'|'fault';
export interface AvoidanceInput {timeMs:number;distanceMeters:number|null;valid:boolean;stopRequested:boolean}
export interface AvoidanceOutput {timeMs:number;state:AvoidanceState;left:number;right:number;attempts:number;transition:boolean}
/** Pure tick controller: no sleeps, sensor reads, hardware access or implicit rearming. */
export class ObstacleAvoidance {
 private state:AvoidanceState='move';private entered=0;private last=-1;private attempts=0;
 constructor(private readonly threshold=.3,private readonly maximumAttempts=2){
  if(!Number.isFinite(threshold)||threshold<.2||threshold>.8||!Number.isInteger(maximumAttempts)||maximumAttempts<1||maximumAttempts>3)throw new Error('AVOIDANCE_CONFIG');
 }
 tick(input:AvoidanceInput):AvoidanceOutput{
  if(!Number.isInteger(input.timeMs)||input.timeMs<0||input.timeMs>120000||input.timeMs<=this.last)throw new Error('AVOIDANCE_TIME');
  const previous=this.state,elapsed=input.timeMs-this.entered;
  const valid=input.valid&&input.distanceMeters!==null&&Number.isFinite(input.distanceMeters)&&input.distanceMeters>=0&&input.distanceMeters<=2;
  const change=(state:AvoidanceState)=>{this.state=state;this.entered=input.timeMs;};
  // Tick cadence is explicit: a late update cannot extend an old movement command.
  if(input.stopRequested||!valid||(this.last>=0&&input.timeMs-this.last>100))change('fault');
  else if(this.state!=='fault'&&this.state!=='blocked'){
   const clear=input.distanceMeters!>this.threshold;
   if(this.state==='move'&&!clear)change('stop');
   else if(this.state==='stop'&&elapsed>=100)change('inspect');
   else if(this.state==='inspect'&&elapsed>=100){
    if(clear)change('retry');
    else if(this.attempts>=this.maximumAttempts)change('blocked');
    else{this.attempts++;change('turn');}
   }else if(this.state==='turn'&&elapsed>=1180)change('retry');
   else if(this.state==='retry')change(clear?'move':'stop');
  }
  this.last=input.timeMs;
  const moving=this.state==='move',turning=this.state==='turn';
  return {timeMs:input.timeMs,state:this.state,left:moving?20:turning?-20:0,right:moving||turning?20:0,attempts:this.attempts,transition:previous!==this.state};
 }
}
