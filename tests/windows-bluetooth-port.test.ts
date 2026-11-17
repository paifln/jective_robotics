import {afterEach,expect,it,vi} from 'vitest';
import type {EventEmitter} from 'node:events';
import type {PassThrough,Writable} from 'node:stream';

type FakeChild=EventEmitter&{stdin:Writable;stdout:PassThrough;stderr:PassThrough;writes:string[];kill:ReturnType<typeof vi.fn>};
const fixture=vi.hoisted(()=>({children:[] as FakeChild[],spawns:[] as {executable:string;args:string[];options:unknown}[],throwSpawn:false}));
vi.mock('node:child_process',async()=>{
 const {EventEmitter}=await import('node:events');const {PassThrough,Writable}=await import('node:stream');
 return {spawn:(executable:string,args:string[],options:unknown)=>{
  fixture.spawns.push({executable,args,options});if(fixture.throwSpawn)throw new Error('Synthetic spawn failure');
  const child=new EventEmitter() as FakeChild;child.writes=[];
  child.stdin=new Writable({write(chunk,_encoding,callback){child.writes.push(String(chunk));callback();}});
  child.stdout=new PassThrough();child.stderr=new PassThrough();
  child.kill=vi.fn(()=>{child.emit('close',1,null);return true;});fixture.children.push(child);return child;
 }};
});
import {WindowsBluetoothPort} from '../packages/devices/windows-bluetooth-port';

const ports:WindowsBluetoothPort[]=[];
afterEach(()=>{
 for(const port of ports.splice(0))port.close(()=>undefined);
 for(const child of fixture.children){child.emit('close',0,null);child.stdout.destroy();child.stderr.destroy();child.stdin.destroy();}
 fixture.children=[];fixture.spawns=[];fixture.throwSpawn=false;vi.useRealTimers();
});
function create(){const port=new WindowsBluetoothPort({path:'COM3',baudRate:9600});ports.push(port);return port;}
function opened(){const port=create(),callback=vi.fn();port.open(callback);const child=fixture.children.at(-1)!;child.stdout.write('ready\n');expect(callback).toHaveBeenCalledWith(null);return {port,child};}
function requestId(child:FakeChild){return child.writes.at(-1)!.split(' ')[1]!.trim();}

it('starts a hidden fixed PowerShell command and waits for complete readiness before opening',()=>{
 const port=create(),callback=vi.fn();port.open(callback);const child=fixture.children[0]!;
 expect(port.isOpen).toBe(false);expect(callback).not.toHaveBeenCalled();
 const spawn=fixture.spawns[0]!;expect(spawn.executable).toMatch(/\\WindowsPowerShell\\v1\.0\\powershell\.exe$/i);
 expect(spawn.options).toEqual({windowsHide:true,shell:false,stdio:['pipe','pipe','pipe']});
 expect(spawn.args.slice(0,-1)).toEqual(['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand']);
 const script=Buffer.from(spawn.args.at(-1)!,'base64').toString('utf16le');
 expect(script).toContain("[JectiveBluetoothBridge]::Run('COM3',9600)");expect(spawn.args.join(' ').length).toBeLessThan(30000);
 child.stdout.write('rea');expect(callback).not.toHaveBeenCalled();child.stdout.write('dy\r\n');expect(callback).toHaveBeenCalledOnce();expect(port.isOpen).toBe(true);
});

it('validates COM names and baud before constructing a process command',()=>{
 for(const path of ['COM3; calc.exe',"COM3'); exit; #",'COM0','C:\\file','COM999999','COM3\n'])expect(()=>new WindowsBluetoothPort({path,baudRate:9600})).toThrow('PORT_INVALID');
 expect(()=>new WindowsBluetoothPort({path:'COM3',baudRate:12345})).toThrow('BAUD_UNSUPPORTED');expect(fixture.spawns).toEqual([]);
});

it('delivers fragmented binary data and completes writes only after matching helper acknowledgements',()=>{
 const {port,child}=opened(),data:Buffer[]=[];port.on('data',chunk=>data.push(chunk));
 const first=vi.fn(),second=vi.fn();port.write('?jr1 0badcafe\n',first);port.write('S',second);
 expect(child.writes).toEqual(['w 1 P2pyMSAwYmFkY2FmZQo=\n','w 2 Uw==\n']);expect(first).not.toHaveBeenCalled();expect(second).not.toHaveBeenCalled();
 const frame='data '+Buffer.from('!jr1 stopped 00000000\r\n').toString('base64')+'\n';child.stdout.write(frame.slice(0,14));child.stdout.write(frame.slice(14)+'ack 1\n');
 expect(Buffer.concat(data).toString()).toBe('!jr1 stopped 00000000\r\n');expect(first).toHaveBeenCalledWith(null);expect(second).not.toHaveBeenCalled();
 child.stdout.write('ack 2\n');expect(second).toHaveBeenCalledWith(null);
});

