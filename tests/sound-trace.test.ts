import {it,expect} from 'vitest';
import {TraceEventSchema} from '../packages/simulator/trace';
it('accepts correctly typed indicator/message/PWM/sound traces and rejects malformed worker data',()=>{
 for(const event of [{kind:'led',value:true,channel:2},{kind:'print',value:'message'},{kind:'pwm',value:100,channel:1},{kind:'sound',value:20,durationMs:1},{kind:'sound',value:20000,durationMs:60000},{kind:'soundStop',value:0}])expect(TraceEventSchema.safeParse({timeMs:0,...event}).success).toBe(true);
 for(const event of [{kind:'led',value:1},{kind:'print',value:1},{kind:'pwm',value:-1},{kind:'pwm',value:101},{kind:'pwm',value:'50'},{kind:'sound',value:440},{kind:'sound',value:19,durationMs:200},{kind:'sound',value:20001,durationMs:200},{kind:'sound',value:440.5,durationMs:200},{kind:'sound',value:'440',durationMs:200},{kind:'soundStop',value:1},{kind:'soundStop',value:false},{kind:'print',value:'a',channel:1},{kind:'led',value:true,durationMs:200},{kind:'sound',value:440,durationMs:200,channel:1}])expect(TraceEventSchema.safeParse({timeMs:0,...event}).success).toBe(false);
});
