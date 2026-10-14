import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('test-results/distance',{recursive:true});await build({entryPoints:['packages/simulator/index.ts'],outfile:'test-results/distance/simulator.cjs',platform:'node',format:'cjs',bundle:true});
const {RobotSimulation,worlds}=await import('../test-results/distance/simulator.cjs');
const rows=[];for(const expectedMeters of [.2,.5,1,1.5,2,2.1]){
 const world={...worlds[0],obstacles:[{x:worlds[0].start.x+expectedMeters,y:1,width:.1,height:1}]};
 const runs=Array.from({length:10},()=>new RobotSimulation({setup:[],loop:[]},world).state);const actual=runs[0];
 rows.push({origin:'simulation',expectedMeters,reportedMeters:actual.distance,status:actual.distanceStatus,source:actual.distanceSource,errorMeters:actual.distance===null?null:actual.distance-expectedMeters,repeatable:runs.every(r=>r.distance===actual.distance&&r.distanceStatus===actual.distanceStatus)});
}
const pass=rows.every(r=>r.repeatable&&(r.expectedMeters<=2?r.status==='valid'&&Math.abs(r.errorMeters)<1e-9:r.status==='outOfRange'&&r.reportedMeters===null));
await writeFile('test-results/distance/calibration.json',JSON.stringify({status:pass?'PASS':'FAIL',rows,scope:'Ten repeated ideal geometric centre-ray simulator observations per known target. This is model verification, not physical sensor calibration. Physical sensor, upload and waveform tests NOT RUN.'},null,2));
await writeFile('test-results/distance/calibration.csv','origin,expected_m,reported_m,status,source,error_m,repeatable\r\n'+rows.map(r=>[r.origin,r.expectedMeters,r.reportedMeters??'',r.status,r.source,r.errorMeters??'',r.repeatable].join(',')).join('\r\n'));
console.log(JSON.stringify({status:pass?'PASS':'FAIL',rows},null,2));if(!pass)process.exitCode=1;