it('drains and closes with acknowledgement, closes the helper, and ignores late frames',()=>{
 const {port,child}=opened(),drained=vi.fn(),closed=vi.fn(),again=vi.fn(),closeEvent=vi.fn();port.on('close',closeEvent);
 port.drain(drained);expect(child.writes.at(-1)).toBe('d 1\n');child.stdout.write('ack 1\n');expect(drained).toHaveBeenCalledWith(null);
 port.close(closed);port.close(again);expect(child.writes.at(-1)).toBe('c 2\n');expect(port.isOpen).toBe(false);expect(closed).not.toHaveBeenCalled();
 child.stdout.write('closed 2\n');expect(closed).toHaveBeenCalledWith(null);expect(again).toHaveBeenCalledWith(null);expect(child.kill).toHaveBeenCalledOnce();expect(closeEvent).toHaveBeenCalledOnce();
 child.stdout.write('ready\nack 1\ndata Uw==\n');child.emit('close',0,null);expect(closeEvent).toHaveBeenCalledOnce();expect(port.isOpen).toBe(false);
});

it('close cancels pending writes without accepting their late acknowledgements as a new session',()=>{
 const {port,child}=opened(),written=vi.fn(),closed=vi.fn();port.write('S',written);port.close(closed);
 expect(written).toHaveBeenCalledWith(expect.objectContaining({message:'PORT_CLOSED'}));expect(written).toHaveBeenCalledOnce();
 child.stdout.write('ack 1\nclosed 2\n');expect(closed).toHaveBeenCalledWith(null);expect(written).toHaveBeenCalledOnce();
});

it('terminates a timed-out write and all pending callbacks before the device service 300ms timeout',async()=>{
 vi.useFakeTimers();const {port,child}=opened(),first=vi.fn(),second=vi.fn(),error=vi.fn(),closed=vi.fn();port.on('error',error);port.on('close',closed);
 port.write('S',first);port.write('?jr1 0badcafe\n',second);await vi.advanceTimersByTimeAsync(280);
 expect(first).toHaveBeenCalledWith(expect.objectContaining({message:'SERIAL_WRITE_TIMEOUT'}));expect(second).toHaveBeenCalledWith(expect.objectContaining({message:'SERIAL_WRITE_TIMEOUT'}));
 expect(child.kill).toHaveBeenCalledOnce();expect(error).toHaveBeenCalledOnce();expect(closed).toHaveBeenCalledOnce();expect(port.isOpen).toBe(false);
 child.stdout.write('ready\nack 1\nack 2\n');await vi.advanceTimersByTimeAsync(10000);expect(first).toHaveBeenCalledOnce();expect(second).toHaveBeenCalledOnce();
 const later=vi.fn();port.write('S',later);await vi.advanceTimersByTimeAsync(0);expect(later).toHaveBeenCalledWith(expect.objectContaining({message:'PORT_CLOSED'}));
});

it('bounds startup and cannot reopen after a timeout or a late ready event',async()=>{
 vi.useFakeTimers();const port=create(),opened=vi.fn();port.open(opened);const child=fixture.children[0]!;
 await vi.advanceTimersByTimeAsync(15000);expect(opened).toHaveBeenCalledWith(expect.objectContaining({message:'BLUETOOTH_OPEN_TIMEOUT'}));expect(child.kill).toHaveBeenCalledOnce();
 child.stdout.write('ready\n');expect(port.isOpen).toBe(false);expect(opened).toHaveBeenCalledOnce();
 const reopened=vi.fn();port.open(reopened);await vi.advanceTimersByTimeAsync(0);expect(reopened).toHaveBeenCalledWith(expect.objectContaining({message:'PORT_BUSY'}));expect(fixture.spawns).toHaveLength(1);
});

it('handles startup failures and unexpected helper exit without leaving a live session',()=>{
 fixture.throwSpawn=true;const port=create(),callback=vi.fn();port.open(callback);expect(callback).toHaveBeenCalledWith(expect.objectContaining({message:'BLUETOOTH_HELPER_FAILED'}));
 fixture.throwSpawn=false;const {port:running,child}=opened(),written=vi.fn();running.write('S',written);child.emit('close',1,null);
 expect(written).toHaveBeenCalledWith(expect.objectContaining({message:'BLUETOOTH_HELPER_EXIT'}));expect(running.isOpen).toBe(false);expect(child.kill).toHaveBeenCalledOnce();
});

it('fails closed on malformed, oversized, unsolicited, or helper error frames',()=>{
 for(const frame of ['data !!!!\n','data YQ=\n','ack 999\n','ready\n','x'.repeat(8193),'data '+Buffer.alloc(1025).toString('base64')+'\n','error 1 '+Buffer.from('SERIAL_WRITE_TIMEOUT').toString('base64')+'\n']){
  const {port,child}=opened(),written=vi.fn();port.write('S',written);child.stdout.write(frame);
  expect(written).toHaveBeenCalledOnce();expect(written.mock.calls[0]![0]).toBeInstanceOf(Error);expect(port.isOpen).toBe(false);expect(child.kill).toHaveBeenCalledOnce();
 }
});

it('cleans up pipe errors and a helper that never confirms close',async()=>{
 for(const stream of ['stdin','stdout','stderr'] as const){const {port,child}=opened();child[stream].emit('error',new Error('Synthetic pipe failure'));expect(port.isOpen).toBe(false);expect(child.kill).toHaveBeenCalledOnce();}
 vi.useFakeTimers();const {port,child}=opened(),closed=vi.fn();port.close(closed);await vi.advanceTimersByTimeAsync(1000);
 expect(closed).toHaveBeenCalledWith(expect.objectContaining({message:'BLUETOOTH_HELPER_TIMEOUT'}));expect(child.kill).toHaveBeenCalledOnce();child.stdout.write('closed '+requestId(child)+'\n');expect(closed).toHaveBeenCalledOnce();
});
