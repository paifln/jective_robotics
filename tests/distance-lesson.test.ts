import {it,expect} from 'vitest';
import {distanceArtifact} from '../packages/content/lesson-distance';
import {RobotSimulation} from '../packages/simulator';
it('L17 starter faults at the first out-of-range read and reference counts invalid data then recovers',()=>{
 const starter=new RobotSimulation(distanceArtifact.starter,distanceArtifact.world!);const failed=starter.step(61);expect(failed.status).toBe('error');expect(failed.error).toContain('DISTANCE_READING_INVALID');expect(failed.variables.sample_time_ms).toBe(600);expect(failed.variables.valid_count).toBe(3);expect(failed.variables.last_valid_m).toBe(2);
 for(let repeat=0;repeat<10;repeat++){const reference=new RobotSimulation(distanceArtifact.reference,distanceArtifact.world!);const completed=reference.step(61);expect(completed.status).toBe('completed');expect(completed.variables.valid_count).toBe(4);expect(completed.variables.invalid_count).toBe(2);expect(completed.variables.last_valid_m).toBe(.2);expect(completed.variables.distance_valid).toBe(1);expect(completed.log).toEqual(['0 ms: VALID','200 ms: VALID','400 ms: VALID','600 ms: INVALID','800 ms: INVALID','1000 ms: VALID']);}
});
