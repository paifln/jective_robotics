import {randomBytes} from 'node:crypto';
import {WirelessProgramSchema,wirelessProgramChecksum,type WirelessProgram,type WirelessState} from '../contracts/arduino-wireless';

type ReplyWaiter={expected:string;resolve:()=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>;received?:()=>void};
const failure=(code:string)=>new Error(code);

/** Stop-and-wait transport: a cancelled transfer can never reach the RUN frame. */
export class ArduinoWireless {
 private state:WirelessState={status:'ready',sent:0,total:0};
 private waiter:ReplyWaiter|null=null;
 private stopReply:{transaction:string|null;resolve:(received:boolean)=>void;timer:ReturnType<typeof setTimeout>}|null=null;
 private stopping:Promise<void>|null=null;
 private generation=0;
 private disposed=false;
 private faulted=false;
 private connected=false;
 private operation=false;
 private transaction='00000000';
 private lease=0;
 private lastPing=0;
 private pingPending=false;
 private timer:ReturnType<typeof setInterval>;
 constructor(readonly sessionId:string,private readonly write:(text:string)=>Promise<void>){
  this.timer=setInterval(()=>this.tick(),50);this.timer.unref?.();
 }
 private check(generation=this.generation){if(this.disposed)throw failure('ARDUINO_WIRELESS_CLOSED');if(generation!==this.generation)throw failure('ARDUINO_WIRELESS_CANCELLED');}
 private cancelReply(code:string){const waiter=this.waiter;if(!waiter)return;this.waiter=null;clearTimeout(waiter.timer);waiter.reject(failure(code));}
 /** SoftwareSerial cannot receive the next frame while transmitting its STOP reply. */
 private sendStop(allowMissingReply=false):Promise<void>{
  if(this.stopping)return this.stopping;
  const acknowledgement=new Promise<boolean>(resolve=>{
   const timer=setTimeout(()=>{if(this.stopReply?.timer!==timer)return;this.stopReply=null;resolve(false);},500);
   this.stopReply={transaction:this.connected?this.transaction:null,resolve,timer};
  });
  const pending=(async()=>{
   const [,received]=await Promise.all([this.write('S'),acknowledgement]);
   if(!received&&!allowMissingReply&&!this.disposed){this.faulted=true;this.state={...this.state,status:'error',error:'ARDUINO_WIRELESS_STOP_UNCONFIRMED'};throw failure('ARDUINO_WIRELESS_STOP_UNCONFIRMED');}
  })();
  this.stopping=pending;
  void pending.finally(()=>{if(this.stopping===pending)this.stopping=null;const reply=this.stopReply;if(reply){this.stopReply=null;clearTimeout(reply.timer);reply.resolve(false);}}).catch(()=>undefined);
  return pending;
 }
 private async exchange(frame:string,expected:string,generation:number,received?:()=>void){
  this.check(generation);if(this.waiter)throw failure('ARDUINO_WIRELESS_BUSY');
  const reply=new Promise<void>((resolve,reject)=>{
   const timer=setTimeout(()=>{if(this.waiter?.timer!==timer)return;this.waiter=null;reject(failure('ARDUINO_WIRELESS_REPLY_TIMEOUT'));},1000);
   this.waiter={expected,resolve,reject,timer,received};
  });
  try{await Promise.all([reply,this.write(frame)]);this.check(generation);}
  catch(error){this.cancelReply('ARDUINO_WIRELESS_CANCELLED');throw error;}
 }
 async connect(){
  const generation=this.generation;await this.sendStop(true);this.check(generation);
  for(let attempt=0;attempt<3;attempt++){
   const nonce=randomBytes(4).toString('hex');
   try{await this.exchange(`?jr1 ${nonce}\n`,`!jr1 hello ${nonce} 1`,generation);this.connected=true;this.lease=Date.now()+1000;return;}
   catch(error){this.check(generation);if((error as Error).message!=='ARDUINO_WIRELESS_REPLY_TIMEOUT')throw error;}
  }
  throw failure('ARDUINO_WIRELESS_FIRMWARE_REQUIRED');
 }
 snapshot():WirelessState{return {...this.state};}
 keepalive(){this.check();this.lease=Date.now()+1000;return this.snapshot();}
 async run(value:WirelessProgram){
  const program=WirelessProgramSchema.parse(value);this.check();
  if(!this.connected||this.faulted)throw failure('ARDUINO_WIRELESS_RECONNECT_REQUIRED');
  if(this.operation)throw failure('ARDUINO_WIRELESS_BUSY');
  this.operation=true;const generation=++this.generation;
  this.cancelReply('ARDUINO_WIRELESS_CANCELLED');
  try{
   if(this.stopping)await this.stopping;this.check(generation);
   if(this.faulted)throw failure('ARDUINO_WIRELESS_RECONNECT_REQUIRED');
   this.transaction=randomBytes(4).toString('hex');const tx=this.transaction;
   this.lease=Date.now()+1000;this.state={status:'uploading',sent:0,total:program.steps.length};
   // BEGIN itself stops and invalidates the old program. A preceding unacknowledged
   // raw S would make its SoftwareSerial reply overlap and corrupt this frame.
   await this.exchange(`!jr1 begin ${tx} ${program.steps.length} ${program.loopStart}\n`,`!jr1 ack ${tx} begin`,generation);
   for(let index=0;index<program.steps.length;index++){
    const step=program.steps[index]!;this.check(generation);
    await this.exchange(`!jr1 step ${tx} ${index} ${step.op} ${step.a} ${step.b}\n`,`!jr1 ack ${tx} ${index}`,generation);
    this.state={...this.state,sent:index+1};
   }
   await this.exchange(`!jr1 commit ${tx} ${wirelessProgramChecksum(program)}\n`,`!jr1 ready ${tx}`,generation);
   await this.exchange(`!jr1 run ${tx}\n`,`!jr1 running ${tx}`,generation,()=>{this.state={...this.state,status:'running'};this.lastPing=Date.now();});
   return this.snapshot();
  }catch(error){
   if(!this.disposed&&generation===this.generation){
    const code=error instanceof Error?error.message:'ARDUINO_WIRELESS_TRANSFER_FAILED';this.generation++;this.cancelReply(code);this.state={...this.state,status:'error',error:code};
    if(!this.faulted)await this.sendStop().catch(()=>undefined);
   }
   throw error;
  }finally{this.operation=false;}
 }
 async stop(){
  this.check();this.generation++;this.cancelReply('ARDUINO_WIRELESS_CANCELLED');
  this.state={status:'stopped',sent:this.state.sent,total:this.state.total};
  await this.sendStop();return this.snapshot();
 }
 async fault(code='ARDUINO_WIRELESS_TRANSPORT_FAILED'){
  if(this.disposed||this.faulted)return;this.faulted=true;this.generation++;this.cancelReply(code);this.state={...this.state,status:'error',error:code};
  await this.sendStop().catch(()=>undefined);
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.generation++;this.cancelReply('ARDUINO_WIRELESS_CLOSED');const reply=this.stopReply;if(reply){this.stopReply=null;clearTimeout(reply.timer);reply.resolve(false);}clearInterval(this.timer);}
 /** Called synchronously for complete serial lines, before the UI event pump. */
 feed(line:string){
  if(this.disposed||line.length>96)return;
  if(/^!jr1 stopped [a-f0-9]{8}$/.test(line)&&this.stopReply&&(this.stopReply.transaction===null||line===`!jr1 stopped ${this.stopReply.transaction}`)){const reply=this.stopReply;this.stopReply=null;clearTimeout(reply.timer);reply.resolve(true);}
  if(this.waiter?.expected===line){const waiter=this.waiter;this.waiter=null;clearTimeout(waiter.timer);waiter.received?.();waiter.resolve();return;}
  if(line===`!jr1 done ${this.transaction}`&&this.state.status==='running'){this.state={...this.state,status:'completed'};return;}
  if(line===`!jr1 stopped ${this.transaction}`&&['running','uploading'].includes(this.state.status)){
   this.generation++;this.cancelReply('ARDUINO_WIRELESS_STOPPED');this.state={status:'stopped',sent:this.state.sent,total:this.state.total};return;
  }
  const match=/^!jr1 error ([a-f0-9]{8}) ([a-z_]{1,40})$/.exec(line);
  if(match?.[1]===this.transaction&&['running','uploading'].includes(this.state.status)){
   const code='ARDUINO_WIRELESS_'+match[2]!.toUpperCase();this.generation++;this.cancelReply(code);this.state={...this.state,status:'error',error:code};void this.sendStop().catch(()=>undefined);
  }
 }
 private tick(){
  if(this.disposed||!['running','uploading'].includes(this.state.status))return;
  if(Date.now()>=this.lease){
   const code='ARDUINO_WIRELESS_LEASE_EXPIRED';this.generation++;this.cancelReply(code);this.state={...this.state,status:'error',error:code};void this.sendStop().catch(()=>undefined);return;
  }
  if(this.state.status!=='running'||this.pingPending||Date.now()-this.lastPing<200)return;
  this.lastPing=Date.now();this.pingPending=true;
  void this.write(`!jr1 ping ${this.transaction}\n`).catch(()=>this.fault()).finally(()=>{this.pingPending=false;});
 }
}
