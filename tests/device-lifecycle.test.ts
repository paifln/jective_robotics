import {it,expect,vi} from 'vitest';
const fixture=vi.hoisted(()=>({writeError:null as Error|null,ports:[] as {isOpen:boolean;openCallback?: (error?:Error)=>void;closeCallback?: (error?:Error)=>void;emit:(name:string,...args:unknown[])=>boolean}[],listPending:null as (()=>void)|null}));
vi.mock('serialport',async()=>{
 const {EventEmitter}=await import('node:events');
 class FakePort extends EventEmitter {
  isOpen=false;openCallback?: (error?:Error)=>void;closeCallback?: (error?:Error)=>void;
  constructor(){super();fixture.ports.push(this);}
  static async list(){await new Promise<void>(done=>{fixture.listPending=done;});return [{path:'FIXTURE_COM'}];}
  open(callback:(error?:Error)=>void){this.openCallback=callback;}
  close(callback:(error?:Error)=>void){this.closeCallback=callback;}
  write(_text:string,callback:(error?:Error)=>void){callback(fixture.writeError??undefined);}
 }
 return {SerialPort:FakePort};
});
it('failed enumeration and failed opening release the transition lock for a subsequent connection',async()=>{
 fixture.ports=[];const service=new DeviceService();
 const missing=service.open('NOT_A_FIXTURE_PORT',115200);fixture.listPending!();await expect(missing).rejects.toThrow('PORT_NOT_FOUND');
 const failed=service.open('FIXTURE_COM',115200);fixture.listPending!();await vi.waitFor(()=>expect(fixture.ports).toHaveLength(1));fixture.ports[0]!.openCallback!(new Error('Explicit fixture open failure'));await expect(failed).rejects.toThrow('Explicit fixture open failure');
 const retry=service.open('FIXTURE_COM',115200);fixture.listPending!();await vi.waitFor(()=>expect(fixture.ports).toHaveLength(2));const current=fixture.ports[1]!;current.isOpen=true;current.openCallback!();await expect(retry).resolves.toBe(true);
 const finish=service.close();current.isOpen=false;current.emit('close');current.closeCallback!();await finish;
});
import {DeviceService} from '../packages/devices';
import type {SerialEvent} from '../packages/contracts';
it('a flooded explicit transport reports the exact lost queue count and retains recent events',async()=>{
 fixture.ports=[];const service=new DeviceService();const events:SerialEvent[]=[];const unsubscribe=service.subscribe(event=>events.push(event));
 const opening=service.open('FIXTURE_COM',115200);fixture.listPending!();await vi.waitFor(()=>expect(fixture.ports).toHaveLength(1));const port=fixture.ports[0]!;port.isOpen=true;port.openCallback!();await opening;
 try{
  for(const start of [0,1500])port.emit('data',Buffer.from(Array.from({length:1500},(_,index)=>`queue fixture ${start+index}\n`).join('')));
  await vi.waitFor(()=>expect(events.some(e=>e.text==='SERIAL_QUEUE_LIMIT: 1000 oldest queued events discarded')).toBe(true));
  expect(events.some(e=>e.text==='queue fixture 0')).toBe(false);expect(events.some(e=>e.text==='queue fixture 1000')).toBe(true);
 }finally{unsubscribe();const closing=service.close();port.isOpen=false;port.emit('close');port.closeCallback!();await closing;}
});
it('serial write failures and denied commands remain explicit; a closing-during-open port is not reported ready',async()=>{
 fixture.ports=[];fixture.writeError=null;const service=new DeviceService();
 await expect(service.open('FIXTURE_COM',12345)).rejects.toThrow('BAUD_UNSUPPORTED');await expect(service.send('hello')).rejects.toThrow('PORT_CLOSED');
 for(const text of ['x'.repeat(4097),'  @JECTIVE ARM','hello\n\t@JECTIVE DRIVE'])await expect(service.send(text)).rejects.toThrow('SERIAL_COMMAND_DENIED');
 const interrupted=service.open('FIXTURE_COM',115200);fixture.listPending!();await vi.waitFor(()=>expect(fixture.ports).toHaveLength(1));fixture.ports[0]!.openCallback!();await expect(interrupted).rejects.toThrow('PORT_CLOSED_DURING_OPEN');
 const opening=service.open('FIXTURE_COM',115200);fixture.listPending!();await vi.waitFor(()=>expect(fixture.ports).toHaveLength(2));const port=fixture.ports[1]!;port.isOpen=true;port.openCallback!();await opening;
 try{fixture.writeError=new Error('EXPLICIT FIXTURE WRITE FAILURE');await expect(service.send('allowed')).rejects.toThrow('EXPLICIT FIXTURE WRITE FAILURE');fixture.writeError=null;await expect(service.send('allowed')).resolves.toBe(true);}
 finally{fixture.writeError=null;const closing=service.close();port.isOpen=false;port.emit('close');port.closeCallback!();await closing;}
});
it('serial transitions reject concurrent operations and ignore stale port events using an explicit fake transport',async()=>{
 fixture.ports=[];const service=new DeviceService();const events:SerialEvent[]=[];const unsubscribe=service.subscribe(e=>events.push(e));
 try{
  const opening=service.open('FIXTURE_COM',115200);await expect(service.open('FIXTURE_COM',115200)).rejects.toThrow('PORT_BUSY');await expect(service.close()).rejects.toThrow('PORT_BUSY');
  fixture.listPending!();await vi.waitFor(()=>expect(fixture.ports).toHaveLength(1));const first=fixture.ports[0]!;first.isOpen=true;first.openCallback!();await opening;
  first.emit('data',Buffer.from('fixture first\n'));const closing=service.close();await expect(service.open('FIXTURE_COM',115200)).rejects.toThrow('PORT_BUSY');await expect(service.send('hello')).rejects.toThrow('PORT_BUSY');
  first.isOpen=false;first.emit('close');first.closeCallback!();await closing;
  const next=service.open('FIXTURE_COM',9600);fixture.listPending!();await vi.waitFor(()=>expect(fixture.ports).toHaveLength(2));const second=fixture.ports[1]!;second.isOpen=true;second.openCallback!();await next;
  first.emit('close');first.emit('data',Buffer.from('stale first\n'));second.emit('data',Buffer.from('fixture second\n'));
  await vi.waitFor(()=>expect(events.some(e=>e.text==='fixture second')).toBe(true));expect(events.some(e=>e.text==='stale first')).toBe(false);
  const event=events.find(e=>e.text==='fixture second')!;expect(event.connection).toMatchObject({port:'FIXTURE_COM',baud:9600});expect(event.connection!.id).not.toBe(events.find(e=>e.kind==='status')!.connection!.id);
  const failedClose=service.close();second.closeCallback!(new Error('Explicit fixture close failure'));await expect(failedClose).rejects.toThrow('Explicit fixture close failure');
  await expect(service.send('allowed fixture text')).resolves.toBe(true);second.emit('data',Buffer.from('after failed close\n'));await vi.waitFor(()=>expect(events.some(e=>e.text==='after failed close')).toBe(true));
  const finish=service.close();second.isOpen=false;second.emit('close');second.closeCallback!();await finish;
 }finally{unsubscribe();if(fixture.ports.at(-1)?.isOpen){const finish=service.close();const p=fixture.ports.at(-1)!;p.isOpen=false;p.emit('close');p.closeCallback!();await finish;}}
});
