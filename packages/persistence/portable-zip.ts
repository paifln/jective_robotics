import {crc32,inflateRawSync} from 'node:zlib';

export const MAX_PORTABLE_ARCHIVE=8*1024*1024;
const MAX_UNPACKED=16*1024*1024;
const names=new Set(['manifest.json','content.json']);
type Entry={name:string;flags:number;method:number;checksum:number;packed:number;original:number;offset:number};
type PortableFiles={'manifest.json':Uint8Array;'content.json':Uint8Array};

function unsafe():never{throw new Error('ARCHIVE_UNSAFE');}

/** Private, two-file ZIP format. No extraction, ZIP64, encryption or split volumes. */
export function readPortableZip(input:Uint8Array):PortableFiles{
 if(input.length>MAX_PORTABLE_ARCHIVE)throw new Error('ARCHIVE_TOO_LARGE');
 if(input.length<22)throw new Error('ARCHIVE_FORMAT');
 const bytes=Buffer.from(input.buffer,input.byteOffset,input.byteLength);
 const range=(offset:number,length:number)=>{if(offset<0||length<0||offset+length>bytes.length)unsafe();};
 const u16=(offset:number)=>{range(offset,2);return bytes.readUInt16LE(offset);};
 const u32=(offset:number)=>{range(offset,4);return bytes.readUInt32LE(offset);};
 let end=bytes.length-22;
 for(;end>=Math.max(0,bytes.length-65557);end--){
  if(u32(end)===0x06054b50&&end+22+u16(end+20)===bytes.length)break;
 }
 if(end<Math.max(0,bytes.length-65557))throw new Error('ARCHIVE_FORMAT');
 const count=u16(end+10),directorySize=u32(end+12),directoryOffset=u32(end+16);
 if(u16(end+4)!==0||u16(end+6)!==0||u16(end+8)!==count||count>2)unsafe();
 if(count!==2)throw new Error('ARCHIVE_FORMAT');
 if(directoryOffset+directorySize!==end)unsafe();
 range(directoryOffset,directorySize);
 const entries:Entry[]=[],seen=new Set<string>();let cursor=directoryOffset,total=0;
 for(let index=0;index<count;index++){
  range(cursor,46);if(u32(cursor)!==0x02014b50)unsafe();
  const flags=u16(cursor+8),method=u16(cursor+10),checksum=u32(cursor+16),packed=u32(cursor+20),original=u32(cursor+24);
  const nameLength=u16(cursor+28),extraLength=u16(cursor+30),commentLength=u16(cursor+32),offset=u32(cursor+42);
  const next=cursor+46+nameLength+extraLength+commentLength;
  if(next>directoryOffset+directorySize||u16(cursor+34)!==0||flags&~0x080e||![0,8].includes(method))unsafe();
  const name=bytes.subarray(cursor+46,cursor+46+nameLength).toString('utf8');
  if(!names.has(name)||seen.has(name)||nameLength!==name.length||packed>MAX_PORTABLE_ARCHIVE||original>MAX_UNPACKED)unsafe();
  seen.add(name);total+=original;if(total>MAX_UNPACKED)unsafe();
  entries.push({name,flags,method,checksum,packed,original,offset});cursor=next;
 }
 if(cursor!==end)unsafe();
 entries.sort((left,right)=>left.offset-right.offset);
 const result:Record<string,Uint8Array>={};let previousEnd=0;
 for(const [index,entry]of entries.entries()){
  const offset=entry.offset;range(offset,30);
  if(offset!==previousEnd||u32(offset)!==0x04034b50||u16(offset+6)!==entry.flags||u16(offset+8)!==entry.method)unsafe();
  const nameLength=u16(offset+26),extraLength=u16(offset+28),start=offset+30+nameLength+extraLength;
  if(nameLength!==entry.name.length||bytes.subarray(offset+30,offset+30+nameLength).toString('utf8')!==entry.name||start+entry.packed>directoryOffset)unsafe();
  for(const [field,expected]of [[14,entry.checksum],[18,entry.packed],[22,entry.original]] as const){
   const value=u32(offset+field);if(value!==expected&&(!(entry.flags&8)||value!==0))unsafe();
  }
  let end=start+entry.packed;
  if(entry.flags&8){
   const boundary=entries[index+1]?.offset??directoryOffset;
   // CRC can itself equal the optional descriptor signature. Use its exact span.
   if(boundary-end===16&&u32(end)===0x08074b50)end+=4;
   else if(boundary-end!==12)unsafe();
   if(u32(end)!==entry.checksum||u32(end+4)!==entry.packed||u32(end+8)!==entry.original)unsafe();
   end+=12;
  }
  if(end>directoryOffset)unsafe();
  const packed=bytes.subarray(start,start+entry.packed);let content:Uint8Array;
  try{content=entry.method===0?packed:inflateRawSync(packed,{maxOutputLength:Math.max(1,entry.original)});}catch{unsafe();}
  // The declared length is never authority to silently truncate the actual output.
  if(content.length!==entry.original||crc32(content)!==entry.checksum)unsafe();
  result[entry.name]=content;previousEnd=end;
 }
 if(previousEnd!==directoryOffset)unsafe();
 // Exactly two unique allowlisted names were checked before decompression.
 return result as PortableFiles;
}
