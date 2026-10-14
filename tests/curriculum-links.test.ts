import {it,expect} from 'vitest';
import {curriculumLinkErrors} from '../packages/content/curriculum-links';
import {lessons} from '../packages/content/lessons';
import {guides} from '../packages/content/guides';
it('all shipped lesson prerequisites and assembly-guide references form a usable acyclic graph',()=>{expect(curriculumLinkErrors(lessons,guides)).toEqual([]);});
it('rejects missing, repeated and self dependencies as well as cycles',()=>{
 const errors=curriculumLinkErrors([{id:'L01',prerequisites:['L02','L02','missing']},{id:'L02',prerequisites:['L01']},{id:'L03',prerequisites:['L03']},{id:'L01',prerequisites:[]}],[]);
 for(const code of ['DUPLICATE_LESSON_ID','DUPLICATE_PREREQUISITE','MISSING_PREREQUISITE','SELF_PREREQUISITE','CURRICULUM_CYCLE'])expect(errors.some(error=>error.includes(code))).toBe(true);
});
it('checks guide references without rejecting valid shared prerequisites or unordered definitions',()=>{
 const nodes=[{id:'L03',prerequisites:['L01','L02']},{id:'L02',prerequisites:['L01']},{id:'L01',prerequisites:[]}];
 expect(curriculumLinkErrors(nodes,[{id:'G01',lessons:['L01','L03']}])).toEqual([]);
 const errors=curriculumLinkErrors(nodes,[{id:'G01',lessons:['L01','L01','missing']},{id:'G01',lessons:[]}]);
 for(const code of ['DUPLICATE_GUIDE_ID','DUPLICATE_GUIDE_LESSON','MISSING_GUIDE_LESSON'])expect(errors.some(error=>error.includes(code))).toBe(true);
});
