import {it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {BuildStageEventSchema,EnvironmentProgressSchema} from '../packages/contracts/build-stage';
import {buildStageText,buildProgressText} from '../apps/desktop/renderer/build-stage-text';

it('accepts bounded counts only for actual environment stages, never paths or a claimed result',()=>{
 const progress={files:123,bytes:5*1024**2,elapsedMs:1500},projectId=randomUUID();
 for(const stage of ['environment-before','environment-after'])expect(BuildStageEventSchema.safeParse({projectId,stage,progress}).success).toBe(true);
 for(const stage of ['toolchain','compile','artifacts','succeeded'])expect(BuildStageEventSchema.safeParse({projectId,stage,progress}).success).toBe(false);
 for(const invalid of [{...progress,files:-1},{...progress,files:100001},{...progress,bytes:16*1024**3+1},{...progress,elapsedMs:Infinity},{...progress,elapsedMs:0.5},{...progress,path:'private/file'},{...progress,result:'succeeded'}])expect(EnvironmentProgressSchema.safeParse(invalid).success).toBe(false);
});
it('formats informative localized counts without a fake completion percentage',()=>{
 for(const [locale,label]of [['en','Files checked'],['ru','Проверено файлов'],['kk','Тексерілген файлдар']] as const){
  const text=buildProgressText({files:123,bytes:5*1024**2,elapsedMs:1500},locale);expect(text).toContain(label);expect(text).toContain('123');expect(text).toContain('5');expect(text).not.toContain('%');expect(buildStageText('environment-before',locale)).not.toContain('123');
 }
});
