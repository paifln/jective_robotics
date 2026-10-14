import {it,expect} from 'vitest';
import {uncertaintyLesson} from '../packages/content/lesson-uncertainty';
import {runSensorUncertainty} from '../packages/content/sensor-uncertainty';
import {parseMeasurementEntry} from '../packages/content/measurement-entry';
it('grounds trilingual uncertainty theory and its worked example in the actual analysis',()=>{
 expect(uncertaintyLesson.id).toBe('L46');expect(uncertaintyLesson.translationStatus).toBe('draft-review-required');
 for(const locale of ['en','ru','kk'] as const){expect(uncertaintyLesson.explanation[locale].split('\n\n')).toHaveLength(6);expect(uncertaintyLesson.explanation[locale].length).toBeGreaterThan(2000);expect(uncertaintyLesson.questions.every(q=>q.question[locale].length>10&&q.answer[locale].length>10)).toBe(true);}
 const example=parseMeasurementEntry('1.4\n?\n1.6',1.5);expect(example.summary.validCount).toBe(2);expect(example.summary.missingCount).toBe(1);expect(example.summary.mean).toBe(1.5);expect(example.summary.span).toBeCloseTo(.2);expect(example.summary.meanError).toBe(0);
 const zero=runSensorUncertainty({seed:23,samples:100,noiseMeters:0});expect(zero.summary.span).toBe(0);expect(zero.summary.mean).toBe(1.5);expect(zero.physicalVerification).toBe('NOT RUN');
});
