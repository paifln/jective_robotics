import {build} from 'esbuild';
import {builtinModules} from 'node:module';
import {readdir} from 'node:fs/promises';
import {resolve,dirname,relative,sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const native=new Set([...builtinModules,...builtinModules.map(name=>'node:'+name),'electron','serialport','original-fs']);
const preload=resolve('apps/desktop/preload.ts');

/** Inspect the actual transitive bundled dependency graph, including worker entry points. */
export async function verifyBrowserBoundary(entryPoints,{allowPreload=false,production=false}={}){
 const result=await build({entryPoints,bundle:true,write:false,outdir:'.verification/architecture-unused',platform:'browser',format:'esm',loader:{'.ttf':'file'},define:{__JECTIVE_VERSION__:'"architecture-check"','process.env.NODE_ENV':JSON.stringify(production?'production':'development')},logLevel:'silent',metafile:true,plugins:[{
  name:'jective-trust-boundary',setup(builder){
   builder.onResolve({filter:/.*/},args=>{
    if(native.has(args.path)||args.path.startsWith('node:')){
     if(allowPreload&&args.path==='electron'&&resolve(args.importer)===preload)return {path:args.path,external:true};
     return {errors:[{text:'ARCHITECTURE_NATIVE_IMPORT: '+args.path}]};
    }
    if(args.path.startsWith('.')){
     const target=resolve(dirname(args.importer),args.path),server=resolve('services');
     if(target===server||target.startsWith(server+sep))return {errors:[{text:'ARCHITECTURE_SERVER_IMPORT'}]};
    }
    return undefined;
   });
  }
 }]});
 return Object.keys(result.metafile.inputs).length;
}

export async function checkArchitecture(){
 const renderer='apps/desktop/renderer';
 const workers=(await readdir(renderer)).filter(file=>file.endsWith('.worker.ts')).map(file=>resolve(renderer,file));
 const entries=[resolve(renderer,'app.tsx'),resolve(renderer,'launch-entry.ts'),...workers];
 const rendererInputs=await verifyBrowserBoundary(entries);
 const productionRendererInputs=await verifyBrowserBoundary(entries,{production:true});
 const preloadInputs=await verifyBrowserBoundary([preload],{allowPreload:true});
 const contracts=(await readdir('packages/contracts')).filter(file=>file.endsWith('.ts')).map(file=>resolve('packages/contracts',file));
 const contractInputs=await verifyBrowserBoundary(contracts);
 return {status:'PASS',rendererInputs,productionRendererInputs,workers:workers.length,preloadInputs,contractInputs,scope:relative(process.cwd(),renderer)};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await checkArchitecture()));
