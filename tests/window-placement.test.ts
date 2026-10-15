import {describe,it,expect} from 'vitest';
import {restoreWindowPlacement} from '../packages/contracts/window-placement';
const primary={x:0,y:0,width:1920,height:1040};
const saved=(bounds={x:100,y:100,width:1100,height:700},maximized=false)=>({version:1,bounds,maximized});
describe('window placement across work areas',()=>{
 it('centers a new window inside the primary usable screen',()=>{expect(restoreWindowPlacement(undefined,[primary]).bounds).toEqual({x:277,y:136,width:1366,height:768});});
 it('preserves valid saved dimensions and maximized state',()=>{expect(restoreWindowPlacement(saved(undefined,true),[primary])).toMatchObject({bounds:{x:100,y:100,width:1100,height:700},maximized:true});});
 it('recovers a disconnected monitor and keeps the whole caption on screen',()=>{expect(restoreWindowPlacement(saved({x:5000,y:2000,width:1300,height:900}),[primary]).bounds).toEqual({x:620,y:140,width:1300,height:900});});
 it('selects an overlapping negative-coordinate monitor',()=>{const left={x:-1600,y:0,width:1600,height:900};expect(restoreWindowPlacement(saved({x:-1500,y:40,width:1000,height:700}),[primary,left]).bounds).toEqual({x:-1500,y:40,width:1000,height:700});});
 it('fits an available screen smaller than the preferred minimum',()=>{expect(restoreWindowPlacement(saved(),[{x:0,y:0,width:640,height:480}])).toMatchObject({bounds:{x:0,y:0,width:640,height:480},minWidth:640,minHeight:480});});
 it('does not trust malformed or out-of-range saved data',()=>{for(const value of [null,{...saved(),extra:true},saved({x:NaN,y:0,width:1000,height:700}),saved({x:0,y:0,width:99999,height:700})])expect(restoreWindowPlacement(value,[primary]).maximized).toBe(false);});
 it('uses safe fallback geometry if screen inventory is unavailable',()=>{expect(restoreWindowPlacement(undefined,[]).bounds).toEqual({x:0,y:0,width:1366,height:768});expect(restoreWindowPlacement(undefined,[{x:0,y:0,width:0,height:0}]).bounds.width).toBe(1366);});
 it('expands undersized saved preferences within the work area',()=>{expect(restoreWindowPlacement(saved({x:0,y:0,width:100,height:100}),[primary]).bounds).toMatchObject({width:760,height:580});});
});
