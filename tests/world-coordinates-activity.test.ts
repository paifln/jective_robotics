import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {worldCoordinatesExercise} from '../packages/content/world-coordinates';
import {gradeActivity} from '../packages/content/learning-activities';
import {LearningIdSchema,nextLearningRecord} from '../packages/content/learning-records';
import {createLessonWorld,predictStraightPose,coordinateUnits} from '../packages/simulator/world-design';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import {worldCoordinateArtifact} from '../packages/content/world-coordinate-artifact';
import {RobotSimulation} from '../packages/simulator';
const answers={right:'east',down:'south',back:'north',angle:'radians',event:'milliseconds'};
it('executes both authored block artifacts in their actual world with distinct collision-free completed poses',()=>{
 const world=worldCoordinateArtifact.world!;const run=(reference:boolean)=>{const sim=new RobotSimulation(reference?worldCoordinateArtifact.reference:worldCoordinateArtifact.starter,world);return Array.from({length:75},()=>structuredClone(sim.step()));};const starter=run(false),reference=run(true);for(const trace of [starter,reference]){expect(trace.at(-1)!.status).toBe('completed');expect(trace.some(s=>s.collision)).toBe(false);expect(trace.at(-1)!.pose.y).toBe(world.start.y);expect(trace.at(-1)!.pose.heading).toBe(world.start.heading);}expect(starter.at(-1)!.pose.x).toBeGreaterThan(world.start.x);expect(reference.at(-1)!.pose.x).toBeGreaterThan(starter.at(-1)!.pose.x);expect(run(true)).toEqual(reference);
});
it('checks coordinate predictions against actual fixed-step kinematics and labels units correctly',()=>{
 const base={width:6,height:4,start:{x:1,y:1,headingDegrees:0},goal:{x:5,y:3,radius:.25},obstacles:[]};for(const [heading,distance,x,y] of [[0,.5,1.5,1],[90,.5,1,1.5],[90,-.5,1,.5]]){const pose=predictStraightPose(createLessonWorld({...base,start:{...base.start,headingDegrees:heading!}}),distance!);expect(pose.x).toBeCloseTo(x!,10);expect(pose.y).toBeCloseTo(y!,10);expect(pose.heading).toBeCloseTo(heading!*Math.PI/180,10);}
 expect(coordinateUnits).toEqual({position:'m',heading:'rad',time:'ms'});expect(gradeActivity(worldCoordinatesExercise,{}).state).toBe('incomplete');expect(gradeActivity(worldCoordinatesExercise,{...answers,back:'south'})).toEqual({state:'needs-practice',correct:4,total:5});expect(gradeActivity(worldCoordinatesExercise,answers)).toEqual({state:'checked',correct:5,total:5});expect(LearningIdSchema.parse('L43')).toBe('L43');expect(nextLearningRecord({id:'L43',answers,check:true},null).attempts).toBe(1);
});
it('retains checked coordinate attempts in the workspace and validated SQLite backup',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-world-coordinate-')),store=new WorkspaceStore(join(root,'source.sqlite'));try{store.saveLearning({id:'L43',answers:{...answers,back:'south'},check:true});const checked=store.saveLearning({id:'L43',answers,check:true});expect(checked.attempts).toBe(2);expect(checked.state).toBe('checked');await store.backup(join(root,'backup.sqlite'));const backup=inspectBackup(join(root,'backup.sqlite'));expect(backup.settings.some(s=>s.key==='learning:L43')).toBe(true);const restored=new WorkspaceStore(join(root,'restored.sqlite'));try{populateBackup(restored,backup);expect(restored.learning('L43')).toEqual(checked);}finally{restored.close();}}finally{store.close();if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-world-coordinate-'))throw new Error('Unexpected cleanup path');await rm(root,{recursive:true,force:true});}
});
