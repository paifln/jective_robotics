import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root='test-results/lesson-compiler';await mkdir(root,{recursive:true});
for(const [name,entry] of [['content','packages/content/lessons.ts'],['codegen','packages/codegen/index.ts'],['toolchain','packages/toolchain/index.ts']])await build({entryPoints:[entry],outfile:root+'/'+name+'.cjs',platform:'node',format:'cjs',bundle:true});
const {artifacts}=await import('../test-results/lesson-compiler/content.cjs');const {generate}=await import('../test-results/lesson-compiler/codegen.cjs');const {ToolchainService}=await import('../test-results/lesson-compiler/toolchain.cjs');
const ids=process.argv.slice(2);const selected=ids.length?ids:Object.keys(artifacts);for(const id of selected)if(!artifacts[id])throw new Error('Unknown program lesson '+id);
const service=new ToolchainService(resolve('.toolchain/bin/arduino-cli.exe'),resolve('.toolchain/workspace'));const results=[];
for(const id of selected)for(const variant of ['starter','reference']){
 let source;try{source=generate(artifacts[id][variant],2);}catch(error){const reason=String(error);if(!/SENSOR_DRIVER_REQUIRED|SECOND_INDICATOR_WIRING_REQUIRED|MOTOR_WIRING_REQUIRED/.test(reason))throw error;results.push({id,variant,state:'SIMULATION_ONLY',reason});continue;}
 const result=await service.compile({schemaVersion:1,id:crypto.randomUUID(),name:id+' '+variant+' curriculum compile',profileId:'esp32-devkit-reference',mode:'code',source,workspace:{},revision:0});results.push({id,variant,...result});console.log(id,variant,result.state);
}
await writeFile(root+'/verification.json',JSON.stringify({selected,results,scope:'Actual compilation of selected current-source lesson programs. GPIO 2 is a compile-only reference target, not verified wiring. Simulation-only programs explicitly recorded. Upload/physical NOT RUN.'},null,2));if(results.some(r=>r.state!=='succeeded'&&r.state!=='SIMULATION_ONLY'))process.exitCode=1;
