import {ObstacleAvoidance,type AvoidanceInput} from '../simulator/obstacle-avoidance';
export const avoidanceScenarios=['recovery','blocked','missing-during-turn','manual-stop'] as const;
export type AvoidanceScenario=typeof avoidanceScenarios[number];
/** Declared input sequence, not a ray-world trajectory or measured hardware trace. */
export function avoidanceExperiment(scenario:AvoidanceScenario){
 if(!avoidanceScenarios.includes(scenario))throw new Error('AVOIDANCE_SCENARIO');
 const controller=new ObstacleAvoidance();
 const rows=[];
 for(let timeMs=0;timeMs<=4000;timeMs+=20){
  const missing=scenario==='missing-during-turn'&&timeMs>=300&&timeMs<500;
  const input:AvoidanceInput={timeMs,distanceMeters:missing?null:timeMs===0||(scenario==='recovery'&&timeMs>=640)?1:.2,valid:!missing,stopRequested:scenario==='manual-stop'&&timeMs===300};
  rows.push({input,output:controller.tick(input)});
 }
 return {schemaVersion:1,lessonId:'L26',origin:'controller-model',scenario,settings:{thresholdMeters:.3,maximumAttempts:2,tickMs:20},rows,
  transitions:rows.filter(row=>row.output.transition),
  assumptions:'Explicit sensor input sequence. Commands are percentages; physical pose, motor ramp and collision are not simulated here. Fault and blocked states require a new controller instance.',physicalVerification:'NOT RUN'} as const;
}
