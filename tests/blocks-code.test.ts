import {test,expect} from 'vitest';
import {blocksCodeMapping,findGeneratedLine} from '../packages/content/blocks-code';
import {interpret} from '../packages/simulator';
test('mapping locates actual includes setup loop runtime calls and stable block comments',()=>{
 const report=blocksCodeMapping();expect(report.mappings).toHaveLength(7);for(const item of report.mappings)expect(report.source.split('\n')[item.line-1]!.trim()).toBe(item.source);expect(report.mappings.find(item=>item.id==='l37-setup-message')!.line).toBeLessThan(report.mappings.find(item=>item.id==='loop')!.line);expect(report.source).toContain('// block:l37-loop-wait');expect(blocksCodeMapping(250).source).toContain('delay(250)');expect(()=>blocksCodeMapping(-1)).toThrow('WAIT_RANGE');
});
test('mapped starter and reference preserve setup once and change actual loop timing',()=>{
 for(const interval of [500,250]){const events=interpret(blocksCodeMapping(interval).program,1000);expect(events.filter(event=>event.value==='BOOT ONCE')).toHaveLength(1);expect(events.filter(event=>event.value==='LOOP STEP').map(event=>event.timeMs)).toEqual(interval===500?[0,500,1000]:[0,250,500,750,1000]);}
});
test('edited source that removes a mapped call reports missing mapping rather than a fabricated source line',()=>{const source=blocksCodeMapping().source.replace('Serial.begin(115200);','// initialization removed');expect(()=>findGeneratedLine(source,'Serial.begin(115200)')).toThrow('L37_MAPPING_MISSING');});
