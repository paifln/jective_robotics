import {randomBytes} from 'node:crypto';
import {tokenHash} from './policy.mjs';
export function generateLearnerCredential(id,now=Date.now()){
 if(typeof id!=='string'||!/^\w[\w-]{0,79}$/.test(id)||!Number.isFinite(now))throw new Error('Set a valid learner ID and clock');
 const token='jt_'+randomBytes(32).toString('base64url'),expiresAt=new Date(now+30*86400000).toISOString();
 return {token,registryEntry:{id,hash:tokenHash(token),expiresAt}};
}
