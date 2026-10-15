import {expect,type Page} from '@playwright/test';
export async function openAssistant(page:Page){
 const panel=page.locator('#assistant-popover');
 if(!await panel.isVisible())await page.getByRole('button',{name:/^(Ask for help|Помощник|Көмекші)$/}).click();
 await expect(panel).toBeVisible();
}
