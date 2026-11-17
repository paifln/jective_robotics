import {describe, expect, it} from 'vitest';
import {parsePythonProgram, pythonSketch, pythonUnoExample, updatePythonSketch} from '../packages/codegen/python';
import {createArduinoUnoRobotProject} from '../packages/robots/arduino-uno';
import {ProjectSchema} from '../packages/contracts';

describe('Python projects', ()=>{
 it('lowers setup and nested repeats through the existing robot generator', ()=>{
  const pythonSource = `def setup():
    for _ in range(2):
        for _ in range(3):
            drive(35, -35)
            wait_ms(500)
        stop()

def loop():
    pass
`;
  const project = {...createArduinoUnoRobotProject(crypto.randomUUID()), pythonSource};
  const compiled = updatePythonSketch(project);
  expect(ProjectSchema.parse(JSON.parse(JSON.stringify(compiled)))).toEqual(compiled);
  expect(compiled.source).toContain('void setup()');
  expect(compiled.source).toContain('void loop()');
  expect(compiled.source).toContain('j_motor_drive(35, -35)');
  expect(compiled.source).toContain('j_motor_wait(500)');
  expect(pythonSketch({...compiled,source:'stale'})).toBe(compiled.source);
 });

 it('clears stale C++ when a draft becomes invalid and preserves the Python text', ()=>{
  const project = updatePythonSketch({...createArduinoUnoRobotProject(crypto.randomUUID()), pythonSource:pythonUnoExample});
  expect(project.source).toContain('digitalWrite');
  const pythonSource = 'def loop():\n    import os\n';
  const invalid = updatePythonSketch({...project, pythonSource});
  expect(invalid.source).toBe('');
  expect(invalid.pythonSource).toBe(pythonSource);
  expect(()=>pythonSketch(invalid)).toThrow('line 2');
 });

 it.each([
  ['def loop():\n    for _ in range(2):\n    pass', 2],
  ['def loop():\n        pass', 2],
  ['def loop():\n    wait_ms(60001)', 2],
  ['def loop():\n    led(true)', 2],
 ])('rejects invalid statements with the source line', (source,line)=>{
  expect(()=>parsePythonProgram(source)).toThrow('line '+line);
 });
});
