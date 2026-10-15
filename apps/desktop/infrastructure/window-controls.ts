import type {BrowserWindow} from 'electron';
import {WindowActionSchema,type WindowState} from '../../../packages/contracts/window';
type WindowControlTarget=Pick<BrowserWindow,'isDestroyed'|'isMaximized'|'isFullScreen'|'minimize'|'maximize'|'unmaximize'|'close'|'reload'>;

export function windowState(window:WindowControlTarget):WindowState{
 return {maximized:!window.isDestroyed()&&window.isMaximized(),fullscreen:!window.isDestroyed()&&window.isFullScreen()};
}
/** No renderer-selected IDs or arbitrary window commands cross this boundary. */
export function controlWindow(window:WindowControlTarget,value:unknown):WindowState{
 const action=WindowActionSchema.parse(value);
 if(window.isDestroyed())throw new Error('WINDOW_CLOSED');
 if(action==='minimize')window.minimize();
 else if(action==='toggleMaximize'){if(window.isMaximized())window.unmaximize();else window.maximize();}
 else if(action==='reload')window.reload();
 else window.close(); // Keep Electron's beforeunload/unsaved-work confirmation.
 return windowState(window);
}
