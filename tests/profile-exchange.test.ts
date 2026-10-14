import {it,expect} from 'vitest';
import {profiles} from '../packages/profiles';
import {encodeProfile,decodeProfile,validateImportedProfile} from '../packages/profiles/exchange';
it('profile exchange round trips all reference and unassigned profiles without changing the registry',()=>{
 const before=JSON.stringify(profiles);for(const p of profiles)expect(decodeProfile(encodeProfile(p))).toEqual(p);expect(JSON.stringify(profiles)).toBe(before);expect(decodeProfile(encodeProfile({...profiles[0]!,id:'custom-controller',name:'Қазақша плата'})).name).toBe('Қазақша плата');
});
it('import rejects unsupported envelopes, excessive bytes and invalid JSON',()=>{
 for(const text of ['{bad','{}',JSON.stringify({format:'jective-board-profile',formatVersion:2,profile:profiles[0]}),JSON.stringify({format:'jective-board-profile',formatVersion:1,profile:profiles[0],extra:true})])expect(()=>decodeProfile(text)).toThrow();expect(()=>decodeProfile(' '.repeat(128*1024+1))).toThrow('PROFILE_FILE_TOO_LARGE');
});
it('import refuses ambiguous pins, unusable indicator mappings and invalid metadata',()=>{
 const p=profiles[0]!;const pin=p.pins[0]!;const cases:[unknown,string][]=[
 [{...p,id:'../escape'},'PROFILE_ID_INVALID'],[{...p,version:'latest'},'PROFILE_VERSION_INVALID'],[{...p,coreVersion:'latest'},'PROFILE_VERSION_INVALID'],[{...p,name:' '},'PROFILE_DESCRIPTION_INVALID'],[{...p,provenance:''},'PROFILE_DESCRIPTION_INVALID'],[{...p,baudRate:123},'PROFILE_BAUD_UNSUPPORTED'],[{...p,pins:[pin,pin]},'PROFILE_PIN_DUPLICATE'],[{...p,pins:[{...pin,gpio:40}]},'PROFILE_PIN_RANGE'],[{...p,pins:[{...pin,output:false,pwm:true}]},'PROFILE_PIN_CAPABILITY'],[{...p,pins:[{...pin,input:false,analog:true}]},'PROFILE_PIN_CAPABILITY'],[{...p,provisional:true},'PROFILE_PROVISIONAL_LED'],[{...p,ledPin:48},'PROFILE_LED_INVALID'],[{...p,pins:p.pins.map(x=>x.gpio===2?{...x,reserved:true}:x)},'PROFILE_LED_INVALID'],[{...p,pins:p.pins.map(x=>x.gpio===2?{...x,output:false,pwm:false}:x)},'PROFILE_LED_INVALID'],[{...profiles[2]!,pins:[{...pin,gpio:22}]},'PROFILE_PIN_RANGE']
 ];for(const [value,code] of cases)expect(()=>validateImportedProfile(value),code).toThrow(code);
});
