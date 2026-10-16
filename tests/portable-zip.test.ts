import {describe,it,expect} from 'vitest';
import {crc32,deflateRawSync} from 'node:zlib';
import {zipSync,strToU8} from 'fflate';
import {readPortableZip,MAX_PORTABLE_ARCHIVE} from '../packages/persistence/portable-zip';

type Member={name:string;text:string;method?:number;descriptor?:'signed'|'unsigned';extra?:Buffer;comment?:Buffer};
function fixture(members:Member[]=[{name:'manifest.json',text:'{}'},{name:'content.json',text:'{"name":"Привет"}'}],comment=Buffer.alloc(0)){
 const parts:Buffer[]=[],records:Buffer[]=[];let offset=0;
 for(const member of members){
  const name=Buffer.from(member.name),data=Buffer.from(member.text),method=member.method??0,packed=method===8?deflateRawSync(data):data;
  const extra=member.extra??Buffer.alloc(0),note=member.comment??Buffer.alloc(0),checksum=crc32(data),flags=member.descriptor?8:0;
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(flags,6);local.writeUInt16LE(method,8);local.writeUInt16LE(name.length,26);local.writeUInt16LE(extra.length,28);
  if(!member.descriptor){local.writeUInt32LE(checksum,14);local.writeUInt32LE(packed.length,18);local.writeUInt32LE(data.length,22);}
  const descriptor=member.descriptor?Buffer.alloc(member.descriptor==='signed'?16:12):Buffer.alloc(0),skip=member.descriptor==='signed'?4:0;
  if(member.descriptor){if(skip)descriptor.writeUInt32LE(0x08074b50);descriptor.writeUInt32LE(checksum,skip);descriptor.writeUInt32LE(packed.length,skip+4);descriptor.writeUInt32LE(data.length,skip+8);}
  parts.push(local,name,extra,packed,descriptor);
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(flags,8);central.writeUInt16LE(method,10);central.writeUInt32LE(checksum,16);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(name.length,28);central.writeUInt16LE(extra.length,30);central.writeUInt16LE(note.length,32);central.writeUInt32LE(offset,42);records.push(central,name,extra,note);
  offset+=local.length+name.length+extra.length+packed.length+descriptor.length;
 }
 const directory=Buffer.concat(records),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(members.length,8);end.writeUInt16LE(members.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);end.writeUInt16LE(comment.length,20);
 return Buffer.concat([...parts,directory,end,comment]);
}
const directory=(bytes:Buffer)=>bytes.readUInt32LE(bytes.length-6);
const change=(mutate:(bytes:Buffer)=>void)=>{const bytes=fixture();mutate(bytes);return bytes;};

