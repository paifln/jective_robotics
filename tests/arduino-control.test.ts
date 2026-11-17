import {afterEach,describe,expect,it,vi} from 'vitest';
import {ArduinoControl} from '../packages/devices/arduino-control';
import {ArduinoInput} from '../packages/devices/arduino-input';
import {ArduinoCommandRequestSchema} from '../packages/contracts/arduino-robot';

const sessionId='598a1662-55a7-4b32-ac71-f831739bce71';
afterEach(()=>vi.useRealTimers());
describe('Arduino movement lease',()=>{
 it('sends only one ASCII byte and stops when the renderer stops renewing its lease',async()=>{
  vi.useFakeTimers();const writes:string[]=[];const control=new ArduinoControl(sessionId,async value=>{writes.push(value);},vi.fn());
  try{
   await control.command({sessionId,sequence:0,command:'F'});
   await vi.advanceTimersByTimeAsync(300);expect(writes).toEqual(['F']);
   await control.command({sessionId,sequence:1,command:'F'});
   await vi.advanceTimersByTimeAsync(300);expect(writes).toEqual(['F','F']);
   await vi.advanceTimersByTimeAsync(50);expect(writes).toEqual(['F','F','S']);
   await expect(control.command({sessionId,sequence:2,command:'F'})).rejects.toThrow('ARDUINO_CONTROL_EXPIRED');
   await control.command({sessionId,sequence:3,command:'S'});
   await vi.advanceTimersByTimeAsync(1000);expect(writes).toEqual(['F','F','S','S']);
  }finally{control.dispose();}
 });
 it('coalesces queued directions into STOP while a native write is pending',async()=>{
  const writes:string[]=[];const complete:Array<()=>void>=[];
  const control=new ArduinoControl(sessionId,value=>{writes.push(value);return new Promise<void>(resolve=>complete.push(resolve));},vi.fn());
  try{
   const forward=control.command({sessionId,sequence:0,command:'F'});
   const left=control.command({sessionId,sequence:1,command:'L'});
   const stopped=control.command({sessionId,sequence:2,command:'S'});
   expect(writes).toEqual(['F']);complete.shift()!();
   await vi.waitFor(()=>expect(writes).toEqual(['F','S']));complete.shift()!();
   await Promise.all([forward,left,stopped]);expect(writes).toEqual(['F','S']);
  }finally{control.dispose();}
 });
 it('rejects an old session or sequence before it reaches the serial writer',async()=>{
  const write=vi.fn(async()=>undefined);const control=new ArduinoControl(sessionId,write,vi.fn());
  try{
   await control.command({sessionId,sequence:7,command:'S'});
   await expect(control.command({sessionId,sequence:6,command:'F'})).rejects.toThrow('ARDUINO_COMMAND_STALE');
   await expect(control.command({sessionId:'old',sequence:9,command:'F'})).rejects.toThrow('ARDUINO_SESSION_CLOSED');
   expect(write.mock.calls).toEqual([['S']]);
   control.dispose();await expect(control.command({sessionId,sequence:9,command:'F'})).rejects.toThrow('ARDUINO_SESSION_CLOSED');
  }finally{control.dispose();}
 });
 it('a write failure revokes motion and remains explicit to its caller',async()=>{
  const failure=vi.fn();const control=new ArduinoControl(sessionId,async()=>{throw new Error('fake cable failure');},failure);
  try{await expect(control.command({sessionId,sequence:0,command:'F'})).rejects.toThrow('fake cable failure');expect(failure).toHaveBeenCalledOnce();await expect(control.command({sessionId,sequence:1,command:'F'})).rejects.toThrow('ARDUINO_CONTROL_EXPIRED');}finally{control.dispose();}
 });
 it('a transport error stops motion and a later heartbeat cannot restart it',async()=>{
  const writes:string[]=[];const control=new ArduinoControl(sessionId,async value=>{writes.push(value);},vi.fn());
  try{await control.command({sessionId,sequence:0,command:'F'});await control.fault();await expect(control.command({sessionId,sequence:1,command:'F'})).rejects.toThrow('ARDUINO_CONTROL_EXPIRED');expect(writes).toEqual(['F','S']);}finally{control.dispose();}
 });
 it('rejects injected multi-byte commands and unbounded sequence numbers',()=>{
  for(const command of ['F\n','FF','@JECTIVE ARM','V255'])expect(ArduinoCommandRequestSchema.safeParse({sessionId,sequence:0,command}).success).toBe(false);
  expect(ArduinoCommandRequestSchema.safeParse({sessionId,sequence:Infinity,command:'F'}).success).toBe(false);
 });
});
describe('Arduino held input',()=>{
 it('stops on release and conflicting directions',()=>{
  const input=new ArduinoInput();input.keyDown('w');expect(input.command).toBe('F');input.keyDown('ArrowUp');expect(input.command).toBe('F');input.keyDown('a');expect(input.command).toBe('S');input.keyUp('a');expect(input.command).toBe('F');input.keyUp('w');input.keyUp('ArrowUp');expect(input.command).toBe('S');
 });
 it('never restarts a held key after emergency STOP',()=>{
  const input=new ArduinoInput();input.keyDown('w');input.stop();input.keyDown('w',true);expect(input.command).toBe('S');input.keyDown('d');expect(input.command).toBe('S');input.keyUp('w');expect(input.command).toBe('S');input.keyUp('d');input.keyDown('d');expect(input.command).toBe('R');
 });
 it('requires all touch pointers to release after emergency STOP',()=>{
  const input=new ArduinoInput();input.pointerDown(1,'F');input.pointerDown(2,'L');expect(input.command).toBe('S');input.stop();input.pointerUp(2);expect(input.command).toBe('S');input.pointerUp(1);input.pointerDown(3,'B');expect(input.command).toBe('B');input.pointerUp(3);expect(input.command).toBe('S');
 });
 it('focus loss clears inputs and ignores held-key autorepeat on refocus',()=>{
  const input=new ArduinoInput();input.keyDown('w');input.clear();input.keyDown('w',true);expect(input.command).toBe('S');input.keyUp('w');input.keyDown('w');expect(input.command).toBe('F');
 });
});
