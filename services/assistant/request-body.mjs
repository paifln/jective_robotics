export class RequestBodyError extends Error{
 constructor(status){super('Invalid request body');this.status=status;}
}

/** The deadline includes body upload, not just the subsequent provider request. */
export function readJsonBody(request,signal,maxBytes=200000){
 return new Promise((resolve,reject)=>{
  const chunks=[];let size=0,settled=false;
  const cleanup=()=>{
   request.off('data',data);request.off('end',end);request.off('error',error);request.off('aborted',aborted);signal.removeEventListener('abort',abort);
  };
  const finish=(reason,value)=>{if(settled)return;settled=true;cleanup();if(reason){request.pause();reject(reason);}else resolve(value);};
  const data=chunk=>{size+=chunk.length;if(size>maxBytes)finish(new RequestBodyError(413));else chunks.push(chunk);};
  const end=()=>{try{finish(null,JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{finish(new RequestBodyError(400));}};
  const error=()=>finish(new RequestBodyError(400));
  const aborted=()=>finish(new RequestBodyError(400));
  const abort=()=>finish(new RequestBodyError(504));
  request.on('data',data);request.once('end',end);request.once('error',error);request.once('aborted',aborted);signal.addEventListener('abort',abort,{once:true});
  if(signal.aborted)abort();
 });
}
