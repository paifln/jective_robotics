import {it,expect} from 'vitest';
import {chatCompletionRequest,chatCompletionAnswer} from '../packages/assistant/chat-completion';

it('uses the official OpenAI bound without silently changing the configured model, and preserves legacy-compatible requests',()=>{
 const official=chatCompletionRequest('https://api.openai.com/v1','configured-model-fixture','question','untrusted source');
 expect(official.model).toBe('configured-model-fixture');expect(official).toHaveProperty('max_completion_tokens',1600);expect(official).not.toHaveProperty('max_tokens');
 expect(official.messages[1]!.content).toContain('BEGIN OPTIONAL PROJECT CONTEXT\nuntrusted source\nEND PROJECT CONTEXT');
 for(const endpoint of ['http://127.0.0.1:1234/v1','https://compatible.example/v1','https://api.openai.com.example/v1']){const legacy=chatCompletionRequest(endpoint,'unchanged-fixture','question','');expect(legacy).toHaveProperty('max_tokens',1600);expect(legacy).not.toHaveProperty('max_completion_tokens');}
});
it('preserves finished and legacy text but rejects truncated, empty, oversized and malformed responses',()=>{
 const content='```cpp\nvoid setup(){}\n```\n';
 for(const finish_reason of ['stop',undefined])expect(chatCompletionAnswer({choices:[{finish_reason,message:{content}}]})).toBe(content);
 expect(()=>chatCompletionAnswer({choices:[{finish_reason:'length',message:{content}}]})).toThrow('AI_RESPONSE_TRUNCATED');
 expect(()=>chatCompletionAnswer({choices:[{message:{content:' \n\t'}}]})).toThrow('AI_EMPTY_RESPONSE');
 for(const value of [{choices:[]},{choices:[{message:{content:null}}]},{choices:[{message:{content:'x'.repeat(32001)}}]}])expect(()=>chatCompletionAnswer(value)).toThrow();
});
