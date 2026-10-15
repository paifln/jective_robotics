import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {englishWorkspace} from './helpers/learning';
import {parkVerificationWindow} from './helpers/window';

test('the learner manual explains server assistance and conversation sharing in all three languages without a key setup route',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-managed-manual-')),env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;delete env.JECTIVE_ASSISTANT_TOKEN;delete env.JECTIVE_ASSISTANT_SERVER;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await englishWorkspace(page);await page.locator('.content>.toolbar').getByRole('button',{name:'Manual',exact:true}).click();
  await expect(page.locator('.library-layout>aside>button')).toHaveCount(8);await page.locator('.library-layout>aside>button').filter({hasText:'Ask for a useful hint'}).click();
  const article=page.locator('.library-layout>article');
  for(const [locale,server,history,oldRoute] of [
   ['en','shared OpenAI key stays on the server','up to ten recent conversation messages','Administrator: configure assistant'],
   ['ru','Общий ключ OpenAI остаётся на сервере','до десяти последних сообщений','Администратор: настройка помощника'],
   ['kk','Ортақ OpenAI кілті серверде қалады','соңғы он хабарламаға дейін','Әкімші: көмекшіні баптау']
  ] as const){await page.locator('main>header>label>select').selectOption(locale);await expect(article).toContainText(server);await expect(article).toContainText(history);await expect(article).not.toContainText(oldRoute);await expect(page.locator('.assistant-setup,input[type=password]')).toHaveCount(0);}
  await page.locator('main>header>label>select').selectOption('en');await page.locator('.library-layout>aside>button').filter({hasText:'Simulation model and reproducibility'}).click();await expect(article).toContainText('Sixteen local worlds');
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-managed-manual-'))throw Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
