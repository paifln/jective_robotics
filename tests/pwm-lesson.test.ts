import {it,expect} from 'vitest';
import {pwmArtifact} from '../packages/content/lesson-pwm';
import {interpret} from '../packages/simulator';
import {RobotSimulation,worlds} from '../packages/simulator';
import {generateForProject} from '../packages/codegen/project';
it('L15 rejects the starter fifth command and completes the bounded reference with final zero',()=>{
 expect(()=>interpret(pwmArtifact.starter,1200)).toThrow('PWM_RANGE');
 const starter=new RobotSimulation(pwmArtifact.starter,worlds[0]!);const failed=Array.from({length:60},()=>starter.step()).at(-1)!;expect(failed.status).toBe('error');expect(failed.ledDuty).toBe(90);expect(failed.log).toEqual([]);
 const trace=interpret(pwmArtifact.reference,1200);expect(trace.filter(event=>event.kind==='pwm').map(event=>[event.timeMs,event.value])).toEqual([[0,0],[200,25],[400,50],[600,75],[800,100],[1000,0]]);
 const reference=new RobotSimulation(pwmArtifact.reference,worlds[0]!);const completed=Array.from({length:60},()=>reference.step()).at(-1)!;expect(completed.status).toBe('completed');expect(completed.ledDuty).toBe(0);expect(completed.log).toEqual(['1000 ms: DONE']);
 const source=generateForProject(pwmArtifact.reference,{schemaVersion:1,id:crypto.randomUUID(),name:'L15 generated reference',profileId:'esp32c3-reference',mode:'blocks',source:'',workspace:{},revision:0});expect(source).toContain('ledcAttach(4, 1000, 8)');
});
