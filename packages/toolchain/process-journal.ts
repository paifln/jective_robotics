import {createWriteStream,type WriteStream} from 'node:fs';
import {finished} from 'node:stream/promises';
import {once} from 'node:events';

// Raw compiler bytes stay on disk; pipe backpressure bounds queued memory.
// Hitting the disk quota fails the operation rather than silently losing output.
export class ProcessJournal {
 private bytes=0;
 private failure:Error|undefined;
 private completion:Promise<void>;
 private constructor(private stream:WriteStream,private stop:()=>void,private limit:number){
  this.completion=finished(stream).catch(error=>{this.failure??=error;});
  stream.on('error',()=>this.stop());
 }
 static async open(path:string,stop:()=>void,limit=64*1024*1024){
  const stream=createWriteStream(path,{flags:'wx',mode:0o600,highWaterMark:64*1024});
  const journal=new ProcessJournal(stream,stop,limit);
  try{await once(stream,'open');return journal;}catch(error){await journal.completion;throw error;}
 }
 write(chunk:Buffer,pause:()=>void,resume:()=>void){
  if(this.failure)return;
  if(this.bytes+chunk.length>this.limit){this.failure=new Error('PROCESS_LOG_LIMIT: raw output exceeded '+this.limit+' bytes');this.stop();return;}
  this.bytes+=chunk.length;
  if(!this.stream.write(chunk)){pause();this.stream.once('drain',resume);}
 }
 async close(){this.stream.end();await this.completion;if(this.failure)throw this.failure;}
}
