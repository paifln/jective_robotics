import {it,expect} from 'vitest';
import {runCollisionCases} from '../packages/content/collision-cases';
import {CollisionReportSchema} from '../packages/content/collision-report';
import {processCollisionRequest} from '../packages/content/collision-worker';
const report=runCollisionCases();
it('accepts actual complete traces and rejects misleading summaries or truncated evidence',()=>{
 CollisionReportSchema.parse(report);
 const changes=[(r:typeof report)=>{r.cases.wall!.starter.trace.pop();},(r:typeof report)=>{r.cases.wall!.starter.trace[0]!.timeMs=99;},(r:typeof report)=>{r.cases.wall!.starter.final={...r.cases.wall!.starter.final,timeMs:99};},(r:typeof report)=>{r.cases.wall!.starter.collisionSeen=false;},(r:typeof report)=>{r.cases.range!.corrected.invalidDistanceSeen=false;},(r:typeof report)=>{r.cases.wall!.world.width=5;},(r:typeof report)=>{r.programs.starter=r.programs.corrected;},(r:typeof report)=>{r.invalidStart.world.start.x=.5;},(r:typeof report)=>{r.invalidStart.rejected=false;}];
 for(const change of changes){const changed=structuredClone(report);change(changed);expect(CollisionReportSchema.safeParse(changed).success).toBe(false);}
 const terminal=structuredClone(report);terminal.cases.wall!.starter.trace.at(-1)!.pose.x+=.01;expect(CollisionReportSchema.safeParse(terminal).success).toBe(false);
 const reordered=structuredClone(report);reordered.programs.starter={loop:reordered.programs.starter.loop,setup:reordered.programs.starter.setup};expect(CollisionReportSchema.safeParse(reordered).success).toBe(true);
});
it('bounds worker requests and preserves only validated operation identifiers',()=>{
 const operationId=crypto.randomUUID(),reply=processCollisionRequest({operationId});expect(reply.ok).toBe(true);expect(reply.operationId).toBe(operationId);if(reply.ok)expect(CollisionReportSchema.safeParse(reply.report).success).toBe(true);
 for(const value of [null,{}, {operationId:'wrong'}, {operationId,steps:100000}, {operationId:99}]){const invalid=processCollisionRequest(value);expect(invalid.ok).toBe(false);if(!invalid.ok)expect(invalid.error.length).toBeLessThanOrEqual(2000);}
 expect(processCollisionRequest({operationId,extra:true}).operationId).toBe(operationId);expect(processCollisionRequest(null).operationId).toBe('');
});


