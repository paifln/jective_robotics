import {openAssistant} from './helpers/assistant';
import {test,expect,_electron as electron} from '@playwright/test';
import {createServer} from 'node:http';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';

test('provisioned managed assistant opens immediately, retains dialogue and keeps credentials out of student help',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-managed-chat-'));
 const requests:{question:string;context:string;history:{role:string;content:string}[]}[]=[];
 const server=createServer((req,res)=>{let body='';req.on('data',chunk=>body+=chunk);req.on('end',()=>{expect(req.headers.authorization).toBe('Bearer jt_'+'t'.repeat(43));requests.push(JSON.parse(body));res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:'LOCAL GATEWAY FIXTURE '+requests.length},finish_reason:'stop'}]}));});});
 await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();if(!address||typeof address==='string')throw new Error('Missing fixture address');
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((item):item is [string,string]=>item[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;env.JECTIVE_ASSISTANT_SERVER=`http://127.0.0.1:${address.port}`;env.JECTIVE_ASSISTANT_TOKEN='jt_'+'t'.repeat(43);
 const app=await electron.launch({args:['.'],env});
 try{
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>{win.setFocusable(false);win.setPosition(-12000,-12000);win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.setPosition(-12000,-12000));win.showInactive();}));
  const page=await app.firstWindow();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await expect(page.locator('#launch-screen')).toHaveCount(0);
  await page.locator('header>label>select').selectOption('en');await openAssistant(page);
  const chat=page.locator('.learner-chat');await expect(chat.getByLabel('Question',{exact:true})).toBeVisible();await expect(page.locator('.online-help')).toHaveCount(0);
  await chat.getByLabel('Question',{exact:true}).fill('What does wait do?');await chat.getByRole('button',{name:'Request hint',exact:true}).click();await expect(chat.locator('.assistant-answer')).toHaveText('LOCAL GATEWAY FIXTURE 1');
  await chat.getByLabel('Question',{exact:true}).fill('Give another example');await chat.getByRole('button',{name:'Request hint',exact:true}).click();await expect(chat.locator('.assistant-answer')).toHaveText('LOCAL GATEWAY FIXTURE 2');
  expect(requests).toHaveLength(2);expect(requests[0]!.history).toEqual([]);expect(requests[1]!.history).toEqual([{role:'user',content:'What does wait do?'},{role:'assistant',content:'LOCAL GATEWAY FIXTURE 1'}]);expect(requests[1]!.context).toBe('');expect(requests[1]).not.toHaveProperty('model');
  await expect(chat.getByRole('log')).toContainText('What does wait do?');await expect(chat.getByRole('log')).toContainText('Give another example');
  await page.screenshot({path:'test-results/managed-chat-dialogue.png',animations:'disabled'});
  const settings=await page.evaluate(()=>window.jective.assistantSettings());expect(settings).toMatchObject({ok:true,value:{model:'jective-managed',enabled:true,keyConfigured:true}});
  const savedConfiguration=await readFile(join(root,'assistant.json'),'utf8');const denied=await page.evaluate(()=>window.jective.assistantConfigure({enabled:true,endpoint:'https://api.openai.com/v1',model:'SHOULD_NOT_BE_USED',apiKey:'TEST_ONLY_REJECTED_PROVIDER_FIXTURE'}));expect(denied).toMatchObject({ok:false,error:{code:'AI_ADMIN_CONFIGURATION_REQUIRED'}});expect(await readFile(join(root,'assistant.json'),'utf8')).toBe(savedConfiguration);expect(requests).toHaveLength(2);
  expect(await readFile(join(root,'assistant.json'),'utf8')).not.toContain('t'.repeat(43));expect(await app.evaluate(()=>process.env.JECTIVE_ASSISTANT_TOKEN)).toBeUndefined();
  await chat.getByRole('button',{name:'New conversation',exact:true}).click();await expect(chat.getByRole('log')).not.toContainText('What does wait do?');
  await page.locator('header').getByRole('button',{name:'Help',exact:true}).click();await expect(page.locator('.assistant-setup')).toHaveCount(0);await expect(page.locator('.help-dialog input[type=password]')).toHaveCount(0);await page.keyboard.press('Escape');
  await page.setViewportSize({width:800,height:700});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/managed-chat-800.png',animations:'disabled'});expect(errors).toEqual([]);
 }finally{
  await app.evaluate(({app})=>app.exit(0)).catch(()=>{});if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));server.closeAllConnections();await new Promise<void>(done=>server.close(()=>done()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-managed-chat-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});
 }
});
