import {build} from 'esbuild';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {validateAudioCatalog} from './audio-catalog.mjs';
await mkdir('test-results',{recursive:true});
await build({entryPoints:['packages/content/narration.ts'],outfile:'test-results/narration.cjs',platform:'node',format:'cjs',bundle:true});
const {narrationTexts}=await import('../test-results/narration.cjs');
const root='assets/learning/audio/',sha=value=>createHash('sha256').update(value).digest('hex');
const manifest=z.object({schemaVersion:z.literal(1),format:z.literal('ogg-opus'),entries:z.array(z.object({id:z.string().regex(/^[FL]\d{2}$/),locale:z.enum(['en','ru']),file:z.string().regex(/^[FL]\d{2}-(en|ru)\.ogg$/),textSha256:z.string().regex(/^[a-f0-9]{64}$/),sha256:z.string().regex(/^[a-f0-9]{64}$/),bytes:z.number().int().min(1000).max(10*1024*1024),durationSeconds:z.number().positive().max(3600),voice:z.enum(['Microsoft Irina Desktop','Microsoft Zira Desktop'])}).strict()).max(136)}).strict().parse(JSON.parse(await readFile(root+'manifest.json','utf8')));
const source=narrationTexts(),keys=new Set(),index=JSON.parse(await readFile(root+'index.json','utf8'));
if(manifest.entries.length!==source.length||source.length!==136)throw new Error('AUDIO_COVERAGE_MISSING');
validateAudioCatalog(manifest.entries,index);
for(const entry of manifest.entries){
 const key=entry.id+'-'+entry.locale;if(keys.has(key)||entry.file!==key+'.ogg')throw new Error('AUDIO_ID_INVALID');keys.add(key);
 const text=source.find(s=>s.id===entry.id&&s.locale===entry.locale);if(!text||sha(text.text)!==entry.textSha256)throw new Error('AUDIO_TEXT_CHANGED: '+key);
 if((await stat(root+entry.file)).size!==entry.bytes)throw new Error('AUDIO_SIZE_CHANGED: '+key);const bytes=await readFile(root+entry.file);
 if(bytes.subarray(0,4).toString()!=='OggS'||sha(bytes)!==entry.sha256)throw new Error('AUDIO_CONTENT_CHANGED: '+key);
 if(!index[entry.locale]?.includes(entry.id))throw new Error('AUDIO_INDEX_MISSING: '+key);
}
if(!Array.isArray(index.kk)||index.kk.length!==0)throw new Error('KAZAKH_AUDIO_UNVERIFIED');
const result={status:'PASS',recordings:keys.size,bytes:manifest.entries.reduce((n,e)=>n+e.bytes,0),sourceTextHashes:'MATCH',recordingHashes:'MATCH',languages:['en','ru'],kazakh:'NOT AVAILABLE',audibleHumanReview:'NOT RUN',notes:'Content consistency check, not a guarantee of pronunciation or accessible suitability.'};await writeFile('test-results/lesson-audio.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
