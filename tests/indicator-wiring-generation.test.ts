import {it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import type {Project} from '../packages/contracts';
import {indicatorPin} from '../packages/profiles/project';
import {generate} from '../packages/codegen';
import {ToolchainService} from '../packages/toolchain';
const p:Project={schemaVersion:1,id:randomUUID(),name:'Indicator mapping',profileId:'esp32-devkit-reference',mode:'blocks',source:'void setup(){} void loop(){}',workspace:{},revision:0};
it('explicit indicator wiring controls generated GPIO while unspecified wiring keeps the reference default',()=>{
 expect(indicatorPin(p)).toBe(2);expect(indicatorPin({...p,wiring:{}})).toBe(2);expect(indicatorPin({...p,wiring:{led:null}})).toBeNull();const pin=indicatorPin({...p,wiring:{led:4}});expect(pin).toBe(4);expect(generate({setup:[],loop:[{kind:'led',on:true},{kind:'wait',ms:100}]},pin)).toContain('digitalWrite(4, HIGH)');expect(()=>generate({setup:[],loop:[{kind:'led',on:true}]},indicatorPin({...p,wiring:{led:null}}))).toThrow('WIRING_UNASSIGNED');
});
it('invalid indicator wiring refuses generation and compile before any CLI runs',async()=>{
 const cases:[Record<string,number|null>,string][]=[[{led:34},'PIN_CAPABILITY'],[{led:1},'PIN_RESERVED'],[{led:48},'PIN_UNKNOWN'],[{led:4,button:4},'PIN_CONFLICT']];for(const [wiring,error] of cases){const project={...p,wiring};expect(()=>indicatorPin(project)).toThrow(error);await expect(new ToolchainService('NOT_INVOKED','test-results/unused-indicator-map').compile(project)).rejects.toThrow(error);}
 expect(()=>indicatorPin({...p,profileId:'jective-prototype',wiring:{led:4}})).toThrow('BOARD_PROVISIONAL');
});
