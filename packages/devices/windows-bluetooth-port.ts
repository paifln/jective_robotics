import {spawn,type ChildProcessWithoutNullStreams} from 'node:child_process';
import {EventEmitter} from 'node:events';
import {win32} from 'node:path';
import {windowsBluetoothBridgeCommand} from './windows-bluetooth-bridge';

type Callback=(error?:Error|null)=>void;
type Pending={kind:'w'|'d'|'c';callback:Callback;timer:ReturnType<typeof setTimeout>};
const failure=(code:string)=>new Error(code);

/** Uses .NET for Windows Bluetooth COM ports whose native overlapped writes stall. */
export class WindowsBluetoothPort extends EventEmitter {
 private state:'idle'|'opening'|'open'|'closing'|'closed'='idle';
 private child:ChildProcessWithoutNullStreams|null=null;
 private opening:Callback|null=null;
 private openTimer:ReturnType<typeof setTimeout>|null=null;
 private pending=new Map<number,Pending>();
 private closingCallbacks:Callback[]=[];
 private nextId=0;
 private output='';
 private stderr='';
 private readonly command:string;
 constructor(options:{path:string;baudRate:number}){
  super();this.command=windowsBluetoothBridgeCommand(options.path,options.baudRate);
 }
 get isOpen(){return this.state==='open';}
 open(callback:Callback){
  if(this.state!=='idle'){queueMicrotask(()=>callback(failure('PORT_BUSY')));return;}
  this.state='opening';this.opening=callback;
  this.openTimer=setTimeout(()=>this.fail(failure('BLUETOOTH_OPEN_TIMEOUT')),15000);
  try{
   const executable=win32.join(process.env.SystemRoot??'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
   const child=spawn(executable,['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',this.command],{windowsHide:true,shell:false,stdio:['pipe','pipe','pipe']});
   this.child=child;
   child.stdout.on('data',(chunk:Buffer)=>{if(this.child===child)this.receive(chunk);});
   child.stderr.on('data',(chunk:Buffer)=>{if(this.child===child)this.stderr=(this.stderr+chunk.toString('utf8')).slice(-2048);});
   child.once('error',()=>{if(this.child===child)this.fail(failure('BLUETOOTH_HELPER_FAILED'));});
   child.once('close',()=>{if(this.child===child)this.fail(failure('BLUETOOTH_HELPER_EXIT'+(this.stderr?': '+this.stderr.trim():'')));});
   child.stdin.on('error',()=>{if(this.child===child)this.fail(failure('BLUETOOTH_HELPER_PIPE_FAILED'));});
   child.stdout.on('error',()=>{if(this.child===child)this.fail(failure('BLUETOOTH_HELPER_PIPE_FAILED'));});
   child.stderr.on('error',()=>{if(this.child===child)this.fail(failure('BLUETOOTH_HELPER_PIPE_FAILED'));});
  }catch{this.fail(failure('BLUETOOTH_HELPER_FAILED'));}
 }
 write(text:string,callback:Callback){
  const bytes=Buffer.from(text,'utf8');
  if(bytes.length>4096){queueMicrotask(()=>callback(failure('SERIAL_FRAME_TOO_LARGE')));return;}
  this.request('w',bytes.toString('base64'),callback);
 }
 drain(callback:Callback){this.request('d','',callback);}
 close(callback:Callback){
  if(this.state==='idle'||this.state==='closed'){queueMicrotask(()=>callback(null));return;}
  if(this.state==='closing'){this.closingCallbacks.push(callback);return;}
  if(this.state!=='open'){this.fail(failure('PORT_CLOSED'));queueMicrotask(()=>callback(null));return;}
  // The helper prioritizes close over queued commands and writes STOP before exit.
  this.state='closing';this.closingCallbacks.push(callback);
  for(const [id,call] of this.pending){clearTimeout(call.timer);this.pending.delete(id);call.callback(failure('PORT_CLOSED'));}
  this.request('c','',error=>{for(const complete of this.closingCallbacks.splice(0))complete(error);});
 }
 private request(kind:Pending['kind'],payload:string,callback:Callback){
  if(!this.child||!(this.state==='open'||kind==='c'&&this.state==='closing')){queueMicrotask(()=>callback(failure('PORT_CLOSED')));return;}
  if(this.pending.size>=32){this.fail(failure('BLUETOOTH_QUEUE_FULL'));queueMicrotask(()=>callback(failure('BLUETOOTH_QUEUE_FULL')));return;}
  const id=++this.nextId;
  const timer=setTimeout(()=>this.fail(failure(kind==='w'?'SERIAL_WRITE_TIMEOUT':'BLUETOOTH_HELPER_TIMEOUT')),kind==='c'?1000:280);
  this.pending.set(id,{kind,callback,timer});
  try{this.child.stdin.write(`${kind} ${id}${kind==='w'?' '+payload:''}\n`,'ascii',error=>{if(error&&this.pending.has(id))this.fail(failure('BLUETOOTH_HELPER_PIPE_FAILED'));});}
  catch{this.fail(failure('BLUETOOTH_HELPER_PIPE_FAILED'));}
 }
 private receive(chunk:Buffer){
  this.output+=chunk.toString('ascii');
  let newline:number;
  while((newline=this.output.indexOf('\n'))>=0){
   const line=this.output.slice(0,newline).replace(/\r$/,'');this.output=this.output.slice(newline+1);
   if(line.length>8192){this.fail(failure('BLUETOOTH_PROTOCOL_ERROR'));return;}
   this.line(line);if(this.state==='closed')return;
  }
  if(this.output.length>8192)this.fail(failure('BLUETOOTH_PROTOCOL_ERROR'));
 }
 private decode(text:string,maximum:number){
  if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text))throw failure('BLUETOOTH_PROTOCOL_ERROR');
  const bytes=Buffer.from(text,'base64');if(bytes.length>maximum||bytes.toString('base64')!==text)throw failure('BLUETOOTH_PROTOCOL_ERROR');return bytes;
 }
 private line(line:string){
  try{
   if(line==='ready'&&this.state==='opening'){
    this.state='open';if(this.openTimer){clearTimeout(this.openTimer);this.openTimer=null;}
    const callback=this.opening;this.opening=null;callback?.(null);this.emit('open');return;
   }
   const fields=line.split(' ');
   if(fields[0]==='data'&&fields.length===2&&['open','closing'].includes(this.state)){
    const bytes=this.decode(fields[1]!,1024);if(bytes.length&&this.state==='open')this.emit('data',bytes);return;
   }
   if(fields[0]==='error'&&fields.length===3&&/^[0-9]{1,10}$/.test(fields[1]!)){
    this.fail(failure(this.decode(fields[2]!,1024).toString('utf8')||'BLUETOOTH_IO_FAILED'));return;
   }
   if((fields[0]==='ack'||fields[0]==='closed')&&fields.length===2&&/^[1-9][0-9]{0,9}$/.test(fields[1]!)){
    const id=Number(fields[1]),call=this.pending.get(id);
    // A command already cancelled by close cannot restore the old connection.
    if(!call&&this.state==='closing'&&fields[0]==='ack')return;
    if(!call||(fields[0]==='closed')!==(call.kind==='c'))throw failure('BLUETOOTH_PROTOCOL_ERROR');
    this.pending.delete(id);clearTimeout(call.timer);
    if(call.kind==='c'){this.finish();call.callback(null);return;}
    call.callback(null);return;
   }
   throw failure('BLUETOOTH_PROTOCOL_ERROR');
  }catch(error){this.fail(error instanceof Error?error:failure('BLUETOOTH_PROTOCOL_ERROR'));}
 }
 private finish(error?:Error){
  if(this.state==='closed')return;
  const wasOpening=this.state==='opening',child=this.child;this.child=null;this.state='closed';this.output='';
  if(this.openTimer){clearTimeout(this.openTimer);this.openTimer=null;}
  const opening=this.opening;this.opening=null;
  const pending=[...this.pending.values()];this.pending.clear();for(const call of pending)clearTimeout(call.timer);
  // Killing a failed helper cancels queued writes; stdin EOF alone also makes the
  // helper send STOP when the desktop process itself disappears.
  if(child){try{child.stdin.end();}catch{/* Already closed. */}try{child.kill();}catch{/* Already exited. */}}
  opening?.(error??failure('PORT_CLOSED'));
  for(const call of pending)call.callback(error??failure('PORT_CLOSED'));
  if(error&&!wasOpening&&this.listenerCount('error'))this.emit('error',error);
  this.emit('close');
 }
 private fail(error:Error){this.finish(error);}
}
