import {realpath,rm} from 'node:fs/promises';
import {basename,dirname} from 'node:path';
import {tmpdir} from 'node:os';

/** Never recursively delete a computed fixture path before checking its real target. */
export async function removeFixtureDirectory(directory){
 const root=await realpath(directory),temporary=await realpath(tmpdir());
 if(dirname(root)!==temporary||!/^jective(?:-| )/.test(basename(root)))throw new Error('Unsafe fixture cleanup');
 await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
}
