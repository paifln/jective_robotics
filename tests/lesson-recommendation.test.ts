import {it,expect} from 'vitest';
import {recommendLesson} from '../packages/content/lesson-recommendation';
const lessons=[{id:'L01',prerequisites:[]},{id:'L02',prerequisites:['L01']},{id:'L03',prerequisites:['L01','L02']}];
it('uses only saved quiz passes and requires every prerequisite',()=>{
 expect(recommendLesson(lessons,{})?.id).toBe('L01');expect(recommendLesson(lessons,{L01:'self-reported-complete'})?.id).toBe('L01');expect(recommendLesson(lessons,{L01:'knowledge-check-passed'})?.id).toBe('L02');expect(recommendLesson(lessons,{L01:'knowledge-check-passed',L02:'knowledge-check-passed'})?.id).toBe('L03');expect(recommendLesson(lessons,{L01:'knowledge-check-passed',L02:'knowledge-check-passed',L03:'knowledge-check-passed'})).toBeNull();
});
it('does not suggest lessons from broken graphs or mutate progress',()=>{
 const progress={L01:'knowledge-check-passed'};expect(recommendLesson([{id:'L01',prerequisites:['missing']}],progress)).toBeNull();expect(recommendLesson([{id:'L01',prerequisites:['L02']},{id:'L02',prerequisites:['L01']}],progress)).toBeNull();expect(progress).toEqual({L01:'knowledge-check-passed'});expect(recommendLesson([],{})).toBeNull();
});
