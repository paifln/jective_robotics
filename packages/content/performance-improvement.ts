import {z} from 'zod';
import {RobotStateSchema,WorldSchema} from '../simulator';
import {squareRouteTrials,squareRouteProgram,squareRouteDefaults} from './square-route';
import {steeringWorld} from './differential-experiment';
import type {LessonArtifact} from './index';

export const performanceAcceptance={endpointErrorMeters:.02,maximumCornerErrorRadians:.05,headingErrorRadians:.1,maximumCompletionMs:13000} as const;
export const PerformanceInputSchema=z.object({turnMs:z.number().int().min(400).max(2000).refine(n=>n%20===0),justification:z.string().trim().min(10).max(2000)}).strict();
const RunSchema=z.object({settings:z.object({straightMs:z.literal(1000),turnMs:z.number().int().min(400).max(2000),trackMeters:z.literal(.18),rightCommandOffset:z.literal(0),repetitions:z.literal(3)}),world:WorldSchema,rows:z.array(z.object({trial:z.number().int().min(1).max(3),trace:z.array(RobotStateSchema).min(2).max(1101).refine(trace=>trace.every((s,i)=>i===0?s.timeMs===0:s.timeMs===trace[i-1]!.timeMs+20),'PERFORMANCE_TIME_ORDER')})).length(3)});
/** Recompute measurements from actual traces, never a supplied success flag or summary. */
export function measurePerformanceRun(value:unknown){
 const run=RunSchema.parse(value);if(new Set(run.rows.map(r=>r.trial)).size!==3)throw new Error('PERFORMANCE_TRIAL_IDS');
 const rows=run.rows.map(row=>{const final=row.trace.at(-1)!,cycle=run.settings.straightMs+run.settings.turnMs+400;
  const state=(time:number)=>{const s=row.trace.find(s=>s.timeMs===time);if(!s)throw new Error('PERFORMANCE_PHASE_MISSING');return s;};
  const cornerErrors=Array.from({length:4},(_,i)=>Math.abs(state((i+1)*cycle).pose.heading-state(i*cycle+1200).pose.heading-Math.PI/2));
  const endpointErrorMeters=Math.hypot(final.pose.x-run.world.start.x,final.pose.y-run.world.start.y),headingErrorRadians=Math.abs(Math.atan2(Math.sin(final.pose.heading-run.world.start.heading),Math.cos(final.pose.heading-run.world.start.heading))),maximumCornerErrorRadians=Math.max(...cornerErrors),completionMs=final.timeMs;
  const checks={completed:final.status==='completed',noCollision:row.trace.every(s=>!s.collision),endpoint:endpointErrorMeters<=performanceAcceptance.endpointErrorMeters,corners:maximumCornerErrorRadians<=performanceAcceptance.maximumCornerErrorRadians,heading:headingErrorRadians<=performanceAcceptance.headingErrorRadians,time:completionMs<=performanceAcceptance.maximumCompletionMs};
  return {trial:row.trial,endpointErrorMeters,headingErrorRadians,maximumCornerErrorRadians,completionMs,checks,passed:Object.values(checks).every(Boolean)};
 });
 return {rows,passed:rows.every(r=>r.passed),meanEndpointErrorMeters:rows.reduce((n,r)=>n+r.endpointErrorMeters,0)/3,maximumCornerErrorRadians:Math.max(...rows.map(r=>r.maximumCornerErrorRadians)),maximumCompletionMs:Math.max(...rows.map(r=>r.completionMs))};
}
export function runPerformanceImprovement(value:unknown){
 const input=PerformanceInputSchema.parse(value),baseline=squareRouteTrials({...squareRouteDefaults,repetitions:3}),revision=squareRouteTrials({...squareRouteDefaults,repetitions:3,turnMs:input.turnMs}),before=measurePerformanceRun(baseline),after=measurePerformanceRun(revision);
 const comparison={sameWorld:JSON.stringify(baseline.world)===JSON.stringify(revision.world),onlyTurnDurationChanged:Object.keys(baseline.settings).filter(k=>baseline.settings[k as keyof typeof baseline.settings]!==revision.settings[k as keyof typeof revision.settings]).every(k=>k==='turnMs'),accuracyImproved:after.meanEndpointErrorMeters<before.meanEndpointErrorMeters&&after.maximumCornerErrorRadians<before.maximumCornerErrorRadians,acceptancePassed:after.passed,extraTimeMs:after.maximumCompletionMs-before.maximumCompletionMs};
 return {schemaVersion:1,lessonId:'L58',origin:'RobotSimulation-paired-trials',input,acceptance:{...performanceAcceptance},baseline,revision,before,after,comparison,justifiedImprovement:input.turnMs!==1000&&comparison.sameWorld&&comparison.onlyTurnDurationChanged&&comparison.accuracyImproved&&comparison.acceptancePassed,limits:'Three identical deterministic trials per version; not six independent physical observations or confidence estimates. One turn-duration parameter changes. Accuracy can improve while elapsed time increases; the fixed time budget still applies. Closure alone is insufficient: every corner and final heading are checked.',compilation:'NOT RUN by this experiment',upload:'NOT RUN',physicalVerification:'NOT RUN'} as const;
}
export const performanceImprovementArtifact:LessonArtifact={starter:squareRouteProgram(),reference:squareRouteProgram({...squareRouteDefaults,turnMs:1180}),world:{...structuredClone(steeringWorld),id:'L58-square-performance'}};
