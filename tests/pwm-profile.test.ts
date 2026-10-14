import {it,expect} from 'vitest';
import {resolveIndicatorPWM,indicatorPWMConfiguration,checkedPWMPercent,quantizePWM} from '../packages/profiles/pwm';
import {profileHash} from '../packages/profiles/registry';
import {profiles} from '../packages/profiles';
import type {Project} from '../packages/contracts';
const project=(profileId='esp32-devkit-reference'):Project=>({schemaVersion:1,id:crypto.randomUUID(),name:'PWM capability fixture',profileId,mode:'blocks',source:'',workspace:{},revision:0});
it('selects PWM only from the actual indicator GPIO and exposes boot/physical review limits',()=>{
 expect(resolveIndicatorPWM(project())).toEqual({gpio:2,frequencyHz:1000,resolutionBits:8,bootSensitive:true,physicalVerification:'NOT RUN'});expect(resolveIndicatorPWM(project('esp32c3-reference')).gpio).toBe(4);
 const wired={...project(),wiring:{led:4}};expect(resolveIndicatorPWM(wired).gpio).toBe(4);
});
it('rejects provisional, unassigned, reserved, input-only and non-PWM pin definitions',()=>{
 const provisional=profiles.find(p=>p.provisional)!;expect(()=>resolveIndicatorPWM(project(provisional.id))).toThrow('PWM_PROFILE_PROVISIONAL');
 const definition={...structuredClone(profiles[0]!),id:'test-pwm-board',version:'1.0.0',name:'Explicit test fixture',ledPin:null};
 const p:Project={...project(definition.id),profileDefinition:definition,profileVersion:definition.version,profileHash:profileHash(definition)};
 expect(()=>resolveIndicatorPWM(p)).toThrow('WIRING_UNASSIGNED');
 for(const pin of [undefined,{gpio:2,input:true,output:true,pwm:false,analog:false,reserved:false,bootSensitive:false},{gpio:2,input:true,output:false,pwm:false,analog:false,reserved:false,bootSensitive:false},{gpio:2,input:true,output:true,pwm:true,analog:false,reserved:true,bootSensitive:false}]){
  expect(()=>indicatorPWMConfiguration({...definition,pins:pin?[pin]:[]},2)).toThrow('PWM_PIN_CAPABILITY');
 }
});
it('quantizes a bounded sweep and rejects invalid duty and resolution instead of clamping',()=>{
 expect([0,25,50,75,100].map(value=>quantizePWM(value))).toEqual([0,64,128,191,255]);
 for(const bits of [1,8,16]){let previous=-1;for(let value=0;value<=100;value+=.5){const duty=quantizePWM(value,bits);expect(duty).toBeGreaterThanOrEqual(previous);expect(duty).toBeLessThanOrEqual(2**bits-1);previous=duty;}}
 expect(checkedPWMPercent(12.5)).toBe(12.5);for(const value of [-.1,100.1,Infinity,NaN])expect(()=>quantizePWM(value)).toThrow('PWM_RANGE');for(const bits of [0,17,1.5,NaN])expect(()=>quantizePWM(50,bits)).toThrow('PWM_RESOLUTION_RANGE');
});
