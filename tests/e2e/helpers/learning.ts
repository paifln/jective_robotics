import {expect,type Page} from '@playwright/test';
export async function englishWorkspace(page:Page){
 // Functional setup includes cold loading under concurrent SDK scans; startup
 // latency is a separate acceptance measurement, not Playwright's default5s.
 await expect(page.locator('#launch-screen')).toHaveCount(0,{timeout:20000});await page.locator('main>header>label>select').selectOption('en');
}
export async function programmingLesson(page:Page,id:string){
 await page.locator('main>nav').getByRole('button',{name:'Learn',exact:true}).click();
 await page.locator('.content>.toolbar').getByRole('button',{name:'Programming',exact:true}).click();
 await page.getByRole('button',{name:new RegExp('^'+id+' ·')}).click();
}
export async function startLessonProject(page:Page,reference=false){
 if(reference){const details=page.locator('.lesson-actions>details');if(await details.getAttribute('open')===null)await details.locator('summary').click();}
 await page.getByRole('button',{name:reference?'Open an example solution':'Start the task in Studio',exact:true}).click();
 await expect(page.locator('.studio')).toBeVisible();
}
/** Enter the programming catalog through the same navigation used by a learner. */
export async function prepareProgrammingWorkspace(page:Page,studio=false,settings=false){
 await englishWorkspace(page);await page.locator('.content>.toolbar').getByRole('button',{name:'Programming',exact:true}).click();
 if(studio){await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();if(settings){const details=page.locator('.student-settings');if(await details.getAttribute('open')===null)await details.locator(':scope>summary').click();}}
}
