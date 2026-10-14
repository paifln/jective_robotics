import {describe,it,expect} from 'vitest';
import {captureCodeReview,reviewStillCurrent,replaceReviewedFile,reviewContext,sourceForReview,codeReviewRecord} from '../packages/assistant/code-review';
import type {Project} from '../packages/contracts';
const project:Project={schemaVersion:1,id:'beec49a3-6147-4007-b33b-fd1cd29ce093',name:'Review',mode:'code',source:'main',sourceFiles:{'helper.cpp':'old helper','config.h':'old config'},profileId:'esp32-devkit-reference',workspace:{},revision:1};
describe('file-specific assistant review',()=>{
 it('exports only captured file comparisons and never fabricates compiler or hardware verification',()=>{
  const review=captureCodeReview(project,'helper.cpp');const record=codeReviewRecord(review,'updated helper','inspect');
  expect(record).toMatchObject({file:'helper.cpp',original:'old helper',proposed:'updated helper',verification:{compilation:'NOT RUN',upload:'NOT RUN',physical:'NOT RUN'}});
  expect(JSON.stringify(record)).not.toContain('old config');expect(JSON.stringify(record)).not.toContain(project.id);
  expect(codeReviewRecord(review,'updated helper','reject').decision).toBe('reject');expect(project.sourceFiles?.['helper.cpp']).toBe('old helper');
  expect(()=>codeReviewRecord(review,'x'.repeat(100001),'inspect')).toThrow();
 });
 it('captures cloned sources and rejects another project, mode, source, file map or hardware context',()=>{
  const review=captureCodeReview(project,'helper.cpp');expect(review.original).toBe('old helper');expect(reviewStillCurrent({...project,revision:2,name:'Renamed'},review)).toBe(true);
  for(const changed of [{...project,id:'9782d155-be1f-48e8-bf55-a9508d8ba9cb'},{...project,mode:'blocks' as const},{...project,source:'changed'},{...project,sourceFiles:{'helper.cpp':'old helper','config.h':'new config'}},{...project,sourceFiles:{}},{...project,profileId:'jective-prototype'},{...project,profileVersion:'new'},{...project,profileHash:'new'},{...project,profileDefinition:{} as Project['profileDefinition']},{...project,wiring:{led:4}}])expect(reviewStillCurrent(changed,review)).toBe(false);
  const mutable={...project,sourceFiles:{...project.sourceFiles}};const snapshot=captureCodeReview(mutable,'config.h');mutable.sourceFiles['config.h']='changed';expect(snapshot.original).toBe('old config');expect(snapshot.project.sourceFiles?.['config.h']).toBe('old config');
 });
 it('changes only the chosen existing file and validates the resulting complete project',()=>{
  const next=replaceReviewedFile(project,'helper.cpp','new helper');expect(next.source).toBe('main');expect(next.sourceFiles).toEqual({'helper.cpp':'new helper','config.h':'old config'});expect(project.sourceFiles?.['helper.cpp']).toBe('old helper');
  expect(replaceReviewedFile(project,'sketch.ino','new main').sourceFiles).toEqual(project.sourceFiles);
  for(const file of ['../escape.cpp','absent.h'])expect(()=>replaceReviewedFile(project,file,'new')).toThrow();expect(()=>replaceReviewedFile(project,'helper.cpp','x'.repeat(100001))).toThrow();expect(()=>replaceReviewedFile(project,'sketch.ino','x'.repeat(500000))).toThrow();
  expect(()=>captureCodeReview({...project,mode:'blocks'},'helper.cpp')).toThrow();expect(()=>sourceForReview(project,'absent.h')).toThrow('REVIEW_FILE_MISSING');
 });
 it('shares only an explicitly selected file, with a strict bound and no project metadata',()=>{
  const review=captureCodeReview(project,'helper.cpp');expect(reviewContext(review,false)).toBe('');expect(reviewContext(review,true)).toBe('Selected source file: helper.cpp\nold helper');expect(reviewContext({...review,original:'x'.repeat(100000)},true)).toHaveLength(35000);
 });
});
