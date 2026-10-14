import {appendFile,mkdir,rename,stat,rm} from 'node:fs/promises';
import {dirname} from 'node:path';
export function safeErrorCode(error:unknown){const code=error instanceof Error?error.message.split(':')[0]:'';return code&&/^[A-Z][A-Z0-9_]{1,79}$/.test(code)?code:'OPERATION_FAILED';}
// Deliberately accepts metadata only: never questions, source code, paths or API keys.
export class OperationLog{
 private pending:Promise<void>=Promise.resolve();
 constructor(readonly path:string,readonly limit=512*1024){}
 record(event:string,code:string){const row=JSON.stringify({time:new Date().toISOString(),event:/^[a-z][a-z0-9:._-]{0,79}$/.test(event)?event:'application',code:/^[A-Z][A-Z0-9_]{1,79}$/.test(code)?code:'OPERATION_FAILED'})+'\n';this.pending=this.pending.then(async()=>{await mkdir(dirname(this.path),{recursive:true});try{if((await stat(this.path)).size+Buffer.byteLength(row)>this.limit){await rm(this.path+'.previous',{force:true});await rename(this.path,this.path+'.previous');}}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}await appendFile(this.path,row,{encoding:'utf8',mode:0o600});}).catch(()=>{/* Logging must not stop saving or hardware cleanup. */});}
 flush(){return this.pending;}
}
