import {afterEach,expect,it,vi} from 'vitest';
const fixture=vi.hoisted(()=>({writes:[] as string[],respond:true,holdSteps:false,closeCalls:0,options:[] as unknown[],ports:[] as {isOpen:boolean;emit:(event:string,...args:unknown[])=>boolean}[]}));
vi.mock('serialport',async()=>{
 const {EventEmitter}=await import('node:events');
 class FakePort extends EventEmitter{
  isOpen=false;transaction='00000000';
  constructor(options:unknown){super();fixture.options.push(options);fixture.ports.push(this);}
  static async list(){return [{path:'WIRELESS_FIXTURE'}];}
  open(callback:()=>void){this.isOpen=true;callback();}
  close(callback:()=>void){fixture.closeCalls++;this.isOpen=false;this.emit('close');callback();}
  drain(callback:()=>void){callback();}
  write(frame:string,callback:()=>void){
   fixture.writes.push(frame);callback();if(!fixture.respond)return;
   const parts=frame.trim().split(' ');let reply='';
   if(frame==='S')reply=`!jr1 stopped ${this.transaction}`;
   if(parts[0]==='?jr1')reply=`!jr1 hello ${parts[1]} 1`;
   if(parts[1]==='begin'){this.transaction=parts[2]!;reply=`!jr1 ack ${this.transaction} begin`;}
   if(parts[1]==='step'&&!fixture.holdSteps)reply=`!jr1 ack ${this.transaction} ${parts[3]}`;
   if(parts[1]==='commit')reply=`!jr1 ready ${this.transaction}`;
   if(parts[1]==='run')reply=`!jr1 running ${this.transaction}`;
   if(reply)queueMicrotask(()=>{this.emit('data',Buffer.from(reply.slice(0,7)));this.emit('data',Buffer.from(reply.slice(7)+'\r\n'));});
  }
 }
 return {SerialPort:FakePort};
});
import {DeviceService} from '../packages/devices';
import type {WirelessProgram} from '../packages/contracts/arduino-wireless';
const program:WirelessProgram={version:1,steps:[{op:'m',a:100,b:100},{op:'w',a:250,b:0},{op:'s',a:0,b:0}],loopStart:-1};
afterEach(()=>{fixture.writes=[];fixture.respond=true;fixture.holdSteps=false;fixture.closeCalls=0;fixture.options=[];fixture.ports=[];vi.useRealTimers();});

it('accepts fragmented runtime replies immediately and exclusively owns the selected 9600 port',async()=>{
 const service=new DeviceService(),connection=await service.openWireless('WIRELESS_FIXTURE');
 try{
  expect(connection.version).toBe(1);expect(fixture.options).toEqual([{path:'WIRELESS_FIXTURE',baudRate:9600,autoOpen:false}]);
  await expect(service.openRobot('WIRELESS_FIXTURE')).rejects.toThrow('PORT_BUSY');await expect(service.send('F')).rejects.toThrow('ARDUINO_PORT_OWNED');
  const state=await service.runWireless({sessionId:connection.id,program});expect(state).toEqual({status:'running',sent:3,total:3});
  const tx=fixture.writes.find(frame=>frame.startsWith('!jr1 begin '))!.split(' ')[2];fixture.ports[0]!.emit('data',Buffer.from(`!jr1 done ${tx}\n`));expect((await service.keepaliveWireless(connection.id)).status).toBe('completed');
 }finally{await service.close();}
 expect(fixture.writes.at(-1)).toBe('S');expect(fixture.ports[0]!.isOpen).toBe(false);
});

it('closes a legacy firmware connection after safe handshake probes and releases ownership',async()=>{
 vi.useFakeTimers();fixture.respond=false;const service=new DeviceService();
 const opening=service.openWireless('WIRELESS_FIXTURE');const rejected=expect(opening).rejects.toThrow('ARDUINO_WIRELESS_FIRMWARE_REQUIRED');await vi.advanceTimersByTimeAsync(3500);await rejected;
 expect(fixture.closeCalls).toBe(1);expect(fixture.writes.filter(frame=>frame!=='S').every(frame=>/^\?jr1 [a-f0-9]{8}\n$/.test(frame))).toBe(true);
 await service.open('WIRELESS_FIXTURE',9600);await service.send('monitor');await service.close();
});

it('close interrupts an unacknowledged upload and stale sessions cannot close a later connection',async()=>{
 vi.useFakeTimers();const service=new DeviceService(),first=await service.openWireless('WIRELESS_FIXTURE');fixture.holdSteps=true;
 const result=service.runWireless({sessionId:first.id,program});const rejected=expect(result).rejects.toThrow('ARDUINO_WIRELESS_CANCELLED');await vi.advanceTimersByTimeAsync(0);
 await service.closeWireless(first.id);await rejected;expect(fixture.writes.some(frame=>frame.startsWith('!jr1 run '))).toBe(false);
 fixture.holdSteps=false;const second=await service.openWireless('WIRELESS_FIXTURE');
 try{expect(await service.closeWireless(first.id)).toBe(false);await expect(service.keepaliveWireless(first.id)).rejects.toThrow('ARDUINO_WIRELESS_CLOSED');expect((await service.keepaliveWireless(second.id)).status).toBe('ready');}finally{await service.close();}
});

it('disconnect and serial errors revoke wireless execution without restarting on another port',async()=>{
 const service=new DeviceService(),first=await service.openWireless('WIRELESS_FIXTURE');await service.runWireless({sessionId:first.id,program});
 fixture.ports[0]!.isOpen=false;fixture.ports[0]!.emit('close');await expect(service.keepaliveWireless(first.id)).rejects.toThrow('ARDUINO_WIRELESS_CLOSED');
 const second=await service.openWireless('WIRELESS_FIXTURE');
 try{
  await service.runWireless({sessionId:second.id,program});fixture.ports[1]!.emit('error',new Error('Synthetic serial failure'));
  expect((await service.keepaliveWireless(second.id)).status).toBe('error');await expect(service.runWireless({sessionId:second.id,program})).rejects.toThrow('RECONNECT_REQUIRED');expect(fixture.writes.at(-1)).toBe('S');
 }finally{await service.close();}
});

it('raw monitor cannot bypass the runtime handshake and program lifecycle',async()=>{
 const service=new DeviceService();for(const text of ['!jr1 run deadbeef\n',' ?jr1 deadbeef\n','plain text\n\t!jr1 step deadbeef 0 m 255 255\n'])await expect(service.send(text)).rejects.toThrow('SERIAL_COMMAND_DENIED');expect(fixture.ports).toHaveLength(0);
});
