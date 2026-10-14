import {test,expect} from 'vitest';
import {PrecisionController,precisionTrial,comparePrecision,precisionArtifact} from '../packages/content/precision-motion';
import {interpret} from '../packages/simulator';
test('precision controller limits commands, reduces approach speed, corrects wheel-derived heading and latches stop',()=>{
 const c=new PrecisionController(.4);const start=c.tick(0,0,0);expect(start.left).toBe(25);expect(c.tick(20,.35,.36).left).toBeGreaterThan(c.tick(40,.35,.36).right);expect(c.tick(60,.399,.399)).toMatchObject({state:'target',left:0,right:0});expect(c.tick(80,0,0).left).toBe(0);
 for(const cause of ['missing','stop','late'] as const){const ctrl=new PrecisionController(.4);ctrl.tick(0,0,0);expect(ctrl.tick(cause==='late'?101:20,cause==='missing'?null:0,0,cause==='stop').state).toBe('fault');expect(ctrl.tick(200,0,0).left).toBe(0);}
 expect(()=>new PrecisionController(0)).toThrow('PRECISION_TARGET');expect(()=>new PrecisionController(NaN)).toThrow('PRECISION_TARGET');expect(()=>c.tick(80,0,0)).toThrow('PRECISION_TIME');
});
test('declared count worksheets run without claiming board feedback',()=>{for(const reference of [false,true]){const events=interpret(reference?precisionArtifact.reference:precisionArtifact.starter,100);expect(events.some(event=>String(event.value).includes('NOT BOARD FEEDBACK'))).toBe(true);expect(events.some(event=>String(event.value).includes(reference?'0.400000':'0.200000'))).toBe(true);}});
test('paired actual simulations reduce target error across explicit speed assumptions',()=>{
 const report=comparePrecision();for(const run of report.runs){expect(run.feedback.trace.at(-1)!.status).toBe('completed');expect(run.feedback.outcome.collision).toBe(false);expect(run.feedback.outcome.positionErrorMeters).toBeLessThan(.01);expect(run.feedback.decisions.every(row=>row.left>=0&&row.left<=30&&row.right>=0&&row.right<=30)).toBe(true);}
 const mean=(mode:'feedback'|'timed')=>report.runs.reduce((sum,run)=>sum+run[mode].outcome.positionErrorMeters,0)/report.runs.length;expect(mean('feedback')).toBeLessThan(mean('timed'));expect(report.runs[1]!.timed.outcome.positionErrorMeters).toBeLessThan(report.runs[1]!.feedback.outcome.positionErrorMeters);
 expect(report.runs[0]!.feedback.maximumSpeedMps).toBe(report.runs[0]!.timed.maximumSpeedMps);expect(report.runs[0]!.timed.outcome.positionErrorMeters).not.toBe(report.runs.at(-1)!.timed.outcome.positionErrorMeters);
});
test('missing and manual stops affect both paired modes and remain stopped after restoration',()=>{
 for(const mode of ['feedback','timed'] as const)for(const caseId of ['missing-feedback','manual-stop'] as const){const report=precisionTrial(mode,.4,.6,caseId);expect(report.outcome.stopRequestMs).toBe(500);expect(report.decisions.filter(row=>row.timeMs>=500).every(row=>row.left===0&&row.right===0)).toBe(true);expect(report.outcome.settledStopMs).toBeGreaterThan(500);}
 expect(()=>comparePrecision(.4,.3)).toThrow('PRECISION_REPETITIONS');expect(()=>precisionTrial('feedback',.4,NaN)).toThrow('PRECISION_CONFIG');
});
