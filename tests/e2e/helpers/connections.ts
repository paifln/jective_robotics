import type {Page} from '@playwright/test';
import {openComponentConnections} from './studio';
const labels:Record<string,string>={led:'Indicator',button:'Button',leftDirection:'Left motor: direction',leftEnable:'Left motor: speed',rightDirection:'Right motor: direction',rightEnable:'Right motor: speed',leftForward:'Left motor: forward',leftReverse:'Left motor: backward',rightForward:'Right motor: forward',rightReverse:'Right motor: backward'};
export async function assignComponentPin(page:Page,role:string,pin:string){const label=labels[role];if(!label)throw new Error('UNKNOWN_TEST_COMPONENT_ROLE');await page.getByLabel(label,{exact:true}).selectOption(pin);}
export async function openMotorConnections(page:Page){await openComponentConnections(page);await page.getByLabel('Component',{exact:true}).selectOption('motor-direction-enable');}

export async function assignNewDriverPin(page:Page,role:string,pin:string){const label=labels[role];if(!label)throw new Error('UNKNOWN_TEST_COMPONENT_ROLE');await page.getByLabel('New mapping: '+label,{exact:true}).selectOption(pin);}
