import {open} from 'node:fs/promises';
import {extname} from 'node:path';
const types:Record<string,string>={'.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav'};
export function isStudioMedia(path:string){return Boolean(types[extname(path).toLowerCase()]);}
/** Called only after the main asset resolver and real-path containment checks. */
export async function studioMediaResponse(path:string,range:string|null){
 const type=types[extname(path).toLowerCase()];if(!type)throw new Error('MEDIA_TYPE_UNSUPPORTED');
 const file=await open(path,'r');try{
  const info=await file.stat();if(!info.isFile()||info.size<=0||info.size>10*1024*1024)return new Response('Media unavailable',{status:413});
  const headers:Record<string,string>={'Content-Type':type,'Accept-Ranges':'bytes','Cache-Control':'no-store'};let start=0,end=info.size-1;
  if(range){const match=/^bytes=(\d{0,15})-(\d{0,15})$/.exec(range);const invalid=()=>new Response('Invalid range',{status:416,headers:{'Content-Range':`bytes */${info.size}`}});
   if(!match||!match[1]&&!match[2])return invalid();
   if(!match[1]){const count=Number(match[2]);if(count<=0)return invalid();start=Math.max(0,info.size-count);}else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
   if(start>=info.size||end<start)return invalid();headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
  }
  const body=new Uint8Array(end-start+1);let offset=0;while(offset<body.length){const read=await file.read(body,offset,body.length-offset,start+offset);if(!read.bytesRead)throw new Error('MEDIA_CHANGED_DURING_READ');offset+=read.bytesRead;}
  const after=await file.stat();if(after.size!==info.size||after.mtimeMs!==info.mtimeMs||after.ctimeMs!==info.ctimeMs)throw new Error('MEDIA_CHANGED_DURING_READ');headers['Content-Length']=String(body.length);
  return new Response(body,{status:range?206:200,headers});
 }finally{await file.close();}
}
