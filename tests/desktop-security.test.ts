import {it,expect} from 'vitest';
import {join,resolve} from 'node:path';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {studioAsset,trustedStudioDocument} from '../apps/desktop/infrastructure/security';
import {OperationLog,safeErrorCode} from '../apps/desktop/infrastructure/operation-log';
it('local asset resolver rejects malformed URLs, traversal, ADS and non-assets while admitting offline photos and workers',()=>{
 const root=resolve('dist/renderer');for(const path of ['index.html','robot.worker.js','learning/esp32-board.jpg','fonts/Manrope.ttf'])expect(studioAsset(root,'jective://studio/'+path)).toBe(join(root,path));
 for(const url of ['https://studio/index.html','jective://evil/index.html','jective://u:p@studio/index.html','jective://studio:77/index.html','jective://studio/%2e%2e%2fsecret.json','jective://studio/%5c..%5csecret.json','jective://studio/%00.png','jective://studio/a.jpg:payload','jective://studio/.env','jective://studio/a.exe','jective://studio/%ZZ'])expect(studioAsset(root,url)).toBeNull();expect(studioAsset(root,'jective://studio/index.html','POST')).toBeNull();
 expect(trustedStudioDocument('jective://studio/index.html#L01-explanation')).toBe(true);for(const url of ['jective://studio/other.html','jective://studio/index.html?from=remote','https://studio/index.html','jective://user@studio/index.html','garbage'])expect(trustedStudioDocument(url)).toBe(false);
});
it('structured logs rotate, serialize concurrent writes and do not copy secret-bearing error text',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-safe-log-'));try{const path=join(root,'events.jsonl'),logger=new OperationLog(path,1024);await writeFile(path,'x'.repeat(1024));logger.record('assistant:ask',safeErrorCode(new Error('Bearer secret-do-not-record')));logger.record('device:upload',safeErrorCode(new Error('PORT_NOT_FOUND: private COM detail')));await logger.flush();const text=await readFile(path,'utf8'),rows=text.trim().split('\n').map(s=>JSON.parse(s));expect(rows.map(r=>r.code)).toEqual(['OPERATION_FAILED','PORT_NOT_FOUND']);expect(text).not.toContain('secret');expect(text).not.toContain('private');expect((await readFile(path+'.previous','utf8')).length).toBe(1024);}finally{await rm(root,{recursive:true,force:true});}
});
