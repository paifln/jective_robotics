import type {ArduinoCommand,ArduinoCommandRequest} from '../contracts/arduino-robot';

/** One pending write and one latest intent: queued movement cannot overtake STOP. */
export class ArduinoControl {
 private sequence=-1;
 private desired:ArduinoCommand='S';
 private revision=0;
 private written=0;
 private deadline=0;
 private expired=false;
 private disposed=false;
 private pending:Promise<void>|null=null;
 private timer:ReturnType<typeof setInterval>;
 constructor(readonly sessionId:string,private write:(command:ArduinoCommand)=>Promise<void>,private onFailure:(error:Error)=>void){
  this.timer=setInterval(()=>{
   if(this.desired==='S'||Date.now()<this.deadline)return;
   this.expired=true;
   void this.stop().catch(()=>undefined);
  },50);
  this.timer.unref?.();
 }
 async command(request:ArduinoCommandRequest){
  if(this.disposed||request.sessionId!==this.sessionId)throw new Error('ARDUINO_SESSION_CLOSED');
  if(request.sequence<=this.sequence)throw new Error('ARDUINO_COMMAND_STALE');
  this.sequence=request.sequence;
  if(this.expired&&request.command!=='S')throw new Error('ARDUINO_CONTROL_EXPIRED');
  this.deadline=Date.now()+350;
  this.desired=request.command;
  this.revision++;
  await this.flush();
  return true;
 }
 async stop(){
  this.desired='S';this.revision++;
  await this.flush();
  return true;
 }
 fault(){this.expired=true;return this.stop();}
 dispose(){this.disposed=true;this.desired='S';clearInterval(this.timer);}
 private async flush():Promise<void>{
  while(this.written!==this.revision){
   if(this.disposed)throw new Error('ARDUINO_SESSION_CLOSED');
   if(this.pending){await this.pending;continue;}
   const revision=this.revision,operation=this.write(this.desired);
   this.pending=operation;
   try{await operation;this.written=revision;}
   catch(error){
    this.expired=true;this.desired='S';
    this.onFailure(error instanceof Error?error:new Error(String(error)));
    throw error;
   }finally{if(this.pending===operation)this.pending=null;}
  }
 }
}
