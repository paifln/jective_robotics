import {execFileSync} from 'node:child_process';
import {access,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const cli=resolve('.toolchain/bin/arduino-cli.exe');
const data=resolve('.toolchain/sdk/data');
const temporary=await mkdtemp(join(tmpdir(),'jective-avr-package-'));
const config=join(temporary,'arduino-cli.yaml');
try{
  await writeFile(config,JSON.stringify({directories:{data,downloads:join(temporary,'downloads'),user:join(temporary,'user')}}));
  const run=(...args)=>JSON.parse(execFileSync(cli,[...args,'--config-file',config,'--json'],{encoding:'utf8'}));
  if(run('version').VersionString!=='1.5.1')throw new Error('Expected Arduino CLI 1.5.1');
  if(!run('core','list').platforms.some(core=>core.id==='arduino:avr'&&core.installed_version==='1.8.8')){
    throw new Error('Expected Arduino AVR Boards 1.8.8');
  }
  const index=JSON.parse(await readFile(join(data,'package_index.json'),'utf8'));
  const avr=index.packages.find(pkg=>pkg.name==='arduino')?.platforms.find(platform=>platform.architecture==='avr'&&platform.version==='1.8.8');
  if(!avr?.toolsDependencies?.length)throw new Error('Missing tool dependencies for Arduino AVR Boards 1.8.8');
  await Promise.all(avr.toolsDependencies.map(tool=>access(join(data,'packages',tool.packager,'tools',tool.name,tool.version))));
}catch(error){
  console.error('Prepare the offline Arduino SDK with npm run arduino:setup before packaging.');
  throw error;
}finally{
  await rm(temporary,{recursive:true,force:true});
}
