import {describe,it,expect} from 'vitest';
import {knowledgeChecks,gradeKnowledge} from '../packages/content/knowledge-check';
import {lessons} from '../packages/content/lessons';
describe('lesson knowledge checking',()=>{
 it('covers every authored lesson with translated exercises and diagrams',()=>{
  expect(Object.keys(knowledgeChecks).sort()).toEqual(lessons.map(l=>l.id).sort());
  for(const [id,bank] of Object.entries(knowledgeChecks)){
   for(const locale of ['en','ru','kk'] as const){expect(bank.choice.prompt[locale].length).toBeGreaterThan(15);expect(bank.number.prompt[locale].length).toBeGreaterThan(15);expect(new Set(bank.choice.options.map(o=>o[locale])).size).toBe(3);expect(bank.diagram.every(d=>d[locale].length>0)).toBe(true);}
   expect(gradeKnowledge(id,bank.choice.correct,String(bank.number.answer))).toMatchObject({passed:true,score:2,total:2});
   expect(gradeKnowledge(id,(bank.choice.correct+1)%3,String(bank.number.answer))).toMatchObject({passed:false,score:1,choiceCorrect:false,numberCorrect:true});
   expect(gradeKnowledge(id,null,String(bank.number.answer+1))).toMatchObject({passed:false,score:0});
  }
 });
 it('accepts decimal comma and whitespace without treating missing input as zero',()=>{
  expect(gradeKnowledge('L17',0,' 0,5 ').passed).toBe(true);
  expect(gradeKnowledge('L16',0,'0').passed).toBe(true);
  expect(gradeKnowledge('L16',0,'').numberCorrect).toBe(false);
  expect(gradeKnowledge('L17',0,'.5').numberCorrect).toBe(true);
 });
 it('rejects malformed numbers, units, nonfinite values and wrong choices',()=>{
  for(const input of [' ','NaN','Infinity','0.5m','0.5 extra','5e-1','0,5,0','-0.5'])expect(gradeKnowledge('L17',0,input).passed).toBe(false);
  expect(gradeKnowledge('L17',9,'0.5').passed).toBe(false);
  expect(()=>gradeKnowledge('L99',0,'0')).toThrow('KNOWLEDGE_CHECK_UNKNOWN');
 });
 it('checks sample intervals, quantization and missing readings rather than common wrong answers',()=>{
  expect(gradeKnowledge('L13',0,'0.06').numberCorrect).toBe(false);expect(gradeKnowledge('L13',0,'0.04').passed).toBe(true);
  expect(gradeKnowledge('L15',0,'127').numberCorrect).toBe(false);expect(gradeKnowledge('L15',0,'128').passed).toBe(true);
  expect(gradeKnowledge('L17',0,'0.333').numberCorrect).toBe(false);
 });
});
