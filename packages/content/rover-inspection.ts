import {z} from 'zod';
import {ProfileSchema,components,validateWiring} from '../profiles';
export const roverChecks=['powerDisconnected','polarity','wheelClearance','fasteners','cableRouting','stopAccess'] as const;
const text=z.string().trim().min(1).max(2000);
export const RoverInspectionSchema=z.object({
 schemaVersion:z.literal(1),guideId:z.literal('G04'),assemblyRevision:text,
 board:ProfileSchema,componentId:z.enum(['motor-direction-enable','motor-dual-input']),
 wiring:z.record(z.string(),z.number().int().min(0).max(48).nullable()),
 checks:z.record(z.string().refine(key=>roverChecks.includes(key as typeof roverChecks[number]),'Unknown inspection item'),z.object({status:z.enum(['not-inspected','pass','fail']),note:text}).strict()),
 teacherObservation:z.object({observer:text,observedAt:z.string().datetime({offset:true}),note:text}).strict().nullable()
}).strict();
export type RoverInspection=z.infer<typeof RoverInspectionSchema>;
export function assessRoverInspection(input:unknown){
 const report=RoverInspectionSchema.parse(input);
 const roles=components.find(c=>c.id===report.componentId)!.roles.map(r=>r.name);
 if(Object.keys(report.wiring).some(key=>!roles.includes(key)))throw new Error('ROVER_WIRING_ROLE');
 const issues=validateWiring(report.board,report.componentId,report.wiring);
 const incomplete=roverChecks.filter(key=>report.checks[key]?.status!=='pass');
 return {report,issues,incomplete,wiringReviewed:!issues.some(i=>i.blocking),inspectionRecorded:incomplete.length===0,
  physicalEvidenceRecorded:incomplete.length===0&&report.teacherObservation!==null,
  hardwareReady:false as const,scope:'Recorded observations and pin compatibility only; no upload, motor motion, electrical rating or physical safety certification.'};
}
