import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {documentationFields,peerAttemptFields,emptyDocumentation,preserveInstructions,documentationAnswers,documentationFromAnswers,reviewDocumentation,exportDocumentation,documentationHTML} from '../packages/content/technical-documentation';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import {parseLearningRecord} from '../packages/content/learning-records';
const authored=()=>{const d=emptyDocumentation();for(const k of documentationFields)d.revised[k]='Learner-authored instructions for '+k;return preserveInstructions(d);};
it('requires preserved instructions, a reported attempt and a substantive revision without certifying a peer',()=>{
 expect(()=>preserveInstructions(emptyDocumentation())).toThrow('INSTRUCTIONS_INCOMPLETE');const d=authored();expect(()=>preserveInstructions(d)).toThrow('ORIGINAL_INSTRUCTIONS_ALREADY_PRESERVED');
 for(const k of peerAttemptFields)d.peer[k]='Reported attempt requiring human review: '+k;
 expect(reviewDocumentation(d).missing).toEqual(['revision']);d.revised.operation+='   ';expect(reviewDocumentation(d).missing).toEqual(['revision']);
 d.revised.operation+=' Added the missing USB port selection step.';expect(reviewDocumentation(d)).toMatchObject({state:'self-reported',changed:['operation'],assessment:'human-review-required'});
 expect(documentationFromAnswers(documentationAnswers(d))).toEqual(d);expect(exportDocumentation(d).verification.physical).toBe('NOT RUN by this form');
 expect(()=>documentationFromAnswers({verified:'yes'})).toThrow();expect(()=>documentationFromAnswers({peer_scope:'x'.repeat(3001)})).toThrow();
});
it('native writes reject altered original instructions atomically and preserve the record in backup',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-documentation-')),source=new WorkspaceStore(join(root,'source.sqlite')),target=new WorkspaceStore(join(root,'target.sqlite'));
 try{const d=authored();const saved=source.saveLearning({id:'L59',answers:documentationAnswers(d),check:false});const altered=structuredClone(d);altered.original.operation+=' changed';
  expect(()=>source.saveLearning({id:'L59',answers:documentationAnswers(altered),check:false})).toThrow('ORIGINAL_INSTRUCTIONS_IMMUTABLE');expect(source.learning('L59')).toEqual(saved);
  for(const k of peerAttemptFields)d.peer[k]='Reported peer attempt, awaiting human review: '+k;d.revised.operation+=' Clarified the port selection step.';
  const revised=source.saveLearning({id:'L59',answers:documentationAnswers(d),check:true});expect(revised.state).toBe('self-reported');expect(()=>parseLearningRecord('L59',{...revised,state:'checked'})).toThrow('LEARNING_RECORD_STATE_INVALID');
  await source.backup(join(root,'backup.sqlite'));populateBackup(target,inspectBackup(join(root,'backup.sqlite')));expect(target.learning('L59')).toEqual(revised);
 }finally{source.close();target.close();await rm(root,{recursive:true,force:true});}
});
it('standalone HTML escapes learner markup and labels with no scripts or network access',()=>{
 const d=authored();d.revised.operation='<script>alert("x")</script><img src="https://example.com"> & instructions';
 const labels={title:'<unsafe title>',original:'Original',revised:'Revision',peer:'Attempt',notice:'Self reported',fields:Object.fromEntries(documentationFields.map(k=>[k,k])) as Record<typeof documentationFields[number],string>,attempt:Object.fromEntries(peerAttemptFields.map(k=>[k,k])) as Record<typeof peerAttemptFields[number],string>};
 const html=documentationHTML(d,labels);expect(html).toContain("default-src 'none'");expect(html).not.toContain('<script>');expect(html).not.toContain('<img');expect(html).toContain('&lt;script&gt;');expect(html).toContain('&lt;unsafe title&gt;');
});
