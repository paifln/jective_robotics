import {it,expect} from 'vitest';
import {parseMeasurementEntry} from '../packages/content/measurement-entry';
it('parses metre readings with decimal comma and retains unavailable values and manual provenance',()=>{
 const report=parseMeasurementEntry(' 1,4\r\n?\r\n1.6 ',1.5);expect(report.inputs.readings).toEqual([1.4,null,1.6]);expect(report.summary.mean).toBe(1.5);expect(report.summary.missingCount).toBe(1);expect(report.origin).toBe('learner-entered');expect(report.physicalVerification).toBe('NOT RUN');
 expect(parseMeasurementEntry('.5\n,6',.5).inputs.readings).toEqual([.5,.6]);expect(parseMeasurementEntry('?',1).summary.mean).toBeNull();
});
it('rejects ambiguous, excessive, invalid or out-of-range measurements before analysis',()=>{
 for(const text of ['', '1\n\n2','1,2,3','1e2','0x10','NaN','Infinity','-1','6','1 cm',Array(301).fill('1').join('\n'),'1'.repeat(12001)])expect(()=>parseMeasurementEntry(text,1)).toThrow();
 expect(()=>parseMeasurementEntry('1',NaN)).toThrow();
});
