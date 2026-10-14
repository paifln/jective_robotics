import {it,expect} from 'vitest';
import {assessKnowledge} from '../packages/content/assess-knowledge';
import {knowledgeChecks} from '../packages/content/knowledge-check';
import {KnowledgeResultSchema} from '../packages/contracts/knowledge-check';
it('grades actual submitted answers for all sixty lessons rather than accepting a claimed state',()=>{
 for(const [lessonId,bank]of Object.entries(knowledgeChecks)){expect(assessKnowledge({lessonId,choice:bank.choice.correct,input:String(bank.number.answer)}).result.passed).toBe(true);expect(assessKnowledge({lessonId,choice:null,input:''}).result.passed).toBe(false);}
});
it('rejects forged pass fields, unknown lessons and oversized or malformed answers',()=>{
 for(const value of [{lessonId:'L01',choice:0,input:'2',passed:true},{lessonId:'L99',choice:0,input:'2'},{lessonId:'L01',choice:3,input:'2'},{lessonId:'L01',choice:0,input:'x'.repeat(129)}])expect(()=>assessKnowledge(value)).toThrow();
 expect(KnowledgeResultSchema.safeParse({choiceCorrect:false,numberCorrect:false,score:2,total:2,passed:true}).success).toBe(false);
});
