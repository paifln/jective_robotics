import {it,expect} from 'vitest';
import {zipSync,strToU8} from 'fflate';
import {parseJsonDocument} from '../packages/contracts/json-document';
import {decodeArchive} from '../packages/persistence/archives';
it('preserves Unicode and permits UTF-8 BOM but rejects invalid encoded bytes and malformed JSON without echoing content',()=>{
 expect(parseJsonDocument(Buffer.from('{"text":"Қазақша русский 🌍"}'),'TEST_INVALID')).toEqual({text:'Қазақша русский 🌍'});
 expect(parseJsonDocument(Buffer.concat([Buffer.from([239,187,191]),Buffer.from('{}')]),'TEST_INVALID')).toEqual({});
 for(const bytes of [Buffer.from([123,34,120,34,58,34,255,34,125]),Buffer.from('{private invalid fixture')])expect(()=>parseJsonDocument(bytes,'TEST_INVALID')).toThrow('TEST_INVALID');
 const invalid=Buffer.from([123,34,120,34,58,34,255,34,125]);expect(()=>decodeArchive(zipSync({'manifest.json':strToU8('{"format":"jective","version":1,"kind":"project"}'),'content.json':invalid}))).toThrow('ARCHIVE_FORMAT');
});
