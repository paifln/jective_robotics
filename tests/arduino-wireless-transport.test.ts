import {afterEach,expect,it,vi} from 'vitest';
import {ArduinoWireless} from '../packages/devices/arduino-wireless';
import {wirelessProgramChecksum,type WirelessProgram} from '../packages/contracts/arduino-wireless';

const program:WirelessProgram={version:1,steps:[{op:'m',a:89,b:-89},{op:'w',a:500,b:0},{op:'s',a:0,b:0}],loopStart:-1};
const controllers:ArduinoWireless[]=[];
afterEach(()=>{for(const controller of controllers.splice(0))controller.dispose();vi.useRealTimers();});
function fixture(options:{ignore?:(frame:string)=>boolean;completeImmediately?:boolean;turnaroundMs?:number}={}){
 const writes:string[]=[],dropped:string[]=[];let remoteTx='00000000',replyBusy=false;
 const respond=(line:string)=>{
  if(!options.turnaroundMs){controller.feed(line);return;}
  // AVR SoftwareSerial disables receive interrupts while sending a reply.
  replyBusy=true;setTimeout(()=>{replyBusy=false;controller.feed(line);},options.turnaroundMs);
 };
 const controller=new ArduinoWireless('test-session',async frame=>{
  writes.push(frame);if(replyBusy){dropped.push(frame);return;}if(options.ignore?.(frame))return;
  const words=frame.trim().split(' ');
  if(frame==='S'){respond(`!jr1 stopped ${remoteTx}`);return;}
  if(words[0]==='?jr1'){respond(`!jr1 hello ${words[1]} 1`);return;}
  const tx=words[2];
  if(words[1]==='begin'){remoteTx=tx!;respond(`!jr1 ack ${tx} begin`);}
  if(words[1]==='step')respond(`!jr1 ack ${tx} ${words[3]}`);
  if(words[1]==='commit')respond(`!jr1 ready ${tx}`);
  if(words[1]==='run'){respond(`!jr1 running ${tx}`);if(options.completeImmediately)controller.feed(`!jr1 done ${tx}`);}
 });
 controllers.push(controller);return {controller,writes,dropped};
}

it('uploads every indexed command with CRC and only runs after commit acknowledgement',async()=>{
 const {controller,writes}=fixture();await controller.connect();const state=await controller.run(program);
 const tx=writes.find(frame=>frame.startsWith('!jr1 begin '))!.split(' ')[2];
 expect(writes.slice(2)).toEqual([`!jr1 begin ${tx} 3 -1\n`,`!jr1 step ${tx} 0 m 89 -89\n`,`!jr1 step ${tx} 1 w 500 0\n`,`!jr1 step ${tx} 2 s 0 0\n`,`!jr1 commit ${tx} ${wirelessProgramChecksum(program)}\n`,`!jr1 run ${tx}\n`]);
 expect(state).toEqual({status:'running',sent:3,total:3});controller.feed(`!jr1 done ${tx}`);expect(controller.snapshot().status).toBe('completed');
});

it('handshake probes are harmless to a legacy F/B/L/R/S sketch and reject missing runtime',async()=>{
 vi.useFakeTimers();const {controller,writes}=fixture({ignore:()=>true});
 const connecting=controller.connect();const rejection=expect(connecting).rejects.toThrow('ARDUINO_WIRELESS_FIRMWARE_REQUIRED');
 await vi.advanceTimersByTimeAsync(3500);await rejection;
 expect(writes).toHaveLength(4);expect(writes[0]).toBe('S');expect(writes.slice(1).every(frame=>/^\?jr1 [a-f0-9]{8}\n$/.test(frame)&&!/[FBLRS]/.test(frame))).toBe(true);
 await expect(controller.run(program)).rejects.toThrow('RECONNECT_REQUIRED');
});

it('waits for half-duplex STOP replies before connecting and an immediate explicit restart',async()=>{
 vi.useFakeTimers();const {controller,writes,dropped}=fixture({turnaroundMs:30});
 const connecting=controller.connect();expect(writes).toEqual(['S']);
 await vi.advanceTimersByTimeAsync(29);expect(writes).toEqual(['S']);
 await vi.advanceTimersByTimeAsync(31);await connecting;
 const running=controller.run(program);await vi.advanceTimersByTimeAsync(180);expect((await running).status).toBe('running');
 expect(writes.filter(frame=>frame==='S')).toHaveLength(1);
 const count=writes.length;const stopping=controller.stop();const duplicateStop=controller.stop();const restarting=controller.run(program);
 expect(writes.slice(count)).toEqual(['S']);
 await vi.advanceTimersByTimeAsync(29);expect(writes.slice(count)).toEqual(['S']);
 await vi.advanceTimersByTimeAsync(1);await stopping;await duplicateStop;
 expect(writes[count+1]).toMatch(/^!jr1 begin /);
 await vi.advanceTimersByTimeAsync(180);expect((await restarting).status).toBe('running');expect(dropped).toEqual([]);
});

