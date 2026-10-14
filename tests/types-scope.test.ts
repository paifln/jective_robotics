import {describe,it,expect} from 'vitest';
import {divisionObservation,divisionBoundaries,scopeTrace,typesScopeArtifact,invalidScopeSource} from '../packages/content/types-scope';
import {codeLessonArtifacts} from '../packages/content/code-lessons';
describe('L38 bounded types and scope teaching model',()=>{
 it('reveals fractions lost before a late conversion and truncates negatives toward zero',()=>{
  expect(divisionBoundaries.map(input=>divisionObservation(input).integerResult)).toEqual([0,0,1,2,-1,-1]);
  const result=divisionObservation({numerator:3,denominator:2});expect(result.floatingResult).toBe(1.5);expect(result.lateConversion).toBe(1);expect(result.positive).toBe(true);
  expect(divisionObservation({numerator:-3,denominator:2}).floatingResult).toBe(-1.5);expect(divisionObservation({numerator:0,denominator:2}).positive).toBe(false);
 });
 it('rejects zero divisors, unsafe teaching inputs and extra fields',()=>{
  for(const input of [{numerator:3,denominator:0},{numerator:3.5,denominator:2},{numerator:10001,denominator:2},{numerator:3,denominator:Infinity},{numerator:3,denominator:2,extra:true}])expect(()=>divisionObservation(input)).toThrow();
 });
 it('contrasts recreated local lifetime with file lifetime without executing hardware',()=>{
  expect(scopeTrace(3)).toEqual([{call:1,localPasses:1,completedPasses:1},{call:2,localPasses:1,completedPasses:2},{call:3,localPasses:1,completedPasses:3}]);expect(scopeTrace(0)).toEqual([]);expect(scopeTrace(20)).toHaveLength(20);for(const n of [-1,21,.5])expect(()=>scopeTrace(n)).toThrow('L38_CALL_COUNT_INVALID');
 });
 it('provides honest text-only starter, correction and deliberately invalid scope fixtures',()=>{
  expect(codeLessonArtifacts.L38).toEqual(typesScopeArtifact);expect(typesScopeArtifact.starter).toContain('const int32_t average = result.integerResult;');expect(typesScopeArtifact.reference).toContain('const double average = result.floatingResult;');expect(invalidScopeSource).toContain('Serial.println(localPasses); // Not declared in setup scope.');expect(typesScopeArtifact.reference).not.toContain('Not declared in setup scope');
 });
});
