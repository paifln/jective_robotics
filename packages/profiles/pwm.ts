import type {Project} from '../contracts';
import {indicatorPin,projectProfile} from './project';
import type {BoardProfile} from './index';
export function resolveIndicatorPWM(project:Project){
 const profile=projectProfile(project);
 return indicatorPWMConfiguration(profile,indicatorPin(project));
}
export function indicatorPWMConfiguration(profile:BoardProfile,gpio:number|null){
 if(profile.provisional)throw new Error('PWM_PROFILE_PROVISIONAL');
 if(gpio===null)throw new Error('WIRING_UNASSIGNED');
 const pin=profile.pins.find(pin=>pin.gpio===gpio);
 if(!pin||!pin.output||!pin.pwm||pin.reserved)throw new Error('PWM_PIN_CAPABILITY');
 return {gpio,frequencyHz:1000 as const,resolutionBits:8 as const,bootSensitive:pin.bootSensitive,physicalVerification:'NOT RUN' as const};
}
export function checkedPWMPercent(value:number):number{
 if(!Number.isFinite(value)||value<0||value>100)throw new Error('PWM_RANGE');return value;
}
/** Percent is a duty-cycle command, not a measured brightness or motor speed. */
export function quantizePWM(value:number,resolutionBits=8){
 checkedPWMPercent(value);
 if(!Number.isInteger(resolutionBits)||resolutionBits<1||resolutionBits>16)throw new Error('PWM_RESOLUTION_RANGE');
 return Math.round(value/100*(2**resolutionBits-1));
}
