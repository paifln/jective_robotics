export type MotorMode='disarmed'|'tethered'|'autonomous';
export interface MotorSample {timeMs:number;left:number;right:number;mode:MotorMode;fault:boolean}
const uint=(value:number)=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
const elapsed=(now:number,then:number)=>(now-then)>>>0;
export class SafeMotorModel {
 private mode:MotorMode='disarmed';private fault=false;private sequence=0;
 private authorityAt=0;private lastTick=0;private motionAt=0;private duration=0;
 private left=0;private right=0;private targets=[0,0];private reverseAt:[number|null,number|null]=[null,null];
 arm(now:number,autonomous=false,stopAvailable=false){this.clock(now);if(this.fault||(autonomous&&!stopAvailable))return false;this.disarm();this.mode=autonomous?'autonomous':'tethered';this.authorityAt=this.lastTick=now;this.sequence=0;return true;}
 disarm(){this.mode='disarmed';this.left=this.right=0;this.targets=[0,0];this.reverseAt=[null,null];}
 fail(){this.fault=true;this.disarm();}
 heartbeat(seq:number,now:number){this.clock(now);if(!uint(seq)||this.mode!=='tethered'||seq<=this.sequence)return false;this.sequence=seq;this.authorityAt=now;return true;}
 drive(left:number,right:number,duration:number,seq:number,now:number){this.clock(now);if(this.mode==='disarmed'||!Number.isFinite(left)||!Number.isFinite(right)||Math.abs(left)>30||Math.abs(right)>30||!uint(duration)||duration===0||duration>2000||!uint(seq)||seq<=this.sequence)return false;this.sequence=seq;this.targets=[left,right];this.motionAt=now;this.duration=duration;return true;}
 tick(now:number,physicalStop=false):MotorSample {
  this.clock(now);if(physicalStop||this.fault||(this.mode==='tethered'&&elapsed(now,this.authorityAt)>=400))this.disarm();
  if(this.mode!=='disarmed'){
   if(elapsed(now,this.motionAt)>=this.duration)this.targets=[0,0];
   const increment=Math.min(elapsed(now,this.lastTick),20)*.04;this.lastTick=now;
   this.left=this.ramp(this.left,this.targets[0]!,increment,now,0);this.right=this.ramp(this.right,this.targets[1]!,increment,now,1);
  }
  return {timeMs:now,left:this.left,right:this.right,mode:this.mode,fault:this.fault};
 }
 private clock(now:number){if(!uint(now))throw new Error('MOTOR_MODEL_CLOCK');}
 private ramp(current:number,target:number,increment:number,now:number,side:0|1){
  if(current*target<0){this.reverseAt[side]=now;return 0;}
  const reversed=this.reverseAt[side];if(reversed!==null){if(elapsed(now,reversed)<50)return 0;this.reverseAt[side]=null;}
  const result=current+Math.max(-increment,Math.min(increment,target-current));return Math.abs(result)<.01?0:result;
 }
}
export function motorSafetyExperiment(kind:'startup'|'stop'|'communication-loss'){
 const model=new SafeMotorModel();const samples=[model.tick(0)];const actions:Array<{timeMs:number;action:string;accepted:boolean}>=[];
 const act=(timeMs:number,action:string,accepted:boolean)=>actions.push({timeMs,action,accepted});
 act(0,'drive before arm',model.drive(10,10,1000,1,0));act(0,'arm tethered',model.arm(0));act(0,'drive 10%',model.drive(10,10,1000,1,0));
 for(let time=20;time<=500;time+=20){
  if(kind!=='communication-loss'&&time%100===0&&time<300)act(time,'heartbeat',model.heartbeat(time, time));
  if(kind==='stop'&&time===300){model.disarm();act(time,'stop and disarm',true);}
  if(time===500){model.disarm();act(time,'end experiment: disarm',true);}
  samples.push(model.tick(time));
 }
 return {schemaVersion:1,origin:'simulation',scenario:kind,units:'percent duty',limits:{maximumDuty:30,authorityTimeoutMs:400,accelerationPercentPerSecond:40},actions,samples,physicalVerification:'NOT RUN'} as const;
}
