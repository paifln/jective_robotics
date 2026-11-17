import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
/** Explicit fixture bytes, never an executable invoked by the tests. */
export async function prepareEnvironmentFixture(root:string,coreId='esp32:esp32',coreVersion='3.3.12'){
 const [vendor,architecture]=coreId.split(':') as [string,string];
 const core=join(root,'data','packages',vendor,'hardware',architecture,coreVersion);await mkdir(core,{recursive:true});await writeFile(join(core,'platform.txt'),'explicit fixture platform');await writeFile(join(root,'fixture-cli.exe'),'explicit fixture CLI bytes');return join(root,'fixture-cli.exe');
}
