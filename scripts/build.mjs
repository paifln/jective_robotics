import {checkArchitecture} from './architecture-check.mjs';
console.log(JSON.stringify(await checkArchitecture()));
await import('./lesson-audio-check.mjs');
await import('./runtime-content-source.mjs');
import {build} from 'esbuild';
import {mkdir,copyFile,cp,readFile} from 'node:fs/promises';
const version=JSON.parse(await readFile('package.json','utf8')).version;
await mkdir('dist/renderer',{recursive:true});
await build({entryPoints:['apps/desktop/main.ts'],outfile:'dist/main.cjs',bundle:true,platform:'node',format:'cjs',external:['electron','serialport'],sourcemap:true});
await build({entryPoints:['apps/desktop/environment.worker.ts'],outfile:'dist/environment.worker.cjs',bundle:true,platform:'node',format:'cjs',external:['original-fs']});
await build({entryPoints:['apps/desktop/preload.ts'],outfile:'dist/preload.cjs',bundle:true,platform:'node',format:'cjs',external:['electron']});
await build({entryPoints:['apps/desktop/renderer/app.tsx'],outfile:'dist/renderer/app.js',bundle:true,platform:'browser',format:'esm',loader:{'.ttf':'file'},define:{__JECTIVE_VERSION__:JSON.stringify(version)},sourcemap:true});
await build({entryPoints:['apps/desktop/renderer/editor.worker.ts'],outfile:'dist/renderer/editor.worker.js',bundle:true,platform:'browser',format:'esm'});
await build({entryPoints:['apps/desktop/renderer/simulator.worker.ts'],outfile:'dist/renderer/simulator.worker.js',bundle:true,platform:'browser',format:'esm'});
await build({entryPoints:['apps/desktop/renderer/robot.worker.ts'],outfile:'dist/renderer/robot.worker.js',bundle:true,platform:'browser',format:'esm'});
await build({entryPoints:['apps/desktop/renderer/repeatable.worker.ts'],outfile:'dist/renderer/repeatable.worker.js',bundle:true,platform:'browser',format:'esm'});
await build({entryPoints:['apps/desktop/renderer/collision.worker.ts'],outfile:'dist/renderer/collision.worker.js',bundle:true,platform:'browser',format:'esm'});
await build({entryPoints:['apps/desktop/renderer/uncertainty.worker.ts'],outfile:'dist/renderer/uncertainty.worker.js',bundle:true,platform:'browser',format:'esm'});
await build({entryPoints:['apps/desktop/renderer/challenge.worker.ts'],outfile:'dist/renderer/challenge.worker.js',bundle:true,platform:'browser',format:'esm'});
await build({entryPoints:['apps/desktop/renderer/investigation.worker.ts'],outfile:'dist/renderer/investigation.worker.js',bundle:true,platform:'browser',format:'esm'});
await copyFile('apps/desktop/renderer/index.html','dist/renderer/index.html');
await cp('node_modules/blockly/media','dist/renderer/blockly-media',{recursive:true});
await cp('assets/licenses','dist/licenses/upstream',{recursive:true});

await copyFile('apps/desktop/renderer/jective.svg','dist/renderer/jective.svg');
await copyFile('apps/desktop/renderer/jective-header.svg','dist/renderer/jective-header.svg');

await copyFile('assets/jective-icon.png','dist/renderer/jective-icon.png');

await cp('assets/fonts','dist/renderer/fonts',{recursive:true});
await cp('assets/learning','dist/renderer/learning',{recursive:true});
