import {z} from 'zod';
import {ProfileSchema,type BoardProfile} from './index';
const envelope=z.object({format:z.literal('jective-board-profile'),formatVersion:z.literal(1),profile:ProfileSchema}).strict();
const MAX_BYTES=128*1024;
export function validateImportedProfile(value:unknown):BoardProfile {
 const p=ProfileSchema.parse(value);
 if(!/^[a-z][a-z0-9-]{0,79}$/.test(p.id))throw new Error('PROFILE_ID_INVALID');
 if(!/^\d+\.\d+\.\d+$/.test(p.version)||!/^\d+\.\d+\.\d+$/.test(p.coreVersion))throw new Error('PROFILE_VERSION_INVALID');
 if(!p.name.trim()||p.name.length>100||!p.provenance.trim()||p.provenance.length>4000)throw new Error('PROFILE_DESCRIPTION_INVALID');
 if(![9600,19200,38400,57600,115200,230400,460800,921600].includes(p.baudRate))throw new Error('PROFILE_BAUD_UNSUPPORTED');
 const limit=p.core==='arduino:avr'?(p.fqbn==='arduino:avr:uno'?19:21):p.fqbn==='esp32:esp32:esp32c3'?21:39;const seen=new Set<number>();
 for(const pin of p.pins){if(pin.gpio>limit)throw new Error('PROFILE_PIN_RANGE');if(seen.has(pin.gpio))throw new Error('PROFILE_PIN_DUPLICATE');seen.add(pin.gpio);if((pin.pwm&&!pin.output)||(pin.analog&&!pin.input))throw new Error('PROFILE_PIN_CAPABILITY');}
 if(p.provisional&&p.ledPin!==null)throw new Error('PROFILE_PROVISIONAL_LED');
 if(p.ledPin!==null){const led=p.pins.find(pin=>pin.gpio===p.ledPin);if(!led||!led.output||led.reserved)throw new Error('PROFILE_LED_INVALID');}
 return p;
}
export function decodeProfile(text:string):BoardProfile {
 if(new TextEncoder().encode(text).byteLength>MAX_BYTES)throw new Error('PROFILE_FILE_TOO_LARGE');
 return validateImportedProfile(envelope.parse(JSON.parse(text)).profile);
}
export function encodeProfile(profile:BoardProfile):string {
 const text=JSON.stringify({format:'jective-board-profile',formatVersion:1,profile:validateImportedProfile(profile)},null,2);
 if(new TextEncoder().encode(text).byteLength>MAX_BYTES)throw new Error('PROFILE_FILE_TOO_LARGE');return text;
}
