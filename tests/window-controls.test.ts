import {describe,it,expect,vi} from 'vitest';
import {controlWindow,windowState} from '../apps/desktop/infrastructure/window-controls';

function fixture(){let maximized=false;return {isDestroyed:()=>false,isMaximized:()=>maximized,isFullScreen:()=>false,minimize:vi.fn(),maximize:vi.fn(()=>{maximized=true;}),unmaximize:vi.fn(()=>{maximized=false;}),close:vi.fn(),reload:vi.fn()};}
describe('narrow window control boundary',()=>{
 it('rejects arbitrary commands and object payloads before any native action',()=>{
  const target=fixture();for(const value of ['quit','destroy',{action:'close',windowId:1},null])expect(()=>controlWindow(target,value)).toThrow();expect(target.close).not.toHaveBeenCalled();expect(target.minimize).not.toHaveBeenCalled();expect(target.maximize).not.toHaveBeenCalled();
 });
 it('uses close rather than destructive termination, preserving the unsaved-work path',()=>{
  const target=fixture();expect(controlWindow(target,'close')).toEqual({maximized:false,fullscreen:false});expect(target.close).toHaveBeenCalledOnce();
 });
 it('toggles actual window state and minimizes independently',()=>{
  const target=fixture();expect(controlWindow(target,'toggleMaximize').maximized).toBe(true);expect(controlWindow(target,'toggleMaximize').maximized).toBe(false);controlWindow(target,'minimize');expect(target.maximize).toHaveBeenCalledOnce();expect(target.unmaximize).toHaveBeenCalledOnce();expect(target.minimize).toHaveBeenCalledOnce();
 });
 it('does not call native window operations after destruction',()=>{
  const target={...fixture(),isDestroyed:()=>true};expect(windowState(target)).toEqual({maximized:false,fullscreen:false});expect(()=>controlWindow(target,'close')).toThrow('WINDOW_CLOSED');expect(target.close).not.toHaveBeenCalled();
 });
 it('reloads only the owned window through the explicit recovery command',()=>{const target=fixture();controlWindow(target,'reload');expect(target.reload).toHaveBeenCalledOnce();expect(target.close).not.toHaveBeenCalled();});
});
