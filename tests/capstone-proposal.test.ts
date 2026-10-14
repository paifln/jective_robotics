import {it,expect} from 'vitest';
import {proposalFields,emptyCapstoneProposal,proposalFromAnswers,reviewCapstoneProposal,exportCapstoneProposal} from '../packages/content/capstone-proposal';
import {proposalExercise} from '../packages/content/proposal-activity';
import {gradeActivity} from '../packages/content/learning-activities';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import {parseLearningRecord} from '../packages/content/learning-records';
it('keeps simulation and physical plans independent and reports missing scope before a proposal is reviewable',()=>{
 const proposal=emptyCapstoneProposal();expect(reviewCapstoneProposal(proposal).missing).toEqual(proposalFields);
 Object.assign(proposal,{mission:'Stop a rover before a wall without touching it.',components:'Two motors and a driver are available; sensor is not yet verified.',success:'Three runs stop before contact at the same initial speed.',risks:'Unexpected motion: lift wheels, keep a manual stop and supervised power.',simulation:'Use a wall world at fixed speed; record stopping gap and collisions.',outofscope:'No autonomous room exploration or unsupervised battery charging.',nextstep:'Confirm the sensor part and write the smallest stop-controller prototype.'});
 expect(reviewCapstoneProposal(proposal).missing).toEqual(['physical']);proposal.physical='Only after wiring inspection, test with wheels lifted and observe the stop button.';
 expect(reviewCapstoneProposal(proposal)).toMatchObject({state:'self-reported',assessment:'human-review-required',missing:[]});
 const record=exportCapstoneProposal(proposal);expect(record.proposal.simulation).not.toBe(record.proposal.physical);expect(Object.values(record.verification).every(v=>v.startsWith('NOT RUN'))).toBe(true);
 expect(proposalFromAnswers(proposal)).toEqual(proposal);
});
it('rejects unknown fields, claimed verification, oversized data and malformed answer types without certifying prose',()=>{
 expect(()=>proposalFromAnswers({physicalVerification:'passed'})).toThrow();expect(()=>proposalFromAnswers({components:['motor']})).toThrow();expect(()=>proposalFromAnswers({mission:'x'.repeat(3001)})).toThrow();
 expect(()=>exportCapstoneProposal({...emptyCapstoneProposal(),approved:true})).toThrow();
 const arbitrary=Object.fromEntries(proposalFields.map(k=>[k,'Unreviewed statement '.repeat(2)]));expect(reviewCapstoneProposal(arbitrary).state).toBe('self-reported');expect(exportCapstoneProposal(arbitrary).review.assessment).toBe('human-review-required');
});
it('preserves an incomplete then reviewable proposal through SQLite backup without accepting fabricated checked status',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-proposal-')),source=new WorkspaceStore(join(root,'source.sqlite')),target=new WorkspaceStore(join(root,'target.sqlite'));
 try{
  expect(gradeActivity(proposalExercise,{}).state).toBe('incomplete');source.saveLearning({id:'L55',answers:{mission:'Stop before a wall without contact.'},check:true});
  const answers=Object.fromEntries(proposalFields.map(k=>[k,'Learner-authored proposal requiring human review.']));const saved=source.saveLearning({id:'L55',answers,check:true});expect(saved).toMatchObject({state:'self-reported',attempts:2});
  expect(()=>parseLearningRecord('L55',{...saved,state:'checked'})).toThrow('LEARNING_RECORD_STATE_INVALID');
  await source.backup(join(root,'backup.sqlite'));populateBackup(target,inspectBackup(join(root,'backup.sqlite')));expect(target.learning('L55')).toEqual(saved);
 }finally{source.close();target.close();await rm(root,{recursive:true,force:true});}
});
