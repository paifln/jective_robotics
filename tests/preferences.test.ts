import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import {PreferencesSchema} from '../packages/contracts';
it('partial preference updates survive reopen and validated backup without overwriting unrelated settings',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-preferences-'));let store=new WorkspaceStore(join(root,'workspace.sqlite'));const restored=new WorkspaceStore(join(root,'restored.sqlite'));
 try{
  expect(store.state().theme).toBe('light');expect(store.state().locale).toBe('ru');store.preferences({locale:'en'});store.preferences({theme:'dark'});expect(store.state().locale).toBe('en');store.preferences({theme:'light'});
  store.preferences({locale:'kk',role:'teacher',onboarded:true});store.preferences({theme:'light'});store.preferences({locale:'ru'});
  store.close();store=new WorkspaceStore(join(root,'workspace.sqlite'));
  expect(store.state()).toMatchObject({locale:'ru',role:'teacher',onboarded:true,theme:'light'});
  await store.backup(join(root,'backup.sqlite'));populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));
  expect(restored.state()).toMatchObject({locale:'ru',role:'teacher',onboarded:true,theme:'light'});
  for(const invalid of [{},{theme:'neon'},{role:'administrator'},{theme:undefined},{unknown:true}])expect(PreferencesSchema.safeParse(invalid).success).toBe(false);
  store.db.prepare("UPDATE settings SET value='neon' WHERE key='theme'").run();await store.backup(join(root,'invalid.sqlite'));expect(()=>inspectBackup(join(root,'invalid.sqlite'))).toThrow();
 }finally{store.close();restored.close();await rm(root,{recursive:true,force:true});}
});
