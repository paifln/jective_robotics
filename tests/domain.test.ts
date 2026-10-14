import {describe,it,expect} from 'vitest';
import {generate,validateProgram} from '../packages/codegen';
import {ProjectSchema} from '../packages/contracts';
import {resolveProfile,ProfileSchema} from '../packages/profiles';
describe('indicator generation',()=>{
 it('deterministically lowers setup and loop with UTF-8 byte-safe text',()=>{const p={setup:[{kind:'print' as const,text:'"hello"\nҚ 🤖\x1b'}],loop:[{kind:'led' as const,on:true},{kind:'wait' as const,ms:500}]};const s=generate(p,2);expect(s).toContain('digitalWrite(2, HIGH)');expect(s).toContain('delay(500)');expect(s).toContain('\\322\\232');expect(s).toContain('\\360\\237\\244\\226');expect(s).toContain('\\033');expect(generate(p,2)).toBe(s);});
 it('rejects unknown wiring and invalid durations',()=>{expect(()=>generate({setup:[],loop:[{kind:'led',on:false}]},null)).toThrow('WIRING_UNASSIGNED');for(const ms of [-1,NaN,60001,1.5])expect(()=>validateProgram({setup:[],loop:[{kind:'wait',ms}]})).toThrow('WAIT_RANGE');});
 it('rejects excessive programs and null serial text',()=>{expect(()=>generate({setup:[],loop:Array.from({length:1001},()=>({kind:'wait' as const,ms:1}))},2)).toThrow('PROGRAM_LIMIT');expect(()=>generate({setup:[{kind:'print',text:'\0'}],loop:[]},2)).toThrow('TEXT_RANGE');});
});
it('profiles preserve provisional status and reject executable attributes',()=>{expect(resolveProfile('jective-prototype').ledPin).toBeNull();expect(()=>resolveProfile('unknown')).toThrow('PROFILE_UNKNOWN');expect(ProfileSchema.safeParse({...resolveProfile('esp32-devkit-reference'),script:'evil'}).success).toBe(false);});
it('rejects malformed imported project',()=>{expect(ProjectSchema.safeParse({schemaVersion:999}).success).toBe(false);});
