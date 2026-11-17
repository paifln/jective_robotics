import type {Project} from '../contracts';
import {allInstructions, type Instruction, type Program} from './index';
import {generateForProject} from './project';

export const pythonUnoExample = `def loop():
    led(True)
    wait_ms(500)
    led(False)
    wait_ms(500)
`;

export class PythonSyntaxError extends Error {
 constructor(readonly line: number) {
  super(`Unsupported Python syntax at line ${line}`);
 }
}

function command(code: string): Instruction | null | undefined {
 if (code === 'pass') return null;
 const led = /^led\( *(True|False) *\)$/.exec(code);
 if (led) return {kind:'led', on:led[1] === 'True'};
 if (/^stop\( *\)$/.test(code)) return {kind:'stop'};
 const wait = /^wait_ms\( *(0|[1-9]\d*) *\)$/.exec(code);
 if (wait && Number(wait[1]) <= 60000) return {kind:'wait', ms:Number(wait[1])};
 const drive = /^drive\( *(-?(?:0|[1-9]\d*)) *, *(-?(?:0|[1-9]\d*)) *\)$/.exec(code);
 if (drive && drive.slice(1).every(value => Math.abs(Number(value)) <= 100)) {
  return {kind:'drive', left:Number(drive[1]), right:Number(drive[2])};
 }
}

export function parsePythonProgram(source: string): Program {
 const program: Program = {setup:[], loop:[]};
 const sections = new Set<string>();
 const lines = source.split(/\r?\n/);
 const blocks: {body:Instruction[]; hasStatement:boolean; line:number}[] = [];
 for (const [index, raw] of lines.entries()) {
  const comment = raw.indexOf('#');
  const code = (comment < 0 ? raw : raw.slice(0, comment)).trimEnd();
  if (!code) continue;
  const line = index + 1;
  const indent = /^ */.exec(code)![0].length;
  const depth = indent / 4;
  if (!Number.isInteger(depth) || depth > 24) throw new PythonSyntaxError(line);
  while (blocks.length > depth) {
   const previous = blocks.pop()!;
   if (!previous.hasStatement) throw new PythonSyntaxError(previous.line);
  }
  if (!depth) {
   const name = code === 'def setup():' ? 'setup' : code === 'def loop():' ? 'loop' : undefined;
   if (!name || sections.has(name)) throw new PythonSyntaxError(line);
   sections.add(name);
   blocks.push({body:program[name], hasStatement:false, line});
   continue;
  }
  const block = blocks[depth - 1];
  if (!block) throw new PythonSyntaxError(line);
  const statement = code.slice(indent);
  const repeat = /^for _ in range\( *(0|[1-9]\d*) *\):$/.exec(statement);
  if (repeat && Number(repeat[1]) <= 1000) {
   const body: Instruction[] = [];
   block.body.push({kind:'repeat', count:Number(repeat[1]), body});
   blocks.push({body, hasStatement:false, line});
  } else {
   const instruction = command(statement);
   if (instruction === undefined) throw new PythonSyntaxError(line);
   if (instruction) block.body.push(instruction);
  }
  block.hasStatement = true;
 }
 for (const block of blocks) if (!block.hasStatement) throw new PythonSyntaxError(block.line);
 if (!sections.size) throw new PythonSyntaxError(1);
 allInstructions(program);
 return program;
}

export function pythonSketch(project: Project): string {
 return project.pythonSource === undefined ? project.source :
  generateForProject(parsePythonProgram(project.pythonSource), project);
}

export function updatePythonSketch(project: Project): Project {
 if (project.pythonSource === undefined) return project;
 try {
  return {...project, source:pythonSketch(project)};
 } catch {
  return {...project, source:''};
 }
}
