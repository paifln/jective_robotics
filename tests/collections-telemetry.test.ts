import {it,expect} from 'vitest';
import {collectionMessage,parseSample,collectionsArtifact} from '../packages/content/collections-telemetry';
import {ProtocolParser,FrameSchema} from '../packages/devices';
it('keeps zero distinct from missing and rejects malformed counts without coercion',()=>{
 expect(parseSample('0')).toEqual({value:0,status:'valid'});expect(parseSample('4095')).toEqual({value:4095,status:'valid'});expect(parseSample(' 12\t')).toEqual({value:12,status:'valid'});
 for(const token of ['?','',' \t'])expect(parseSample(token)).toEqual({value:null,status:'missing'});
 for(const token of ['4096','-1','12.5','1e3','NaN','null','00000','１２','1\n',' '.repeat(17),'0'.repeat(17)])expect(parseSample(token)).toEqual({value:null,status:'malformed'});
});
it('preserves ordering in an eight-slot window and counts overwritten entries',()=>{
 const r=collectionMessage('11,12,0,?,bad,4095,5,6,7,8');expect(r.count).toBe(8);expect(r.dropped).toBe(2);expect(r.samples.map(s=>s.value)).toEqual([0,null,null,4095,5,6,7,8]);expect(r.samples.map(s=>s.status)).toEqual(['valid','missing','malformed','valid','valid','valid','valid','valid']);expect(r.origin).toBe('lesson-input');expect(collectionMessage('').samples).toEqual([]);expect(collectionMessage(',').samples.map(s=>s.status)).toEqual(['missing','missing']);
 const full=collectionMessage(Array.from({length:64},(_,i)=>String(i)).join(','));expect(full.count).toBe(8);expect(full.dropped).toBe(56);expect(full.samples[0]?.value).toBe(56);
});
it('bounds input and exposes a meaningful compiling logical-error task',()=>{
 for(const value of [null,{},'1,'.repeat(64),'0'.repeat(2049)])expect(()=>collectionMessage(value)).toThrow();
 expect(collectionsArtifact.starter).toContain('if(sample.value==0)');expect(collectionsArtifact.reference).not.toContain('if(sample.value==0)');expect(collectionsArtifact.reference).toContain('budget=32');expect(collectionsArtifact.reference).toContain('char message[512]');expect(collectionsArtifact.reference).not.toContain('analogRead(');
});
it('keeps manual lesson JSON out of the hardware protocol path',()=>{
 const message=JSON.stringify(collectionMessage('0,?,bad'));expect(FrameSchema.safeParse(JSON.parse(message)).success).toBe(false);const parser=new ProtocolParser();expect(parser.feed(message+'\n')).toMatchObject([{kind:'raw',text:message}]);expect(parser.feed('@JECTIVE '+message+'\n')).toMatchObject([{kind:'error'}]);
});
