import {test,expect} from 'vitest';
import {CourseController,runCourse,repeatCourse,courseCases,courseWorld} from '../packages/content/course-challenge';
test('course priority interrupts tracking before finish and line decisions',()=>{
 const input={timeMs:0,left:0,right:1,distance:1,stopRequested:false,atFinish:false};
 expect(new CourseController().tick(input)).toMatchObject({state:'track',left:12,right:28});
 expect(new CourseController().tick({...input,distance:.3,atFinish:true})).toMatchObject({state:'obstacle',left:0,right:0});
 expect(new CourseController().tick({...input,distance:null,atFinish:true})).toMatchObject({state:'fault',left:0,right:0});
 expect(new CourseController().tick({...input,distance:.1,stopRequested:true})).toMatchObject({state:'fault',left:0,right:0});
 expect(new CourseController().tick({...input,left:1,right:1,atFinish:true})).toMatchObject({state:'lost',left:0,right:0});
 expect(new CourseController().tick({...input,atFinish:true})).toMatchObject({state:'goal',left:0,right:0});
});
test('stops latch, late updates fault and malformed clocks reject',()=>{
 const input={timeMs:0,left:0,right:0,distance:1,stopRequested:false,atFinish:false};
 for(const change of [{distance:.3},{distance:null},{left:1,right:1},{left:.5},{atFinish:true}]){const controller=new CourseController();controller.tick({...input,...change});expect(controller.tick({...input,timeMs:20})).toMatchObject({left:0,right:0});}
 const controller=new CourseController();controller.tick(input);expect(controller.tick({...input,timeMs:101})).toMatchObject({state:'fault'});
 for(const timeMs of [101,-1,NaN,.5,120001])expect(()=>controller.tick({...input,timeMs})).toThrow('COURSE_TIME');
 expect(new CourseController().tick({...input,timeMs:8000})).toMatchObject({state:'timeout',left:0,right:0});
});
test('actual clear course reaches goal reproducibly; physical obstacle interrupts without contact',()=>{
 const clear=repeatCourse('clear');expect(clear.runs).toHaveLength(3);expect(clear.endpointRangeMeters).toBe(0);expect(clear.runs.every(run=>run.outcome.coursePassed&&!run.outcome.collision)).toBe(true);
 for(const run of clear.runs.slice(1))expect(run.trace).toEqual(clear.runs[0]!.trace);
 const blocked=runCourse('obstacle');expect(blocked.outcome).toMatchObject({state:'obstacle',goalReached:false,collision:false,coursePassed:false});expect(blocked.outcome.bodyClearanceMeters).toBeGreaterThan(.15);expect(blocked.outcome.settledStopMs!-blocked.outcome.stopRequestMs).toBeLessThanOrEqual(100);
 expect(blocked.world.goal.x-blocked.world.goal.radius).toBeGreaterThan(blocked.world.obstacles[0]!.x+blocked.world.obstacles[0]!.width);
 const unsafe=runCourse('obstacle',false);expect(unsafe.outcome.collision).toBe(true);expect(unsafe.outcome.coursePassed).toBe(false);
});
test('every actual reference decision agrees with independent priority control on all five fixtures',()=>{
 for(const caseId of courseCases){const report=runCourse(caseId),controller=new CourseController();for(const [index,decision] of report.decisions.entries()){
  const before=report.trace[index]!,event=report.world.buttonEvents?.filter(event=>event.timeMs<=before.timeMs).at(-1);
  const expected=controller.tick({timeMs:before.timeMs,left:before.lineLeft,right:before.lineRight,distance:before.distance,stopRequested:event?.pressed??false,atFinish:before.pose.x>1.35});expect(decision).toMatchObject({state:expected.state,left:expected.left,right:expected.right});
 }}
});
test('all course fixtures preserve traces, invalid readings, boundary and manual-stop latches',()=>{
 for(const caseId of courseCases){const report=runCourse(caseId);expect(report.trace.at(-1)!.status).toBe('completed');expect(report.decisions).toHaveLength(400);expect(report.outcome.collision).toBe(false);if(caseId==='missing'||caseId==='manual-stop'){expect(report.outcome.state).toBe('fault');expect(report.outcome.stopRequestMs).toBe(800);expect(report.trace.filter(frame=>frame.timeMs>=1500).every(frame=>frame.left===0&&frame.right===0)).toBe(true);}if(caseId==='threshold-boundary')expect(report.outcome.stopRequestMs).toBe(0);}
 expect(()=>courseWorld('bad' as 'clear')).toThrow('COURSE_CASE');for(const repetitions of [0,1,6,.5])expect(()=>repeatCourse('clear',repetitions)).toThrow('COURSE_REPETITIONS');
});
