import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

await mkdir('.toolchain',{recursive:true});
await build({entryPoints:['tests/arduino-wireless-roundtrip.node.ts'],outfile:'.toolchain/arduino-wireless-roundtrip.cjs',bundle:true,platform:'node',format:'cjs'});
const result=spawnSync(process.execPath,['.toolchain/arduino-wireless-roundtrip.cjs',resolve('test-results/arduino_wireless_test.exe')],{stdio:'inherit',windowsHide:true,timeout:15000});
if(result.error)throw result.error;
process.exitCode=result.status??1;
