export interface SoundCommand {frequencyHz:number;durationMs:number}
/** A timed simulator event; this contract does not select a physical buzzer. */
export function checkedSound(command:SoundCommand):SoundCommand{
 if(!Number.isInteger(command.frequencyHz)||command.frequencyHz<20||command.frequencyHz>20000)throw new Error('SOUND_FREQUENCY_RANGE');
 if(!Number.isInteger(command.durationMs)||command.durationMs<1||command.durationMs>60000)throw new Error('SOUND_DURATION_RANGE');
 return {frequencyHz:command.frequencyHz,durationMs:command.durationMs};
}
