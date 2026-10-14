import {randomUUID} from 'node:crypto';
import {SerialPort} from 'serialport';
import {StringDecoder} from 'node:string_decoder';
import type {Device,SerialEvent} from '../contracts';
import {FrameSchema} from './protocol';
export {FrameSchema} from './protocol';
export class ProtocolParser {
 private buffer='';private dropping=false;
 private line(text:string):SerialEvent{
  const timestamp=new Date().toISOString();const line=text.replace(/\r$/,'');
  if(!line.startsWith('@JECTIVE '))return {timestamp,kind:'raw',text:line};
  try{const parsed=FrameSchema.parse(JSON.parse(line.slice(9)));return {timestamp,kind:'protocol',text:JSON.stringify(parsed)};}
  catch{return {timestamp,kind:'error',text:'PROTOCOL_INVALID: '+line.slice(0,256)};}
 }
 feed(chunk:string):SerialEvent[]{
  const result:SerialEvent[]=[];let cursor=0,overflow=false;
  const push=(event:SerialEvent)=>{if(result.length<2000)result.push(event);else overflow=true;};
  while(cursor<chunk.length){
   const newline=chunk.indexOf('\n',cursor);const end=newline<0?chunk.length:newline;const length=end-cursor;
   if(this.dropping){if(newline>=0)this.dropping=false;}
   else if(this.buffer.length+length>4096&&!(this.buffer.length+length===4097&&(length?chunk[end-1]==='\r':this.buffer.endsWith('\r')))){this.buffer='';this.dropping=newline<0;push({timestamp:new Date().toISOString(),kind:'error',text:'SERIAL_FRAME_TOO_LARGE'});}
   else{this.buffer+=chunk.slice(cursor,end);if(newline>=0){push(this.line(this.buffer));this.buffer='';}}
   cursor=newline<0?chunk.length:newline+1;
  }
  if(overflow)result[1999]={timestamp:new Date().toISOString(),kind:'error',text:'SERIAL_EVENT_BATCH_LIMIT: excess events discarded'};
  return result;
 }
 reset(){this.buffer='';this.dropping=false;}
}
export class DeviceService {
 private droppedQueued=0;private transitioning=false;private port:SerialPort|null=null;private parser=new ProtocolParser();private decoder=new StringDecoder('utf8');private listeners=new Set<(event:SerialEvent)=>void>();private queue:SerialEvent[]=[];private timer:ReturnType<typeof setInterval>|null=null;
 async list():Promise<Device[]>{return (await SerialPort.list()).map(p=>({path:p.path,...(p.manufacturer?{manufacturer:p.manufacturer}:{}),...(p.serialNumber?{serialNumber:p.serialNumber}:{}),...(p.vendorId?{vendorId:p.vendorId}:{}),...(p.productId?{productId:p.productId}:{})}));}
 subscribe(listener:(event:SerialEvent)=>void){this.listeners.add(listener);return ()=>this.listeners.delete(listener);}
 private emit(event:SerialEvent){this.queue.push(event);if(this.queue.length>2000){const count=this.queue.length-2000;this.queue.splice(0,count);this.droppedQueued+=count;}}
 private reportDrops(){if(!this.droppedQueued)return;const count=this.droppedQueued;this.droppedQueued=0;const event:SerialEvent={timestamp:new Date().toISOString(),kind:'error',text:`SERIAL_QUEUE_LIMIT: ${count} oldest queued events discarded`};for(const listener of this.listeners)listener(event);}
 private startPump(){if(this.timer)return;this.timer=setInterval(()=>{this.reportDrops();const events=this.queue.splice(0,200);for(const event of events)for(const listener of this.listeners)listener(event);},50);}
 async open(path:string,baudRate:number){if(this.transitioning||this.port)throw new Error('PORT_BUSY: close serial before opening another device');if(![9600,19200,38400,57600,115200,230400].includes(baudRate))throw new Error('BAUD_UNSUPPORTED');this.transitioning=true;try{if(!(await this.list()).some(p=>p.path===path))throw new Error('PORT_NOT_FOUND');const port=new SerialPort({path,baudRate,autoOpen:false});const connection={id:randomUUID(),port:path,baud:baudRate as 9600|19200|38400|57600|115200|230400};this.port=port;this.parser.reset();this.decoder=new StringDecoder('utf8');port.on('data',(chunk:Buffer)=>{if(this.port!==port)return;for(const event of this.parser.feed(this.decoder.write(chunk)))this.emit({...event,connection});});port.on('error',e=>{if(this.port===port)this.emit({timestamp:new Date().toISOString(),kind:'error',text:e.message,connection});});port.on('close',()=>{if(this.port!==port)return;if(this.timer){clearInterval(this.timer);this.timer=null;}this.parser.reset();this.emit({timestamp:new Date().toISOString(),kind:'status',text:'Serial disconnected; motion authority is not restored automatically',connection});this.port=null;this.reportDrops();for(const event of this.queue.splice(0))for(const listener of this.listeners)listener(event);});try{await new Promise<void>((resolve,reject)=>port.open(e=>e?reject(e):resolve()));if(this.port!==port||!port.isOpen)throw new Error('PORT_CLOSED_DURING_OPEN');}catch(e){this.reportDrops();this.port=null;this.queue=[];this.parser.reset();throw e;}this.startPump();return true;}finally{this.transitioning=false;}}
 async close(){if(this.transitioning)throw new Error('PORT_BUSY: serial state transition in progress');this.transitioning=true;try{const p=this.port;if(this.timer){clearInterval(this.timer);this.timer=null;}this.reportDrops();this.queue=[];this.parser.reset();if(p?.isOpen)await new Promise<void>((resolve,reject)=>p.close(e=>e?reject(e):resolve()));if(this.port===p)this.port=null;return true;}catch(error){if(this.port?.isOpen)this.startPump();throw error;}finally{this.transitioning=false;}}
 async send(text:string){if(text.length>4096||text.split(/[\r\n]/).some(line=>line.trimStart().startsWith('@JECTIVE')))throw new Error('SERIAL_COMMAND_DENIED: protocol actuation is not a raw-monitor feature');if(this.transitioning)throw new Error('PORT_BUSY: serial state transition in progress');const port=this.port;if(!port?.isOpen)throw new Error('PORT_CLOSED');await new Promise<void>((resolve,reject)=>port.write(text,e=>e?reject(e):resolve()));return true;}
}
