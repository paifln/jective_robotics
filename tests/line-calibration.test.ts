import {test,expect} from 'vitest';
import {calibrateLine,classifyLine,lineCalibrationExample,justifyLineThreshold,parseReflectanceSamples} from '../packages/content/line-calibration';
import {lineCalibrationArtifact} from '../packages/content/line-calibration-artifact';
import {RobotSimulation} from '../packages/simulator';
test('actual reflectance model produces recorded dark/light samples and a midpoint threshold',()=>{
 const result=lineCalibrationExample();expect(result.dark.every(sample=>sample.reflectance===0)).toBe(true);expect(result.light.every(sample=>sample.reflectance===1)).toBe(true);expect(result.calibration.threshold).toBe(.5);expect(result.physicalVerification).toBe('NOT RUN');
});
test('sample limits preserve an uncertain band rather than assigning every reading by midpoint',()=>{
 const calibration=calibrateLine([.1,.15,.2],[.8,.85,.9]);
 expect(calibration.threshold).toBe(.5);expect(classifyLine(.2,calibration)).toBe('dark');expect(classifyLine(.8,calibration)).toBe('light');
 for(const value of [.21,.5,.79,null,NaN,-1,2])expect(classifyLine(value,calibration)).toBe('uncertain');
});
test('overlapping and touching sample ranges cannot produce a justified separating threshold',()=>{
 for(const calibration of [calibrateLine([.2,.4,.6],[.5,.7,.8]),calibrateLine([.1,.2,.5],[.5,.7,.9])]){expect(calibration.separated).toBe(false);expect(calibration.threshold).toBeNull();expect(classifyLine(.1,calibration)).toBe('uncertain');}
});
test('malformed samples reject and copied evidence is not changed by caller mutation',()=>{
 for(const values of [[],[0,0],[NaN,0,0],[1.1,0,0],Array(101).fill(0)])expect(()=>calibrateLine(values,[1,1,1])).toThrow('LINE_CALIBRATION_SAMPLES');
 const dark=[0,0,0],calibration=calibrateLine(dark,[1,1,1]);dark[0]=1;expect(calibration.dark).toEqual([0,0,0]);
});
test('learner threshold must strictly separate samples and retain the uncertainty strategy and rationale',()=>{
 const report=justifyLineThreshold([.1,.15,.2],[.8,.85,.9],.4,'Leave a margin above the darkest-group maximum.');
 expect(report.selectedThreshold).toBe(.4);expect(report.calibration.threshold).toBe(.5);expect(classifyLine(.4,report.calibration)).toBe('uncertain');
 for(const value of [.2,.8,.1,NaN])expect(()=>justifyLineThreshold([.1,.15,.2],[.8,.85,.9],value,'A written justification.')).toThrow('LINE_THRESHOLD_NOT_SEPARATING');
 expect(()=>justifyLineThreshold([0,0,0],[1,1,1],.5,'')).toThrow('LINE_THRESHOLD_JUSTIFICATION');
 expect(()=>justifyLineThreshold([.1,.3,.5],[.4,.6,.9],.45,'A written justification.')).toThrow('LINE_THRESHOLD_NOT_SEPARATING');
});
test('learner reference samples both actual line probes while starter omits right-probe evidence',()=>{
 for(const reference of [false,true]){
  const simulation=new RobotSimulation(reference?lineCalibrationArtifact.reference:lineCalibrationArtifact.starter,lineCalibrationArtifact.world!);
  const trace=[];for(let tick=0;tick<100&&simulation.state.status!=='completed';tick++)trace.push(simulation.step());
  expect(simulation.state.status).toBe('completed');expect(trace.every(state=>!state.collision)).toBe(true);
  expect(trace.some(state=>state.variables.left_reflectance===0)).toBe(true);expect(trace.some(state=>state.variables.left_reflectance===1)).toBe(true);
  if(reference){expect(trace.some(state=>state.variables.right_reflectance===0)).toBe(true);expect(simulation.state.log.filter(line=>line.includes('right='))).toHaveLength(50);}
  else expect(simulation.state.variables.right_reflectance).toBeUndefined();
 }
});
test('sample text accepts decimal commas and rejects missing rows, units and malformed values',()=>{
 expect(parseReflectanceSamples(' 0,1\r\n0.2\r\n1 ')).toEqual([.1,.2,1]);
 for(const text of ['', '0\n0', '0\n\n1', '0\nNaN\n1', '0\n0.2m\n1', '0\n1.1\n1', '0\n1e-1\n1',Array(101).fill('0').join('\n')])expect(()=>parseReflectanceSamples(text)).toThrow('LINE_SAMPLE_TEXT');
});
