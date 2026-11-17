import {afterEach,expect,it,vi} from 'vitest';
const fixture=vi.hoisted(()=>({writes:[] as string[],writeError:null as Error|null,ports:[] as {isOpen:boolean;emit:(name:string,...args:unknown[])=>boolean}[],options:[] as unknown[],drainPending:false,drainCallback:null as ((error?:Error)=>void)|null,closeCalls:0}));
vi.mock('serialport',async()=>{
 const {EventEmitter}=await import('node:events');
 class FakePort extends EventEmitter{
  isOpen=false;
  constructor(options:unknown){super();fixture.ports.push(this);fixture.options.push(options);}
  static async list(){return [{path:'HC05_FIXTURE'}];}
  open(callback:()=>void){this.isOpen=true;callback();}
  close(callback:()=>void){fixture.closeCalls++;this.isOpen=false;this.emit('close');callback();}
  drain(callback:(error?:Error)=>void){if(fixture.drainPending)fixture.drainCallback=callback;else callback();}
  write(text:string,callback:(error?:Error)=>void){fixture.writes.push(text);callback(fixture.writeError??undefined);}
 }
 return {SerialPort:FakePort};
});
import {DeviceService} from '../packages/devices';
afterEach(()=>{fixture.writes=[];fixture.options=[];fixture.ports=[];fixture.writeError=null;fixture.drainPending=false;fixture.drainCallback=null;fixture.closeCalls=0;vi.useRealTimers();});
it('claims the selected enumerated port at 9600 and blocks raw monitor writes',async()=>{
 const service=new DeviceService();const connection=await service.openRobot('HC05_FIXTURE');
 try{
  expect(connection.port).toBe('HC05_FIXTURE');expect(fixture.options).toEqual([{path:'HC05_FIXTURE',baudRate:9600,autoOpen:false}]);expect(fixture.writes).toEqual(['S']);
  await expect(service.open('HC05_FIXTURE',115200)).rejects.toThrow('PORT_BUSY');await expect(service.send('F')).rejects.toThrow('ARDUINO_PORT_OWNED');
  await service.commandRobot({sessionId:connection.id,sequence:0,command:'F'});expect(fixture.writes).toEqual(['S','F']);
 }finally{await service.close();}
 expect(fixture.writes).toEqual(['S','F','S']);expect(fixture.ports[0]!.isOpen).toBe(false);
});
it('an old control session cannot close or move a reconnected robot',async()=>{
 const service=new DeviceService();const first=await service.openRobot('HC05_FIXTURE');await service.closeRobot(first.id);const second=await service.openRobot('HC05_FIXTURE');
 try{expect(second.id).not.toBe(first.id);expect(await service.closeRobot(first.id)).toBe(false);await expect(service.commandRobot({sessionId:first.id,sequence:3,command:'F'})).rejects.toThrow('ARDUINO_SESSION_CLOSED');expect(fixture.ports[1]!.isOpen).toBe(true);}finally{await service.close();}
});
it('a physical disconnect revokes the controller and a new connection starts stopped',async()=>{
 const service=new DeviceService();const first=await service.openRobot('HC05_FIXTURE');await service.commandRobot({sessionId:first.id,sequence:0,command:'F'});fixture.ports[0]!.isOpen=false;fixture.ports[0]!.emit('close');
 await expect(service.commandRobot({sessionId:first.id,sequence:1,command:'F'})).rejects.toThrow('ARDUINO_SESSION_CLOSED');await service.openRobot('HC05_FIXTURE');expect(fixture.writes.at(-1)).toBe('S');await service.close();
});
it('failed STOP writes still close the transport and relinquish ownership',async()=>{
 const service=new DeviceService();await service.openRobot('HC05_FIXTURE');fixture.writeError=new Error('fixture write failed');await service.close();expect(fixture.ports[0]!.isOpen).toBe(false);fixture.writeError=null;await service.open('HC05_FIXTURE',9600);await service.send('normal monitor');await service.close();
});
it('missing ports release ownership for a later normal monitor connection',async()=>{
 const service=new DeviceService();await expect(service.openRobot('NOT_A_PORT')).rejects.toThrow('PORT_NOT_FOUND');await service.open('HC05_FIXTURE',9600);await service.send('fixture text');await service.close();
});
it('a serial error revokes motion even when the OS has not closed the port',async()=>{
 const service=new DeviceService();const connection=await service.openRobot('HC05_FIXTURE');
 try{await service.commandRobot({sessionId:connection.id,sequence:0,command:'F'});fixture.ports[0]!.emit('error',new Error('fixture transport failure'));await expect(service.commandRobot({sessionId:connection.id,sequence:1,command:'F'})).rejects.toThrow('ARDUINO_CONTROL_EXPIRED');expect(fixture.writes.at(-1)).toBe('S');}finally{await service.close();}
});
it('waits for the STOP byte to drain before closing the robot port and blocks new motion meanwhile',async()=>{
 const service=new DeviceService();const connection=await service.openRobot('HC05_FIXTURE');await service.commandRobot({sessionId:connection.id,sequence:0,command:'F'});fixture.drainPending=true;
 const closing=service.close();await vi.waitFor(()=>expect(fixture.drainCallback).not.toBeNull());
 expect(fixture.writes.at(-1)).toBe('S');expect(fixture.closeCalls).toBe(0);expect(fixture.ports[0]!.isOpen).toBe(true);
 await expect(service.commandRobot({sessionId:connection.id,sequence:1,command:'F'})).rejects.toThrow('PORT_BUSY');
 fixture.drainCallback!();await closing;expect(fixture.closeCalls).toBe(1);expect(fixture.ports[0]!.isOpen).toBe(false);
});
it.each(['timeout','error'] as const)('still closes when draining STOP ends with %s',async outcome=>{
 vi.useFakeTimers();const service=new DeviceService();await service.openRobot('HC05_FIXTURE');fixture.drainPending=true;
 const closing=service.close();await vi.advanceTimersByTimeAsync(0);expect(fixture.drainCallback).not.toBeNull();expect(fixture.closeCalls).toBe(0);
 if(outcome==='error')fixture.drainCallback!(new Error('fixture drain failure'));else{await vi.advanceTimersByTimeAsync(299);expect(fixture.closeCalls).toBe(0);await vi.advanceTimersByTimeAsync(1);}
 await closing;expect(fixture.closeCalls).toBe(1);expect(fixture.ports[0]!.isOpen).toBe(false);
});
