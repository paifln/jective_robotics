import {it,expect} from 'vitest';
import {distanceCalibration,calibrationCSV} from '../packages/simulator/distance-calibration';
it('calibration records actual geometric observations and preserves absent readings in CSV',()=>{
 const rows=distanceCalibration();expect(rows).toHaveLength(21);for(const row of rows){if(row.targetMeters===null){expect(row.status).toBe('missing');expect(row.source).toBe('injected');expect(row.reportedMeters).toBeNull();}else if(row.targetMeters>2){expect(row.status).toBe('outOfRange');expect(row.reportedMeters).toBeNull();}else{expect(row.status).toBe('valid');expect(row.reportedMeters).toBe(row.targetMeters);expect(row.errorMeters).toBe(0);}}
 const csv=calibrationCSV(rows);expect(csv.split('\r\n')).toHaveLength(22);expect(csv).toContain('"simulation","2.1","1","","outOfRange","ray",""');expect(csv).toContain('"simulation","","1","","missing","injected",""');
 const noisy=distanceCalibration(10,.1,4294967295);expect(noisy).toEqual(distanceCalibration(10,.1,4294967295));for(const row of noisy)if(row.errorMeters!==null)expect(Math.abs(row.errorMeters)).toBeLessThanOrEqual(.1005);
 for(const repeats of [0,11,1.5,NaN])expect(()=>distanceCalibration(repeats)).toThrow('CALIBRATION_REPETITIONS_RANGE');for(const noise of [-.1,.21,NaN])expect(()=>distanceCalibration(1,noise)).toThrow('CALIBRATION_NOISE_RANGE');for(const seed of [-1,4294967296,.5,NaN])expect(()=>distanceCalibration(1,0,seed)).toThrow('CALIBRATION_SEED_RANGE');
});
