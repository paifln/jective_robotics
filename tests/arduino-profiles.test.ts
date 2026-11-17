import {it,expect} from 'vitest';
import {resolveProfile,ProfileSchema,validateWiring} from '../packages/profiles';
import {validateImportedProfile} from '../packages/profiles/exchange';

it('Uno and both Nano bootloaders select AVR at 9600 and preserve the supplied DRV8833 wiring',()=>{
 for(const id of ['arduino-uno','arduino-nano','arduino-nano-old']){
  const profile=resolveProfile(id);
  expect(profile).toMatchObject({core:'arduino:avr',coreVersion:'1.8.8',voltage:5,baudRate:9600,ledPin:13});
  expect(validateImportedProfile(profile)).toEqual(profile);
  expect(validateWiring(profile,'motor-dual-input',{leftForward:5,leftReverse:6,rightForward:9,rightReverse:10})).toEqual([]);
  expect(validateWiring(profile,'motor-dual-input',{leftForward:4,leftReverse:6,rightForward:9,rightReverse:10})).toContainEqual(expect.objectContaining({code:'PIN_CAPABILITY',role:'leftForward'}));
  expect(validateWiring(profile,'indicator',{led:1})).toContainEqual(expect.objectContaining({code:'PIN_RESERVED'}));
 }
 expect(resolveProfile('arduino-uno').fqbn).toBe('arduino:avr:uno');
 expect(resolveProfile('arduino-nano').fqbn).toBe('arduino:avr:nano:cpu=atmega328');
 expect(resolveProfile('arduino-nano-old').fqbn).toBe('arduino:avr:nano:cpu=atmega328old');
 expect(resolveProfile('arduino-uno').pins).toHaveLength(20);
 expect(resolveProfile('arduino-nano').pins.filter(pin=>pin.gpio>=20).every(pin=>pin.analog&&!pin.output&&!pin.pwm)).toBe(true);
});

it('profile imports reject a mismatched toolchain, voltage and out-of-range AVR pin',()=>{
 const uno=resolveProfile('arduino-uno');
 expect(()=>ProfileSchema.parse({...uno,core:'esp32:esp32'})).toThrow('PROFILE_CORE_MISMATCH');
 expect(()=>ProfileSchema.parse({...uno,voltage:3.3})).toThrow('PROFILE_VOLTAGE_MISMATCH');
 expect(()=>validateImportedProfile({...uno,pins:[...uno.pins,{...uno.pins[2]!,gpio:20}]})).toThrow('PROFILE_PIN_RANGE');
});
