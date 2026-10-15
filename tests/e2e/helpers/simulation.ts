import type {Page} from '@playwright/test';
import {expect,type ElectronApplication} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import type {World} from '../../../packages/simulator';
export async function openSimulationTools(page:Page){
 const tools=page.locator('.simulation-controls');if(await tools.getAttribute('open')===null)await tools.locator(':scope>summary').click();
}
export async function runIndicatorExperiment(page:Page){
 const tools=page.locator('.trace-tools');if(await tools.getAttribute('open')===null)await tools.locator(':scope>summary').click();
 await tools.getByRole('button',{name:'Simulate indicator trace',exact:true}).click();
}
/** Exercise the real file-import boundary, including malformed-world rejection. */
export async function importPracticeArea(page:Page,world:unknown){
 await page.getByLabel('Practice area file',{exact:true}).setInputFiles({name:'explicit-test-area.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(world))});
 await expect(page.locator('.world-files [role=status],.world-files [role=alert]')).toHaveCount(1);
}
export async function readPracticeArea(app:ElectronApplication,page:Page,path:string):Promise<World>{
 await app.evaluate(({session},file)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(file));},path);
 await page.getByRole('button',{name:'Save practice area',exact:true}).click();
 await expect.poll(async()=>{try{return JSON.parse(await readFile(path,'utf8')).format;}catch{return '';}}).toBe('jective-world');
 return JSON.parse(await readFile(path,'utf8')).world;
}
