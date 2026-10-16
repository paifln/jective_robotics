import {it,expect} from 'vitest';
import {encodeLearnerCredential,decodeLearnerCredential} from '../packages/assistant/credential-envelope';
const endpoint='https://approved.example',token='jt_'+'t'.repeat(43);
it('binds a versioned learner credential to the exact canonical endpoint',()=>{
 const envelope=encodeLearnerCredential(endpoint,token);expect(decodeLearnerCredential(envelope,endpoint)).toBe(token);expect(()=>decodeLearnerCredential(envelope,'https://untrusted.example')).toThrow('AI_CREDENTIAL_CONTEXT_CHANGED');expect(()=>encodeLearnerCredential(endpoint,'sk-proj-fixture-provider-secret')).toThrow('AI_INVALID_LEARNER_TOKEN');
});
it('requires explicit reprovision of legacy unbound tokens and rejects malformed/oversized envelopes',()=>{
 expect(()=>decodeLearnerCredential(token,endpoint)).toThrow('AI_CREDENTIAL_REPROVISION_REQUIRED');
 for(const value of ['', 'invalid-plaintext', 'jective-learner-v1:{bad', 'jective-learner-v1:'+JSON.stringify({endpoint,token,extra:true}),'jective-learner-v1:'+JSON.stringify({endpoint,token:'invalid-token'}),'jective-learner-v1:'+'x'.repeat(8192)])expect(()=>decodeLearnerCredential(value,endpoint)).toThrow('AI_INVALID_LEARNER_TOKEN');
});
