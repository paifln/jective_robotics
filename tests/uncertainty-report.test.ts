import {it,expect} from 'vitest';
import {runSensorUncertainty,describeEnteredMeasurements} from '../packages/content/sensor-uncertainty';
import {UncertaintyReportSchema,EnteredMeasurementReportSchema} from '../packages/content/uncertainty-report';
import {processUncertaintyRequest} from '../packages/content/uncertainty-worker';
it('validates real model traces and rejects altered statistics, geometry, timing and movement',()=>{
 const report=runSensorUncertainty({seed:23,samples:20,noiseMeters:.05});expect(UncertaintyReportSchema.safeParse(report).success).toBe(true);
 const changes=[(r:typeof report)=>{r.world.width=5;},(r:typeof report)=>{r.trace.pop();},(r:typeof report)=>{r.readings.pop();},(r:typeof report)=>{r.trace[0]!.timeMs=99;},(r:typeof report)=>{r.trace[0]!.distance=null;},(r:typeof report)=>{r.trace[0]!.pose.x+=.1;},(r:typeof report)=>{r.trace[0]!.collision=true;},(r:typeof report)=>{r.trace[0]!.left=1;},(r:typeof report)=>{r.summary.mean=1;},(r:typeof report)=>{r.program.loop=[];}];
 for(const change of changes){const altered=structuredClone(report);change(altered);expect(UncertaintyReportSchema.safeParse(altered).success).toBe(false);}
 const manual=describeEnteredMeasurements({referenceMeters:1,readings:[null,1.1]});expect(EnteredMeasurementReportSchema.safeParse(manual).success).toBe(true);expect(EnteredMeasurementReportSchema.safeParse({...manual,summary:{...manual.summary,mean:0}}).success).toBe(false);expect(UncertaintyReportSchema.safeParse(manual).success).toBe(false);
});
it('bounds requests and preserves validated operation identifiers on success and error',()=>{
 const operationId=crypto.randomUUID(),inputs={seed:23,samples:20,noiseMeters:.05};const valid=processUncertaintyRequest({operationId,inputs});expect(valid.ok).toBe(true);expect(valid.operationId).toBe(operationId);if(valid.ok)expect(UncertaintyReportSchema.safeParse(valid.report).success).toBe(true);
 for(const value of [null,{}, {operationId:'bad',inputs},{operationId,inputs:{...inputs,samples:100000}},{operationId,inputs,extra:true}]){const error=processUncertaintyRequest(value);expect(error.ok).toBe(false);if(!error.ok)expect(error.error.length).toBeLessThanOrEqual(2000);}
 expect(processUncertaintyRequest({operationId,inputs,extra:true}).operationId).toBe(operationId);expect(processUncertaintyRequest(null).operationId).toBe('');
});
