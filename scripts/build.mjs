import {checkArchitecture} from './architecture-check.mjs';
console.log(JSON.stringify(await checkArchitecture()));
await import('./lesson-audio-check.mjs');
await import('./runtime-content-source.mjs');
import {build} from 'esbuild';
import {mkdir,copyFile,cp,readFile} from 'node:fs/promises';
const version=JSON.parse(await readFile('package.json','utf8')).version;
const production=process.argv.includes('--production');
let assistantProvisioning=null;
try{
 const value=JSON.parse(await readFile('assistant-build.secret.json','utf8'));
 const server=new URL(value.server);
 if(server.protocol!=='https:'||server.username||server.password||server.search||server.hash||server.pathname!=='/'||!/^jt_[A-Za-z0-9_-]{43}$/.test(value.token))throw new Error('Invalid assistant build configuration');
 assistantProvisioning={server:server.origin,token:value.token};
}catch(error){if(error.code!=='ENOENT')throw new Error('Cannot load assistant build configuration');}
await mkdir('dist/renderer',{recursive:true});
await build({entryPoints:['apps/desktop/main.ts'],outfile:'dist/main.cjs',bundle:true,platform:'node',format:'cjs',external:['electron','serialport'],sourcemap:true,define:{__JECTIVE_ASSISTANT_PROVISIONING__:JSON.stringify(assistantProvisioning)}});
await build({entryPoints:['apps/desktop/environment.worker.ts'],outfile:'dist/environment.worker.cjs',bundle:true,platform:'node',format:'cjs',external:['original-fs']});
await build({entryPoints:['apps/desktop/preload.ts'],outfile:'dist/preload.cjs',bundle:true,platform:'node',format:'cjs',external:['electron']});
await build({entryPoints:['apps/desktop/renderer/launch-entry.ts'],outfile:'dist/renderer/launch.js',bundle:true,platform:'browser',format:'iife',minify:production,charset:'utf8'});
await build({entryPoints:['apps/desktop/renderer/app.tsx'],outfile:'dist/renderer/app.js',bundle:true,platform:'browser',format:'esm',loader:{'.ttf':'file'},define:{__JECTIVE_VERSION__:JSON.stringify(version),'process.env.NODE_ENV':JSON.stringify(production?'production':'development')},minify:production,charset:'utf8',sourcemap:true});
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
await copyFile('assets/assistant/jexi.png','dist/renderer/jexi.png');
await copyFile('assets/assistant/jexi-avatar.png','dist/renderer/jexi-avatar.png');

await cp('assets/fonts','dist/renderer/fonts',{recursive:true});
await cp('assets/learning','dist/renderer/learning',{recursive:true});
