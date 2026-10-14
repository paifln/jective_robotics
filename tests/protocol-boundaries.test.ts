import {it,expect} from 'vitest';
import {ProtocolParser,FrameSchema} from '../packages/devices';
it('oversized split frames discard the complete line and recover at the next delimiter',()=>{
 const parser=new ProtocolParser();expect(parser.feed('x'.repeat(4097)).map(e=>e.text)).toEqual(['SERIAL_FRAME_TOO_LARGE']);
 expect(parser.feed('@JECTIVE {"v":1,"type":"challenge","nonce":7}')).toEqual([]);
 expect(parser.feed('\nvalid next line\n').map(e=>[e.kind,e.text])).toEqual([['raw','valid next line']]);
 parser.feed('x'.repeat(4097));parser.reset();expect(parser.feed('after reset\n')[0]!.text).toBe('after reset');
});
it('large batches retain valid bounded lines and report event truncation explicitly',()=>{
 const parser=new ProtocolParser();const events=parser.feed(('x'.repeat(100)+'\n').repeat(400));expect(events).toHaveLength(400);expect(events.every(e=>e.kind==='raw')).toBe(true);
 const flood=parser.feed('line\n'.repeat(2100));expect(flood).toHaveLength(2000);expect(flood.at(-1)!.text).toContain('SERIAL_EVENT_BATCH_LIMIT');
});
it('accepts a maximum-length CRLF line across chunk boundaries without retaining excess data',()=>{
 const parser=new ProtocolParser();expect(parser.feed('x'.repeat(4096)+'\r')).toEqual([]);const events=parser.feed('\nnext\n');expect(events[0]!.text).toHaveLength(4096);expect(events[1]!.text).toBe('next');
});
it('wire sequence fields are unsigned 32-bit and telemetry/identity fields are bounded',()=>{
 expect(FrameSchema.safeParse({v:1,type:'ack',seq:4294967295,commandId:'fixture'}).success).toBe(true);
 for(const seq of [-1,4294967296,1.5])expect(FrameSchema.safeParse({v:1,type:'ack',seq,commandId:'fixture'}).success).toBe(false);
 expect(FrameSchema.safeParse({v:1,type:'telemetry',seq:1,values:Object.fromEntries(Array.from({length:65},(_,i)=>['key'+i,i]))}).success).toBe(false);
 expect(FrameSchema.safeParse({v:1,type:'error',code:''}).success).toBe(false);
});
