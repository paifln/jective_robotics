import type {Page} from '@playwright/test';
export async function openStudioProgram(page:Page,settings=false){
 await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await page.locator('.studio-panes').getByRole('button',{name:'Program',exact:true}).click();
 if(settings){const details=page.locator('.student-settings');if(await details.getAttribute('open')===null)await details.locator(':scope>summary').click();}
}
export async function openComponentConnections(page:Page){
 await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await page.locator('.studio-panes').getByRole('button',{name:'Connections',exact:true}).click();
}
