import {it,expect} from 'vitest';
import {csvCell} from '../packages/persistence/csv';
it('preserves finite signed numeric measurements while neutralizing formula-like text',()=>{
 expect(csvCell(-.052)).toBe('"-0.052"');expect(csvCell(0)).toBe('"0"');expect(csvCell(1e20)).toBe('"100000000000000000000"');expect(csvCell('-0.052')).toBe('"\'-0.052"');for(const text of ['=SUM(1,2)','+cmd','@value','\tformula','\rformula'])expect(csvCell(text)).toContain("\"'");expect(csvCell('quoted "value"')).toBe('"quoted ""value"""');for(const value of [NaN,Infinity,-Infinity])expect(()=>csvCell(value)).toThrow('CSV_NUMBER_INVALID');
});
