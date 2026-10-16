import {z} from 'zod';
import {isLearnerCredential} from '../contracts/learner-credential';

const prefix='jective-learner-v1:';
const Envelope=z.object({endpoint:z.string().min(1).max(500),token:z.string().max(200)}).strict();

/** This plaintext is always passed to safeStorage, never written directly to disk. */
export function encodeLearnerCredential(endpoint:string,token:string){
 if(!isLearnerCredential(token))throw new Error('AI_INVALID_LEARNER_TOKEN');
 return prefix+JSON.stringify(Envelope.parse({endpoint,token}));
}
export function decodeLearnerCredential(value:string,endpoint:string){
 if(!value.startsWith(prefix))throw new Error(isLearnerCredential(value)?'AI_CREDENTIAL_REPROVISION_REQUIRED':'AI_INVALID_LEARNER_TOKEN');
 if(value.length>8192)throw new Error('AI_INVALID_LEARNER_TOKEN');
 let envelope:z.infer<typeof Envelope>;
 try{envelope=Envelope.parse(JSON.parse(value.slice(prefix.length)));}catch{throw new Error('AI_INVALID_LEARNER_TOKEN');}
 if(!isLearnerCredential(envelope.token))throw new Error('AI_INVALID_LEARNER_TOKEN');
 if(envelope.endpoint!==endpoint)throw new Error('AI_CREDENTIAL_CONTEXT_CHANGED');
 return envelope.token;
}
