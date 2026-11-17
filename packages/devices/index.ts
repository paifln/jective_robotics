import {randomUUID} from 'node:crypto';
import {SerialPort} from 'serialport';
import {StringDecoder} from 'node:string_decoder';
import type {Device,SerialEvent} from '../contracts';
import {FrameSchema} from './protocol';
import {ArduinoControl} from './arduino-control';
import {ArduinoWireless} from './arduino-wireless';
import {identifySerialPort} from './port-identity';
import {createDevicePort,type DevicePort} from './serial-port';
import {WirelessRunSchema,type WirelessRunRequest,type WirelessConnection} from '../contracts/arduino-wireless';
import {ArduinoCommandRequestSchema,type ArduinoCommandRequest,type ArduinoConnection} from '../contracts/arduino-robot';
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
 private wireless:ArduinoWireless|null=null;private wirelessReservation:symbol|null=null;
 private releaseWireless(){this.wireless?.dispose();this.wireless=null;this.wirelessReservation=null;}
 private wirelessSession(id:string){if(!this.wireless||this.wireless.sessionId!==id)throw new Error('ARDUINO_WIRELESS_CLOSED');return this.wireless;}
 async openWireless(path:string):Promise<WirelessConnection>{
  if(this.transitioning||this.port||this.robotReserved||this.wirelessReservation)throw new Error('PORT_BUSY');
  const reservation=Symbol();this.wirelessReservation=reservation;let id:string|null=null;
  try{
   await this.open(path,9600);id=this.serialConnectionId;if(!id)throw new Error('PORT_CLOSED_DURING_OPEN');
   const controller=new ArduinoWireless(id,text=>this.write(text));this.wireless=controller;
   await controller.connect();if(this.wireless!==controller)throw new Error('ARDUINO_WIRELESS_CLOSED');
   return {id,port:path,version:1};
  }catch(error){
   if(this.wirelessReservation===reservation){this.releaseWireless();if(!id||this.serialConnectionId===id)await this.close().catch(()=>undefined);}
   throw error;
  }
 }
 async runWireless(value:WirelessRunRequest){const request=WirelessRunSchema.parse(value);if(this.transitioning)throw new Error('PORT_BUSY');return this.wirelessSession(request.sessionId).run(request.program);}
 async keepaliveWireless(id:string){if(this.transitioning)throw new Error('PORT_BUSY');return this.wirelessSession(id).keepalive();}
 async stopWireless(id:string){return this.wirelessSession(id).stop();}
 async stopWirelessActive(){if(this.wireless)await this.wireless.stop();return true;}
 async closeWireless(id:string){if(!this.wireless||this.wireless.sessionId!==id)return false;return this.close();}
 private robot:ArduinoControl|null=null;private robotReserved=false;private serialConnectionId:string|null=null;
 private releaseRobot(){this.robot?.dispose();this.robot=null;this.robotReserved=false;}
 async openRobot(path:string):Promise<ArduinoConnection>{
  if(this.transitioning||this.port||this.robotReserved||this.wirelessReservation)throw new Error('PORT_BUSY');
  this.robotReserved=true;
  try{
   await this.open(path,9600);
   const id=this.serialConnectionId;if(!id)throw new Error('PORT_CLOSED_DURING_OPEN');
   this.robot=new ArduinoControl(id,command=>this.write(command),error=>{
    this.emit({timestamp:new Date().toISOString(),kind:'error',text:'ARDUINO_WRITE_FAILED: '+error.message});
   });
   await this.robot.stop();
   return {id,port:path};
  }catch(error){this.releaseRobot();await this.close().catch(()=>undefined);throw error;}
 }
 async commandRobot(value:ArduinoCommandRequest){
  const request=ArduinoCommandRequestSchema.parse(value);
  if(this.transitioning)throw new Error('PORT_BUSY');
  if(!this.robot)throw new Error('ARDUINO_SESSION_CLOSED');
  return this.robot.command(request);
 }
 async stopRobot(){return this.robot?this.robot.stop():true;}
 async closeRobot(sessionId:string){
  if(!this.robot||this.robot.sessionId!==sessionId)return false;
  return this.close();
 }
 private droppedQueued=0;private transitioning=false;private port:DevicePort|null=null;private parser=new ProtocolParser();private decoder=new StringDecoder('utf8');private listeners=new Set<(event:SerialEvent)=>void>();private queue:SerialEvent[]=[];private timer:ReturnType<typeof setInterval>|null=null;
 async list():Promise<Device[]>{return Promise.all((await SerialPort.list()).map(async p=>({path:p.path,...(p.manufacturer?{manufacturer:p.manufacturer}:{}),...(p.serialNumber?{serialNumber:p.serialNumber}:{}),...(p.vendorId?{vendorId:p.vendorId}:{}),...(p.productId?{productId:p.productId}:{}),...await identifySerialPort(p)})));}
 subscribe(listener:(event:SerialEvent)=>void){this.listeners.add(listener);return ()=>this.listeners.delete(listener);}
 private emit(event:SerialEvent){this.queue.push(event);if(this.queue.length>2000){const count=this.queue.length-2000;this.queue.splice(0,count);this.droppedQueued+=count;}}
 private reportDrops(){if(!this.droppedQueued)return;const count=this.droppedQueued;this.droppedQueued=0;const event:SerialEvent={timestamp:new Date().toISOString(),kind:'error',text:`SERIAL_QUEUE_LIMIT: ${count} oldest queued events discarded`};for(const listener of this.listeners)listener(event);}
 private startPump(){if(this.timer)return;this.timer=setInterval(()=>{this.reportDrops();const events=this.queue.splice(0,200);for(const event of events)for(const listener of this.listeners)listener(event);},50);}
 async open(path:string,baudRate:number){if(this.transitioning||this.port)throw new Error('PORT_BUSY: close serial before opening another device');if(![9600,19200,38400,57600,115200,230400].includes(baudRate))throw new Error('BAUD_UNSUPPORTED');this.transitioning=true;try{const device=(await this.list()).find(p=>p.path===path);if(!device)throw new Error('PORT_NOT_FOUND');const port=createDevicePort(device,baudRate);const connection={id:randomUUID(),port:path,baud:baudRate as 9600|19200|38400|57600|115200|230400};this.port=port;this.serialConnectionId=connection.id;this.parser.reset();this.decoder=new StringDecoder('utf8');port.on('data',(chunk:Buffer)=>{if(this.port!==port)return;for(const event of this.parser.feed(this.decoder.write(chunk))){if(event.kind==='raw')this.wireless?.feed(event.text);this.emit({...event,connection});}});port.on('error',e=>{if(this.port!==port)return;if(this.robot)void this.robot.fault().catch(()=>undefined);if(this.wireless)void this.wireless.fault().catch(()=>undefined);this.emit({timestamp:new Date().toISOString(),kind:'error',text:e.message,connection});});port.on('close',()=>{if(this.port!==port)return;this.releaseRobot();this.releaseWireless();if(this.timer){clearInterval(this.timer);this.timer=null;}this.parser.reset();this.emit({timestamp:new Date().toISOString(),kind:'status',text:'Serial disconnected; motion authority is not restored automatically',connection});this.port=null;this.serialConnectionId=null;this.reportDrops();for(const event of this.queue.splice(0))for(const listener of this.listeners)listener(event);});try{await new Promise<void>((resolve,reject)=>port.open(e=>e?reject(e):resolve()));if(this.port!==port||!port.isOpen)throw new Error('PORT_CLOSED_DURING_OPEN');}catch(e){this.reportDrops();this.port=null;this.serialConnectionId=null;this.queue=[];this.parser.reset();throw e;}this.startPump();return true;}finally{this.transitioning=false;}}
 async close(){if(this.transitioning)throw new Error('PORT_BUSY: serial state transition in progress');this.transitioning=true;try{const p=this.port;if(this.wireless){try{await this.wireless.stop();}catch{/* Close even if STOP cannot be written. */}finally{this.releaseWireless();}if(p?.isOpen)await this.drainBeforeClose(p);}if(this.robot){try{await this.robot.stop();}catch{/* Closing must still release a failed transport. */}finally{this.releaseRobot();}if(p?.isOpen)await this.drainBeforeClose(p);}if(this.timer){clearInterval(this.timer);this.timer=null;}this.reportDrops();this.queue=[];this.parser.reset();if(p?.isOpen)await new Promise<void>((resolve,reject)=>p.close(e=>e?reject(e):resolve()));if(this.port===p){this.port=null;this.serialConnectionId=null;}return true;}catch(error){if(this.port?.isOpen)this.startPump();throw error;}finally{this.transitioning=false;}}
 async send(text:string){if(text.length>4096||text.split(/[\r\n]/).some(line=>/^(?:@JECTIVE|!jr1|\?jr1)/.test(line.trimStart())))throw new Error('SERIAL_COMMAND_DENIED: protocol actuation is not a raw-monitor feature');if(this.transitioning)throw new Error('PORT_BUSY: serial state transition in progress');if(this.robotReserved||this.wirelessReservation)throw new Error('ARDUINO_PORT_OWNED');await this.write(text);return true;}
 private async drainBeforeClose(port:DevicePort){await new Promise<void>(resolve=>{const timeout=setTimeout(resolve,300);const finish=()=>{clearTimeout(timeout);resolve();};try{port.drain(finish);}catch{finish();}});}
 private async write(text:string){const port=this.port;if(!port?.isOpen)throw new Error('PORT_CLOSED');await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('SERIAL_WRITE_TIMEOUT')),300);try{port.write(text,error=>{clearTimeout(timeout);if(error)reject(error);else resolve();});}catch(error){clearTimeout(timeout);reject(error);}});}
}
