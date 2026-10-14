import {it,expect,vi} from 'vitest';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ToolchainService} from '../packages/toolchain';
// Actual local Node child processes exercise process control; no Arduino upload or serial access.
const command=(source:string)=>['-e',source,'--'];
async function fixture(fn:(service:ToolchainService)=>Promise<void>){const root=await mkdtemp(join(tmpdir(),'jective-process-'));const service=new ToolchainService(process.execPath,root);try{await fn(service);}finally{service.cancel();await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}}
it('real child stdout and stderr are captured, nonzero exit is preserved, and logs retain only their bounded tail',async()=>fixture(async service=>{
 const failed=await service.run(command('process.stdout.write("out");process.stderr.write("err");process.exitCode=7;'));expect(failed.stdout).toBe('out');expect(failed.stderr).toBe('err');expect(failed.code).toBe(7);expect(failed.log).toContain('out');expect(failed.log).toContain('err');expect(failed.interrupted).toBe(false);
 const large=await service.run(command('process.stdout.write("x".repeat(1100000)+"TAIL");'));expect(large.code).toBe(0);expect(large.log).toHaveLength(1000000);expect(large.log.endsWith('TAIL')).toBe(true);expect(service.cancel()).toBe(false);
}));
it('a running process rejects concurrent work, cancels and releases the lock for the next process',async()=>fixture(async service=>{
 const marker=join(service.root,'ready');const running=service.run(command('require("node:fs").writeFileSync('+JSON.stringify(marker)+',"ready");setInterval(()=>{},1000);'));await expect(service.run(command('process.exit(0)'))).rejects.toThrow('TOOLCHAIN_BUSY');await vi.waitFor(async()=>expect(await readFile(marker,'utf8')).toBe('ready'));expect(service.cancel()).toBe(true);const stopped=await running;expect(stopped.interrupted).toBe(true);expect(stopped.code).not.toBe(0);expect(service.cancel()).toBe(false);expect((await service.run(command('process.stdout.write("recovered")'))).log).toBe('recovered');
}));
it('timeout terminates a live child and subsequent commands still run',async()=>fixture(async service=>{
 const result=await service.run(command('setInterval(()=>{},1000);'),100);expect(result.interrupted).toBe(true);expect(result.code).not.toBe(0);expect((await service.run(command('process.exit(0)'))).code).toBe(0);
}));
it('preserves split UTF-8 independently for both real process pipes and Cyrillic diagnostic paths',async()=>fixture(async service=>{
 const path='C:\\Ученики\\Проект\\sketch.ino:2:3: ошибка';
 const script='(async()=>{const delay=()=>new Promise(r=>setTimeout(r,50));const out=Buffer.from("Ж"),err=Buffer.from("Қ");process.stdout.write(out.subarray(0,1));await delay();process.stderr.write(err.subarray(0,1));await delay();process.stdout.write(out.subarray(1));await delay();process.stderr.write(err.subarray(1));await delay();for(const byte of Buffer.from('+JSON.stringify('\n'+path)+')){process.stdout.write(Buffer.from([byte]));await new Promise(r=>setTimeout(r,3));}})().catch(()=>process.exitCode=1);';
 const result=await service.run(command(script));expect(result.code).toBe(0);expect(result.log).toBe('ЖҚ\n'+path);expect(result.log).not.toContain('\uFFFD');
 const incomplete=await service.run(command('process.stderr.write(Buffer.from([0xe2,0x82]));'));expect(incomplete.log).toBe('\uFFFD');
}));
it('bounded process tails never begin with half of a supplementary Unicode character',async()=>fixture(async service=>{
 const result=await service.run(command('process.stdout.write("😀"+"x".repeat(999999));'));
 expect(result.code).toBe(0);expect(result.log.length).toBe(999999);expect(/^x+$/.test(result.log)).toBe(true);
}));
it('configuration failure releases the busy lock and preserves the obstructing file',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-config-'));const obstructed=join(root,'obstructed');await writeFile(obstructed,'keep');const service=new ToolchainService(process.execPath,obstructed);try{await expect(service.run(command('process.exit(0)'))).rejects.toThrow();expect(await readFile(obstructed,'utf8')).toBe('keep');await rm(obstructed);expect((await service.run(command('process.exit(0)'))).code).toBe(0);}finally{await rm(root,{recursive:true,force:true});}
});
it('cancellation during configuration prevents launching the pending command',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-early-cancel-'));let release!:()=>void;const gate=new Promise<void>(done=>{release=done;});class PendingConfig extends ToolchainService {override async config(){await gate;return super.config();}}const service=new PendingConfig(process.execPath,root);const marker=join(root,'must-not-launch');try{const running=service.run(command('require("node:fs").writeFileSync('+JSON.stringify(marker)+',"launched");'));expect(service.cancel()).toBe(true);release();expect(await running).toEqual({code:null,log:'',stdout:'',stderr:'',interrupted:true});await expect(readFile(marker)).rejects.toThrow();expect((await service.run(command('process.exit(0)'))).code).toBe(0);}finally{release();service.cancel();await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});

it('preserves complete raw output beyond the UI tail and never overwrites an existing journal',async()=>fixture(async service=>{
 const path=join(service.root,'compiler.raw.log');
 const result=await service.run(command('process.stdout.write("BEGIN"+"x".repeat(1100000)+"END");'),5000,path);
 const raw=await readFile(path);expect(raw.length).toBe(1100008);expect(raw.subarray(0,5).toString()).toBe('BEGIN');expect(raw.subarray(-3).toString()).toBe('END');expect(result.log.length).toBe(1000000);
 await expect(service.run(command('process.exit(0)'),5000,path)).rejects.toThrow();expect((await readFile(path)).equals(raw)).toBe(true);
 expect((await service.run(command('process.exit(0)'))).code).toBe(0);
}));
it('fails and cancels excessive raw output instead of silently dropping bytes',async()=>fixture(async service=>{
 const path=join(service.root,'limit.raw.log');
 await expect(service.run(command('const b=Buffer.alloc(65536,120);(async()=>{for(let i=0;i<1050;i++){if(!process.stdout.write(b))await new Promise(r=>process.stdout.once("drain",r));}})();'),10000,path)).rejects.toThrow('PROCESS_LOG_LIMIT');
 expect((await readFile(path)).length).toBeLessThanOrEqual(64*1024*1024);expect(service.cancel()).toBe(false);expect((await service.run(command('process.exit(0)'))).code).toBe(0);
}));
it('preserves exact invalid UTF-8 bytes and closes its journal when the executable cannot start',async()=>fixture(async service=>{
 const path=join(service.root,'bytes.raw.log');await service.run(command('process.stdout.write(Buffer.from([0xe2,0x82]));'),5000,path);expect(await readFile(path)).toEqual(Buffer.from([0xe2,0x82]));
 const missing=new ToolchainService(join(service.root,'missing.exe'),service.root);const empty=join(service.root,'missing.raw.log');await expect(missing.run([],5000,empty)).rejects.toThrow('CLI_UNAVAILABLE');expect((await readFile(empty)).length).toBe(0);expect(missing.cancel()).toBe(false);
}));
it('explicit cancellation flushes a live child journal and allows the next journaled operation',async()=>fixture(async service=>{
 const path=join(service.root,'cancel.raw.log');
 const running=service.run(command('process.stdout.write("BEGIN"+"x".repeat(300000));setInterval(()=>{},1000);'),10000,path);
 await vi.waitFor(async()=>expect((await readFile(path)).length).toBe(300005));
 expect(service.cancel()).toBe(true);const result=await running;expect(result.interrupted).toBe(true);expect(result.code).not.toBe(0);
 const raw=await readFile(path);expect(raw.length).toBe(300005);expect(raw.subarray(0,5).toString()).toBe('BEGIN');expect(/^x+$/.test(raw.subarray(5).toString())).toBe(true);
 expect(service.cancel()).toBe(false);const nextPath=join(service.root,'next.raw.log');const next=await service.run(command('process.stdout.write("NEXT");'),5000,nextPath);expect(next.code).toBe(0);expect(await readFile(nextPath,'utf8')).toBe('NEXT');
}));
