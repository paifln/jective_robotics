import {describe,it,expect} from 'vitest';
import {launchMotivations,selectLaunchMotivation} from '../packages/engagement/launch-motivation';
import {NotificationStore} from '../packages/engagement/notifications';

describe('offline launch motivation',()=>{
 it('never repeats the previous phrase and bounds invalid random input',()=>{
  for(const previous of launchMotivations)for(const random of [0,.5,1,-1,NaN,Infinity]){
   const selected=selectLaunchMotivation(previous.id,random);expect(selected.id).not.toBe(previous.id);expect(launchMotivations).toContain(selected);
  }
  expect(selectLaunchMotivation(null,0)).toBe(launchMotivations[0]);
 });
 it('has unique localized entries and honest source attribution',()=>{
  expect(new Set(launchMotivations.map(item=>item.id)).size).toBe(launchMotivations.length);
  for(const locale of ['en','ru','kk'] as const){expect(new Set(launchMotivations.map(item=>item.text[locale])).size).toBe(launchMotivations.length);}
  for(const item of launchMotivations){for(const text of Object.values(item.text))expect(text.length).toBeGreaterThan(10);if(item.author!=='JECTIVE'){expect(item.source).toMatch(/^https:\/\//);expect(item.original).toBe(item.text.en);}else expect(item.source).toBeUndefined();}
 });
});
describe('bounded session notification history',()=>{
 it('keeps snapshots stable until change and retains only the newest thirty items',()=>{
  const store=new NotificationStore(()=>1234),initial=store.snapshot();expect(store.snapshot()).toBe(initial);
  for(let index=0;index<45;index++)store.add('project-saved','p'+index);
  const snapshot=store.snapshot();expect(snapshot).toHaveLength(30);expect(snapshot[0]).toMatchObject({id:45,detail:'p44',time:1234,read:false});expect(snapshot.at(-1)?.id).toBe(16);expect(initial).toEqual([]);expect(Object.isFrozen(snapshot)).toBe(true);expect(Object.isFrozen(snapshot[0])).toBe(true);
 });
 it('notifies subscribers, marks read, clears and allows clean unsubscribe',()=>{
  const store=new NotificationStore();let changes=0;const unsubscribe=store.subscribe(()=>changes++);
  store.add('build-failed');expect(changes).toBe(1);store.markRead();expect(changes).toBe(2);store.markRead();expect(changes).toBe(2);expect(store.snapshot()[0]?.read).toBe(true);unsubscribe();store.clear();expect(changes).toBe(2);expect(store.snapshot()).toEqual([]);
 });
 it('bounds displayed detail and rejects an unsupported action without publishing it',()=>{
  const store=new NotificationStore();store.add('project-saved','x'.repeat(1000));expect(store.snapshot()[0]?.detail).toHaveLength(160);
  expect(()=>store.add('execute-code' as 'project-saved')).toThrow('INVALID_NOTIFICATION');expect(store.snapshot()).toHaveLength(1);
 });
});
