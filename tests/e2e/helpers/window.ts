import type {ElectronApplication} from '@playwright/test';
/** Keep verification off the owner's desktop without minimizing and pausing simulations. */
export async function parkVerificationWindow(app:ElectronApplication){
 await app.evaluate(({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.webContents.setBackgroundThrottling(false);window.setPosition(-12000,-12000);window.showInactive();});
}
