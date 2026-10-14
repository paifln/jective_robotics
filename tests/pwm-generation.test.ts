import {it,expect} from 'vitest';
import {generate} from '../packages/codegen';
import {generateForProject} from '../packages/codegen/project';
import type {FunctionProgram} from '../packages/codegen/functions';
import type {Project} from '../packages/contracts';
const project:Project={schemaVersion:1,id:crypto.randomUUID(),name:'PWM code fixture',profileId:'esp32-devkit-reference',mode:'blocks',source:'',workspace:{},revision:0};
const pwm={kind:'pwm' as const,value:{kind:'number' as const,value:25}};
it('generates ESP32 pin-based LEDC with bounded duty and binary indicator consistency',()=>{
 const source=generateForProject({setup:[pwm,{kind:'led',on:true},{kind:'led',on:false}],loop:[]},project);
 expect(source).toContain('ledcAttach(2, 1000, 8)');expect(source).toContain('ledcWrite(2, duty)');expect(source).toContain('floor(percent * 255.0 / 100.0 + 0.5)');expect(source).toContain('if (!j_pwm(25.0)) return;');expect(source).toContain('if (!j_pwm(100)) return;');expect(source).toContain('if (!j_pwm(0)) return;');expect(source).not.toContain('digitalWrite');expect(source).toContain('PWM_RANGE');expect(source).toContain('PWM_ATTACH_FAILED');expect(source).toContain('PWM_WRITE_FAILED');
 expect(generateForProject({setup:[pwm],loop:[]},{...project,profileId:'esp32c3-reference'})).toContain('ledcAttach(4, 1000, 8)');
 expect(generateForProject({setup:[pwm],loop:[]},{...project,wiring:{led:4}})).toContain('ledcAttach(4, 1000, 8)');
 expect(generateForProject({setup:[{kind:'led',on:true}],loop:[]},project)).toContain('digitalWrite(2, HIGH)');
});
it('finds PWM in unused functions and nested bodies while rejecting unsupported hardware configurations',()=>{
 const program:FunctionProgram={setup:[{kind:'call',name:'brightness',arguments:[{kind:'number',value:12.5}]}],loop:[],functions:[{name:'brightness',parameters:['percent'],body:[{kind:'if',condition:{kind:'number',value:1},then:[{kind:'repeat',count:1,body:[{kind:'while',condition:{kind:'number',value:0},maxIterations:1,body:[{kind:'pwm',value:{kind:'variable',name:'percent'}}]}]}],otherwise:[]}]}]};
 const source=generateForProject(program,project);expect(source).toContain('j_pwm(jp_percent)');expect(source).toContain('ledcAttach(2, 1000, 8)');
 expect(()=>generateForProject({setup:[{...pwm,channel:2}],loop:[]},project)).toThrow('SECOND_INDICATOR_WIRING_REQUIRED');
 expect(()=>generateForProject({setup:[pwm],loop:[]},{...project,profileId:'jective-provisional'})).toThrow();
 for(const driver of [{gpio:4,frequencyHz:1000,resolutionBits:8},{gpio:2,frequencyHz:2000,resolutionBits:8},{gpio:2,frequencyHz:1000,resolutionBits:16}])expect(()=>generate({setup:[pwm],loop:[]},2,driver as {gpio:number;frequencyHz:1000;resolutionBits:8})).toThrow('PWM_DRIVER_CONFIGURATION');
 for(const pin of [-1,49,1.5])expect(()=>generate({setup:[pwm],loop:[]},pin,{gpio:pin,frequencyHz:1000,resolutionBits:8})).toThrow('PWM_DRIVER_CONFIGURATION');
 expect(()=>generate({setup:[pwm],loop:[]},2)).toThrow('PWM_DRIVER_REQUIRED');
});