describe('bounded private ZIP container',()=>{
 it('reads existing fflate exports, stored and deflated content, comments and both data descriptors',()=>{
  const encoded=zipSync({'manifest.json':strToU8('{}'),'content.json':strToU8('Привет')});expect(Buffer.from(readPortableZip(encoded)['content.json']).toString()).toBe('Привет');
  for(const method of [0,8])for(const descriptor of [undefined,'signed','unsigned'] as const){
   const archive=fixture([{name:'manifest.json',text:'{}',method,descriptor,extra:Buffer.from([1,0,0,0]),comment:Buffer.from('member note')},{name:'content.json',text:'Привет 🌍',method,descriptor}],Buffer.from('archive note'));
   expect(Buffer.from(readPortableZip(archive)['content.json']).toString()).toBe('Привет 🌍');
  }
  expect(readPortableZip(fixture([{name:'content.json',text:''},{name:'manifest.json',text:'{}'}]))['content.json']).toHaveLength(0);
 });
 it('rejects empty, truncated, malformed and oversized containers',()=>{
  for(const bytes of [Buffer.alloc(0),Buffer.alloc(22),fixture().subarray(0,80),fixture().subarray(0,-1),fixture([]),fixture([{name:'manifest.json',text:'{}'}])])expect(()=>readPortableZip(bytes)).toThrow('ARCHIVE_FORMAT');
  expect(()=>readPortableZip(Buffer.alloc(MAX_PORTABLE_ARCHIVE+1))).toThrow('ARCHIVE_TOO_LARGE');
 });
 it('rejects unknown, duplicate, traversal and encrypted/split/unsupported entries before inflation',()=>{
  for(const members of [
   [{name:'manifest.json',text:'{}'},{name:'../content.json',text:'{}'}],
   [{name:'manifest.json',text:'{}'},{name:'manifest.json',text:'{}'}],
   [{name:'manifest.json',text:'{}'},{name:'content.json',text:'{}'},{name:'extra',text:'x'}]
  ])expect(()=>readPortableZip(fixture(members))).toThrow('ARCHIVE_UNSAFE');
  for(const mutate of [
   (b:Buffer)=>b.writeUInt16LE(1,b.length-18),
   (b:Buffer)=>b.writeUInt16LE(1,b.length-16),
   (b:Buffer)=>b.writeUInt16LE(1,b.length-14),
   (b:Buffer)=>b.writeUInt16LE(1,directory(b)+8),
   (b:Buffer)=>b.writeUInt16LE(99,directory(b)+10),
   (b:Buffer)=>b.writeUInt16LE(1,directory(b)+34),
   (b:Buffer)=>b.writeUInt32LE(0xffffffff,directory(b)+20),
   (b:Buffer)=>b.writeUInt32LE(17*1024*1024,directory(b)+24)
  ])expect(()=>readPortableZip(change(mutate))).toThrow('ARCHIVE_UNSAFE');
 });
 it('rejects damaged directory records, local headers, names, lengths, offsets and actual CRCs',()=>{
  for(const mutate of [
   (b:Buffer)=>b.writeUInt32LE(0,b.length-10),
   (b:Buffer)=>b.writeUInt32LE(0,directory(b)),
   (b:Buffer)=>b.writeUInt16LE(0xffff,directory(b)+28),
   (b:Buffer)=>b.writeUInt32LE(1,directory(b)+42),
   (b:Buffer)=>b.writeUInt32LE(0,0),
   (b:Buffer)=>b.writeUInt16LE(8,6),
   (b:Buffer)=>b.writeUInt16LE(8,8),
   (b:Buffer)=>b.writeUInt16LE(12,26),
   (b:Buffer)=>b.writeUInt16LE(0xffff,28),
   (b:Buffer)=>{b[30]=120;},
   (b:Buffer)=>b.writeUInt32LE(0,14),
   (b:Buffer)=>b.writeUInt32LE(0,18),
   (b:Buffer)=>b.writeUInt32LE(0,22),
   (b:Buffer)=>{b[43]=33;}
  ])expect(()=>readPortableZip(change(mutate))).toThrow('ARCHIVE_UNSAFE');
 });
 it('rejects forged deflate output lengths instead of truncating decompression to attacker metadata',()=>{
  const archive=fixture([{name:'manifest.json',text:'{}',method:8},{name:'content.json',text:'x'.repeat(4*1024*1024),method:8}]);
  const first=directory(archive),second=first+46+13,offset=archive.readUInt32LE(second+42);
  archive.writeUInt32LE(1,offset+22);archive.writeUInt32LE(1,second+24);
  expect(()=>readPortableZip(archive)).toThrow('ARCHIVE_UNSAFE');
 });
 it('rejects truncated or corrupted deflate streams and data descriptors',()=>{
  const compressed=fixture([{name:'manifest.json',text:'{}',method:8},{name:'content.json',text:'{}',method:8}]);compressed.fill(255,43,47);expect(()=>readPortableZip(compressed)).toThrow('ARCHIVE_UNSAFE');
  const signed=fixture([{name:'manifest.json',text:'{}',descriptor:'signed'},{name:'content.json',text:'{}'}]);signed.writeUInt32LE(0,49);expect(()=>readPortableZip(signed)).toThrow('ARCHIVE_UNSAFE');
  const unsigned=fixture([{name:'manifest.json',text:'{}',descriptor:'unsigned'},{name:'content.json',text:'{}'}]);unsigned.writeUInt32LE(3,51);expect(()=>readPortableZip(unsigned)).toThrow('ARCHIVE_UNSAFE');
 });
});
