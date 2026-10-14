import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
await mkdir('test-results',{recursive:true});
await build({entryPoints:['packages/toolchain/index.ts'],outfile:'test-results/runtime-toolchain.cjs',platform:'node',format:'cjs',bundle:true});
const {ToolchainService}=await import('../test-results/runtime-toolchain.cjs');
const safety=(await readFile('firmware/jective-runtime/SafetyController.h','utf8')).replace('#pragma once','');
const runtime=(await readFile('firmware/jective-runtime/JectiveRuntime.h','utf8')).replace('#pragma once','').replace('#include "SafetyController.h"','');
const service=new ToolchainService(resolve('.toolchain/bin/arduino-cli.exe'),resolve('.toolchain/workspace'));
const results=[];
for(const profileId of ['esp32-devkit-reference','esp32c3-reference']){
 const pins=profileId==='esp32c3-reference'?'3,4,5,6':'32,33,25,26';const [a,b,c,d]=pins.split(',');
 const source=`${safety}\n${runtime}\njective::Runtime robot;\njective::Configuration direction={jective::Driver::DirectionEnable,{${a},${b}},{${c},${d}},-1,true,"${profileId}"};\njective::Configuration dual={jective::Driver::DualInput,{${a},${b}},{${c},${d}},-1,true,"${profileId}"};\nvoid setup(){Serial.begin(115200); /* Compile fixture only: motor configuration is NOT initialized. */}\nvoid loop(){delay(10);}\n`;
 const result=await service.compile({schemaVersion:1,id:crypto.randomUUID(),name:'Runtime compile fixture '+profileId,profileId,mode:'code',source,workspace:{},revision:0});results.push({profileId,...result});console.log(profileId+': '+result.state);if(result.state!=='succeeded')console.error(result.log);
}
await writeFile('test-results/runtime-compiler.json',JSON.stringify({physical:'NOT RUN',logicExecution:'Not executed by this compile fixture; separate host safety logic tests are in evidence/latest/safety.json. On-device execution NOT RUN',results},null,2));
if(results.some(r=>r.state!=='succeeded'))throw new Error('Runtime compiler checks failed');
