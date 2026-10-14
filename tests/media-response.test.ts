import {it,expect} from 'vitest';
import {mkdtemp,writeFile,rm,truncate} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {studioMediaResponse,isStudioMedia} from '../apps/desktop/infrastructure/media';
it('serves bounded local recordings with real byte-range responses and rejects invalid requests',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-media-'));try{const path=join(root,'lesson.ogg'),bytes=Uint8Array.from({length:100},(_,i)=>i);await writeFile(path,bytes);
  expect(isStudioMedia(path)).toBe(true);expect(isStudioMedia('lesson.exe')).toBe(false);await expect(studioMediaResponse('lesson.exe',null)).rejects.toThrow('MEDIA_TYPE_UNSUPPORTED');
  const full=await studioMediaResponse(path,null);expect(full.status).toBe(200);expect(new Uint8Array(await full.arrayBuffer())).toEqual(bytes);expect(full.headers.get('Content-Type')).toBe('audio/ogg');
  for(const [range,start,end] of [['bytes=10-19',10,19],['bytes=95-',95,99],['bytes=-5',95,99],['bytes=90-999',90,99],['bytes=-999',0,99]] as const){const response=await studioMediaResponse(path,range);expect(response.status).toBe(206);expect(response.headers.get('Content-Range')).toBe(`bytes ${start}-${end}/100`);expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes.slice(start,end+1));}
  for(const range of ['bytes=-','bytes=-0','bytes=100-','bytes=90-20','bytes=0-2,5-6','items=0-1','bytes=9999999999999999-'])expect((await studioMediaResponse(path,range)).status).toBe(416);
  await truncate(path,0);expect((await studioMediaResponse(path,null)).status).toBe(413);await truncate(path,10*1024*1024+1);expect((await studioMediaResponse(path,null)).status).toBe(413);
 }finally{await rm(root,{recursive:true,force:true});}
});