it('requires the current STOP acknowledgement before allowing a new upload',async()=>{
 vi.useFakeTimers();let ignoreStop=false;const {controller,writes}=fixture({ignore:frame=>ignoreStop&&frame==='S'});
 await controller.connect();await controller.run(program);ignoreStop=true;
 const stop=controller.stop();const rejected=expect(stop).rejects.toThrow('ARDUINO_WIRELESS_STOP_UNCONFIRMED');
 const tx=writes.find(frame=>frame.startsWith('!jr1 begin '))!.split(' ')[2];
 controller.feed(`!jr1 stopped ${tx==='ffffffff'?'00000000':'ffffffff'}`);
 const count=writes.length;const restarted=controller.run(program);const restartRejected=expect(restarted).rejects.toThrow('ARDUINO_WIRELESS_STOP_UNCONFIRMED');
 await vi.advanceTimersByTimeAsync(500);await rejected;await restartRejected;
 expect(writes.slice(count).some(frame=>frame.startsWith('!jr1 begin '))).toBe(false);
 expect(controller.snapshot()).toMatchObject({status:'error',error:'ARDUINO_WIRELESS_STOP_UNCONFIRMED'});
 await expect(controller.run(program)).rejects.toThrow('RECONNECT_REQUIRED');
});

it('rejects stale or out-of-order replies and STOP cancels a partially uploaded program before RUN',async()=>{
 vi.useFakeTimers();const {controller,writes}=fixture({ignore:frame=>frame.startsWith('!jr1 step ')});await controller.connect();
 const running=controller.run(program);const rejected=expect(running).rejects.toThrow('ARDUINO_WIRELESS_CANCELLED');await vi.advanceTimersByTimeAsync(0);
 const tx=writes.find(frame=>frame.startsWith('!jr1 begin '))!.split(' ')[2];
 controller.feed(`!jr1 ack ${tx==='ffffffff'?'00000000':'ffffffff'} 0`);controller.feed(`!jr1 ack ${tx} 1`);await vi.advanceTimersByTimeAsync(0);
 expect(controller.snapshot()).toEqual({status:'uploading',sent:0,total:3});
 await controller.stop();await rejected;controller.feed(`!jr1 ack ${tx} 0`);await vi.advanceTimersByTimeAsync(0);
 expect(writes.some(frame=>frame.startsWith('!jr1 commit ')||frame.startsWith('!jr1 run '))).toBe(false);expect(writes.at(-1)).toBe('S');expect(controller.snapshot().status).toBe('stopped');
});

it('heartbeat requires a live renderer lease and late keepalives cannot restart motion',async()=>{
 vi.useFakeTimers();const {controller,writes}=fixture();await controller.connect();await controller.run(program);
 await vi.advanceTimersByTimeAsync(600);controller.keepalive();await vi.advanceTimersByTimeAsync(999);expect(controller.snapshot().status).toBe('running');
 await vi.advanceTimersByTimeAsync(51);expect(controller.snapshot()).toMatchObject({status:'error',error:'ARDUINO_WIRELESS_LEASE_EXPIRED'});expect(writes.at(-1)).toBe('S');
 const previous=writes.length;controller.keepalive();await vi.advanceTimersByTimeAsync(1000);expect(writes).toHaveLength(previous);
 await controller.run(program);expect(controller.snapshot().status).toBe('running');
});

it('a completion arriving together with RUN acknowledgement stays completed',async()=>{
 const {controller}=fixture({completeImmediately:true});await controller.connect();expect((await controller.run(program)).status).toBe('completed');
});

it('missing acknowledgements never auto-retry RUN or publish success',async()=>{
 vi.useFakeTimers();const {controller,writes}=fixture({ignore:frame=>frame.startsWith('!jr1 run ')});await controller.connect();
 const lease=setInterval(()=>controller.keepalive(),200);
 try{
  const result=controller.run(program);const rejected=expect(result).rejects.toThrow('ARDUINO_WIRELESS_REPLY_TIMEOUT');await vi.advanceTimersByTimeAsync(1000);await rejected;
  expect(writes.filter(frame=>frame.startsWith('!jr1 run '))).toHaveLength(1);expect(writes.at(-1)).toBe('S');expect(controller.snapshot().status).toBe('error');
 }finally{clearInterval(lease);}
});

it('firmware errors revoke a transfer and transport faults require a fresh connection',async()=>{
 vi.useFakeTimers();const {controller,writes}=fixture({ignore:frame=>frame.startsWith('!jr1 commit ')});await controller.connect();
 const result=controller.run(program);const rejected=expect(result).rejects.toThrow('ARDUINO_WIRELESS_CRC');await vi.advanceTimersByTimeAsync(0);
 const tx=writes.find(frame=>frame.startsWith('!jr1 begin '))!.split(' ')[2];controller.feed(`!jr1 error ${tx} crc`);await rejected;
 expect(controller.snapshot()).toMatchObject({status:'error',error:'ARDUINO_WIRELESS_CRC'});expect(writes.at(-1)).toBe('S');
 await controller.fault();await expect(controller.run(program)).rejects.toThrow('RECONNECT_REQUIRED');
});

it('validates the whole wire program before sending any motion-related packet',async()=>{
 const {controller,writes}=fixture();await controller.connect();const count=writes.length;
 await expect(controller.run({...program,steps:[{op:'m',a:256,b:0}]})).rejects.toThrow();expect(writes).toHaveLength(count);
});
