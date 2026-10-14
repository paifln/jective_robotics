import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateAudioCatalog} from '../scripts/audio-catalog.mjs';

test('audio index rejects advertised missing files, duplicate IDs, wrong language voice and unsupported locales',()=>{
 const entries=[{id:'F01',locale:'en',voice:'Microsoft Zira Desktop'},{id:'F01',locale:'ru',voice:'Microsoft Irina Desktop'}];
 const index={en:['F01'],ru:['F01'],kk:[]};
 assert.deepEqual(validateAudioCatalog(entries,index),index);
 for(const bad of [{...index,en:['F01','F02']},{...index,en:['F01','F01']},{...index,ru:[]},{...index,kk:['F01']},{...index,de:[]}])assert.throws(()=>validateAudioCatalog(entries,bad));
 assert.throws(()=>validateAudioCatalog([{...entries[0],voice:'Microsoft Irina Desktop'},entries[1]],index),/VOICE_LANGUAGE_MISMATCH/);
 assert.throws(()=>validateAudioCatalog([entries[0],{...entries[1],voice:'Microsoft Zira Desktop'}],index),/VOICE_LANGUAGE_MISMATCH/);
});
