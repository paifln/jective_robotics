import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {createServer} from 'node:http';

test('lesson, saved version and reviewed hint use actual persistence and a labeled local HTTP provider fixture',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-learning-'));
 const requests:{model:string;messages:{role:string;content:string}[]}[]=[];const authorizations:(string|undefined)[]=[];
 let truncated=true;
 const server=createServer((req,res)=>{
  let body='';req.on('data',d=>body+=d);req.on('end',()=>{
   requests.push(JSON.parse(body));authorizations.push(req.headers.authorization);
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:truncated?'length':'stop',message:{content:'TEST FIXTURE: preserve evidence.\n```cpp\nvoid setup(){}\nvoid loop(){}\n```'}}]}));
  });
 });
 await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();if(!address||typeof address==='string')throw new Error('Fixture server not listening');
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',d=>d.accept());const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));
  await page.locator('main>header>label>select').selectOption('en');const nav=page.locator('main>nav');
  await page.locator('.content>.toolbar').getByRole('button',{name:'Programming',exact:true}).click();await page.getByRole('button',{name:/^L01 ·/}).click();
  await expect(page.locator('.content article h3')).toContainText('Exploring the studio');await page.getByRole('button',{name:'Start the task in Studio',exact:true}).click();
  await expect(page.locator('.studio h1')).toContainText('L01');await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',/digitalWrite/);
  await expect.poll(async()=>{const r=await page.evaluate(()=>window.jective.workspace());return r.ok?r.value.recovery?.lessonId:null;}).toBe('L01');
  const state=await page.evaluate(()=>window.jective.workspace());if(!state.ok||!state.value.recovery)throw new Error('Missing real lesson project');const original=state.value.recovery;
  await nav.getByRole('button',{name:'My projects',exact:true}).click();const projects=page.locator('.student-projects');await projects.getByText('Saved versions of the current project',{exact:true}).click();
  await projects.getByLabel('Version name',{exact:true}).fill('Before reviewed hint');await projects.getByRole('button',{name:'Save version',exact:true}).click();await expect(projects).toContainText('Before reviewed hint');
  const versions=await page.evaluate(id=>window.jective.snapshots(id),original.id);expect(versions.ok&&versions.value.some(v=>v.label==='Before reviewed hint')).toBe(true);

  // Real configure IPC, protected storage, HTTP transport and ask handler.
  // Only readiness metadata is overridden: shipping learner UI intentionally
  // accepts OpenAI, whereas this explicitly labeled test uses loopback HTTP.
  expect(await page.evaluate(endpoint=>window.jective.assistantConfigure({enabled:true,endpoint,model:'explicit-test-fixture',apiKey:'TEST_ONLY_DUMMY_SECRET'}),`http://127.0.0.1:${address.port}/v1`)).toMatchObject({ok:true,value:true});
  await app.evaluate(({ipcMain})=>{
   ipcMain.removeHandler('assistant:settings');ipcMain.handle('assistant:settings',()=>({ok:true,value:{enabled:true,keyConfigured:true,endpoint:'https://api.openai.com/v1',model:'EXPLICIT LOCAL TRANSPORT TEST'}}));
  });
  await page.evaluate(()=>window.dispatchEvent(new Event('assistant-settings-changed')));
  await nav.getByRole('button',{name:'Ask for help',exact:true}).click();await expect(page.locator('.learner-chat')).toBeVisible();const chat=page.locator('.learner-chat');
  await chat.getByLabel('Question',{exact:true}).fill('Give a hint without modifying my project');await expect(chat.getByRole('checkbox',{name:/Include my code/})).not.toBeChecked();
  const request=chat.getByRole('button',{name:'Request hint',exact:true});await request.click();await expect(chat.locator('.assistant-request-status')).toContainText('The answer stopped at the response limit');await expect(chat.locator('.assistant-answer')).toHaveText('');await expect(request).toBeEnabled();expect(requests).toHaveLength(1);
  truncated=false;await request.click();await expect(chat.locator('.assistant-answer')).toContainText('TEST FIXTURE: preserve evidence');
  expect(requests).toHaveLength(2);expect(requests[0]!.model).toBe('explicit-test-fixture');for(const r of requests)expect(r.messages.at(-1)!.content).not.toContain('digitalWrite');expect(authorizations).toEqual(['Bearer TEST_ONLY_DUMMY_SECRET','Bearer TEST_ONLY_DUMMY_SECRET']);
  expect(await readFile(join(root,'assistant.json'),'utf8')).not.toContain('TEST_ONLY_DUMMY_SECRET');expect(JSON.stringify(await page.evaluate(()=>window.jective.workspace()))).not.toContain('TEST_ONLY_DUMMY_SECRET');
  await chat.getByText('Review proposed code',{exact:true}).click();await chat.getByRole('button',{name:'Prepare code review',exact:true}).click();await expect(chat.getByRole('button',{name:'Apply reviewed source',exact:true})).toBeEnabled();
  await chat.getByRole('button',{name:'Apply reviewed source',exact:true}).click();await nav.getByRole('button',{name:'Studio',exact:true}).click();await page.getByRole('button',{name:'Blocks + code',exact:true}).click();
  await expect(page.getByText('Blocks • preserved original',{exact:true})).toBeVisible();await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source','void setup(){}\nvoid loop(){}\n');
  const preserved=await page.evaluate(id=>window.jective.workspaceProject(id),original.id);expect(preserved.ok&&preserved.value?.source).toBe(original.source);expect(preserved.ok&&preserved.value?.workspace).toEqual(original.workspace);expect(errors).toEqual([]);
 }finally{
  if(app.process().exitCode===null&&app.process().signalCode===null)await app.evaluate(({app})=>app.exit(0)).catch(()=>{});
  if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));
  server.closeAllConnections();await new Promise<void>(done=>server.close(()=>done()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-learning-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});
 }
});
