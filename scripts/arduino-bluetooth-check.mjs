import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// Explicit opt-in diagnostic. The test program contains STOP and WAIT only.
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--port'||!/^COM[1-9]\d{0,3}$/i.test(args[1]))throw new Error('Usage: node scripts/arduino-bluetooth-check.mjs --port COM3');
const root=fileURLToPath(new URL('../',import.meta.url)),port=args[1].toUpperCase();
const output=resolve(root,'test-results/arduino-bluetooth-check.cjs');
const bundle=await build({entryPoints:[resolve(root,'packages/devices/index.ts')],bundle:true,platform:'node',format:'cjs',packages:'external',write:false});
await mkdir(resolve(root,'test-results'),{recursive:true});await writeFile(output,bundle.outputFiles[0].text);
const {DeviceService}=createRequire(import.meta.url)(output),devices=new DeviceService();
const identity=(await devices.list()).find(device=>device.path===port);
if(identity?.transport!=='bluetooth'||identity.bluetoothDirection==='incoming')throw new Error('Select a confirmed outgoing Bluetooth port; USB is not used by this check');
const started=Date.now();let connection,timer,closing=false;
const deadline=setTimeout(()=>{console.error('BLUETOOTH_CHECK_TIMEOUT');process.exit(1);},25000);
const report={port,name:identity.bluetoothName??identity.friendlyName,handshake:false,transferred:false,completed:false,stopped:false,motorCommands:0};
try{
 connection=await devices.openWireless(port);report.handshake=true;
 timer=setInterval(()=>{if(!closing)void devices.keepaliveWireless(connection.id).catch(()=>undefined);},100);
 const result=await devices.runWireless({sessionId:connection.id,program:{version:1,loopStart:-1,steps:[{op:'s',a:0,b:0},{op:'w',a:100,b:0},{op:'s',a:0,b:0}]}});
 report.transferred=result.sent===3;
 const finishBy=Date.now()+3000;
 while(Date.now()<finishBy){const state=await devices.keepaliveWireless(connection.id);if(state.status==='completed'){report.completed=true;break;}if(state.status==='error')throw new Error(state.error);await new Promise(resolve=>setTimeout(resolve,50));}
 report.stopped=(await devices.stopWireless(connection.id)).status==='stopped';
 if(!report.completed||!report.transferred||!report.stopped)throw new Error('BLUETOOTH_CHECK_INCOMPLETE');
}finally{
 closing=true;if(timer)clearInterval(timer);
 try{if(connection)await devices.closeWireless(connection.id);}finally{clearTimeout(deadline);report.elapsedMs=Date.now()-started;await writeFile(resolve(root,'test-results/arduino-bluetooth.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
}
