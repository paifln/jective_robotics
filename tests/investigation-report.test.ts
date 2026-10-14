import {it,expect} from 'vitest';
import {runNavigationInvestigation} from '../packages/content/navigation-investigation';
import {InvestigationReportSchema} from '../packages/content/investigation-report';
it('accepts actual paired traces and rejects changed conditions, metrics, ordering and provenance',()=>{
 const report=runNavigationInvestigation({seed:9,repetitions:2,steps:40,noiseMeters:.03,worlds:['clear','wall']});expect(InvestigationReportSchema.safeParse(report).success).toBe(true);
 const mutations=[(r:typeof report)=>{r.trials.pop();},(r:typeof report)=>{r.trials.reverse();},(r:typeof report)=>{r.trials[0]!.seed++;},(r:typeof report)=>{r.trials[0]!.world.goal.x=2;},(r:typeof report)=>{r.trials[0]!.runs.near.metrics.goalSeen=true;},(r:typeof report)=>{r.trials[0]!.runs.near.trace.pop();},(r:typeof report)=>{r.trials[0]!.runs.near.trace[0]!.timeMs=40;},(r:typeof report)=>{r.programs.near.loop=[];},(r:typeof report)=>{r.inputs.noiseMeters=.1;}];for(const mutate of mutations){const forged=structuredClone(report);mutate(forged);expect(InvestigationReportSchema.safeParse(forged).success).toBe(false);}expect(InvestigationReportSchema.safeParse({...report,physicalVerification:'PASS'}).success).toBe(false);
});
