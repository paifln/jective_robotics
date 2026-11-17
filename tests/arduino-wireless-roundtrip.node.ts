import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {resolve} from 'node:path';
import {ArduinoWireless} from '../packages/devices/arduino-wireless';
import type {WirelessProgram} from '../packages/contracts/arduino-wireless';

async function verify(){
 const executable=resolve(process.argv[2]??'test-results/arduino_wireless_test.exe');
 const child=spawn(executable,['--bridge'],{windowsHide:true,stdio:['pipe','pipe','pipe']});
 const pending:{resolve:()=>void;reject:(error:Error)=>void}[]=[];
 let bytes='',lastState:number[]=[],stderr='',readyResolve:()=>void=()=>undefined,readyReject:(error:Error)=>void=()=>undefined;
 const startup=new Promise<void>((done,reject)=>{readyResolve=done;readyReject=reject;});
 child.stderr.on('data',chunk=>{stderr+=String(chunk);});
 child.on('error',error=>{readyReject(error);for(const call of pending.splice(0))call.reject(error);});
 child.on('exit',code=>{const error=new Error(`FIRMWARE_BRIDGE_EXIT ${code}: ${stderr}`);readyReject(error);for(const call of pending.splice(0))call.reject(error);});
 const lines=createInterface({input:child.stdout});
 lines.on('line',line=>{
  if(line==='bridge-ready'){readyResolve();return;}
  if(line==='bridge-idle'){pending.shift()?.resolve();return;}
  if(line.startsWith('state ')){lastState=line.slice(6).split(' ').map(Number);return;}
  if(line.startsWith('tx ')){
   bytes+=Buffer.from(line.slice(3),'hex').toString('ascii');
   let at;while((at=bytes.indexOf('\n'))>=0){const frame=bytes.slice(0,at).replace(/\r$/,'');bytes=bytes.slice(at+1);controller?.feed(frame);}
  }
 });
 const command=(text:string)=>new Promise<void>((done,reject)=>{
  const timer=setTimeout(()=>reject(new Error('FIRMWARE_BRIDGE_TIMEOUT '+stderr)),3000);
  pending.push({resolve:()=>{clearTimeout(timer);done();},reject:error=>{clearTimeout(timer);reject(error);}});child.stdin.write(text+'\n');
 });
 const writes:string[]=[];let partialStep=false,partialReached:()=>void=()=>undefined;
 const controller=new ArduinoWireless('roundtrip-native-firmware',async frame=>{
  writes.push(frame);
  if(partialStep&&frame.startsWith('!jr1 step ')){partialStep=false;await command('rx '+Buffer.from(frame.slice(0,-2),'ascii').toString('hex'));partialReached();return;}
  await command('rx '+Buffer.from(frame,'ascii').toString('hex'));
 });
 const checkState=async()=>{await command('state');return lastState;};
 try{
  const startupTimeout=setTimeout(()=>readyReject(new Error('FIRMWARE_BRIDGE_START_TIMEOUT')),5000);try{await startup;}finally{clearTimeout(startupTimeout);}
  await controller.connect();
  const finite:WirelessProgram={version:1,steps:[{op:'m',a:89,b:89},{op:'w',a:100,b:0},{op:'s',a:0,b:0},{op:'l',a:1,b:0}],loopStart:-1};
  assert.equal((await controller.run(finite)).status,'running');assert.deepEqual(await checkState(),[1,1,0,89,0,89,0]);
  await command('tick 100');assert.equal(controller.snapshot().status,'completed');assert.deepEqual((await checkState()).slice(3),[0,0,0,0]);
  const instant:WirelessProgram={version:1,steps:[{op:'l',a:1,b:0},{op:'s',a:0,b:0}],loopStart:-1};
  assert.equal((await controller.run(instant)).status,'completed','RUN ACK and DONE from the same actual firmware chunk must preserve completion');
  partialStep=true;const started=new Promise<void>(done=>{partialReached=done;});
  const transfer=controller.run(finite);const rejected=assert.rejects(transfer,/ARDUINO_WIRELESS_CANCELLED/);await started;
  const beforeStop=writes.length;await controller.stop();await rejected;
  assert.equal(controller.snapshot().status,'stopped');assert.deepEqual(await checkState(),[0,0,0,0,0,0,0]);
  assert.deepEqual(writes.slice(beforeStop),['S']);
  // A fresh explicit upload after cancellation must work with the same parser.
  assert.equal((await controller.run(instant)).status,'completed');
  await controller.run(finite);const restartAt=writes.length;
  const stopping=controller.stop(),restarting=controller.run(instant);
  assert.deepEqual(writes.slice(restartAt),['S'],'Immediate restart must await the actual firmware STOP reply');
  await stopping;assert.equal((await restarting).status,'completed');
  assert.deepEqual((await checkState()).slice(3),[0,0,0,0]);
  console.log('PASS: host transport + actual firmware handshake, CRC upload, timed execution, same-chunk RUN/DONE, partial-frame STOP and immediate fresh restart');
 }finally{
  controller.dispose();lines.close();child.stdin.end();if(child.exitCode===null)child.kill();
 }
}
void verify().catch(error=>{console.error(error);process.exitCode=1;});
