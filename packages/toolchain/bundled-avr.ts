import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const revision='avr-1.8.8-v1';

export async function seedBundledAvr(source:string,root:string){
  const marker=join(root,'.bundled-'+revision);
  try{if(await readFile(marker,'utf8')===revision)return;}
  catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}

  const data=join(root,'data');
  await mkdir(data,{recursive:true});
  await cp(source,data,{recursive:true,force:false});
  await writeFile(marker,revision);
}
