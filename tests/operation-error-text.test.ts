import {it,expect} from 'vitest';
import {operationErrorText} from '../apps/desktop/renderer/operation-error-text';
it('provides localized journal recovery without exposing raw private diagnostics',()=>{
 for(const code of ['PROCESS_LOG_UNAVAILABLE','PROCESS_LOG_UNSAFE','PROCESS_LOG_LIMIT'])for(const locale of ['en','ru','kk'] as const){const text=operationErrorText({code,message:'private fixture path'},locale);expect(text.length).toBeGreaterThan(code.length+30);expect(text.split(code)).toHaveLength(2);expect(text).not.toContain('private fixture path');}
 expect(operationErrorText({code:'toString',message:'unknown diagnostic'},'en')).toBe('toString\nunknown diagnostic');
});

it('explains blocked upload and recovery in all supported languages without claiming SDK corruption',()=>{
 const error={code:'BUILD_ENVIRONMENT_CHANGED',message:'BUILD_ENVIRONMENT_CHANGED'};
 for(const [locale,blocked,recovery] of [['en','Upload is blocked','Compile again'],['ru','Загрузка на плату заблокирована','Повтори сборку'],['kk','Тақшаға жүктеу бұғатталды','Кодты қайта құрастыр']] as const){
  const text=operationErrorText(error,locale);expect(text).toContain(blocked);expect(text).toContain(recovery);expect(text.split(error.code)).toHaveLength(2);expect(text).not.toContain('State: succeeded');
 }
});
it('preserves distinct diagnostics and avoids duplicating an identical code and message',()=>{
 expect(operationErrorText({code:'CORE_MISSING',message:'CORE_MISSING: install the approved core'},'en')).toBe('CORE_MISSING\nCORE_MISSING: install the approved core');
 expect(operationErrorText({code:'TOOLCHAIN_BUSY',message:'private fixture path'},'ru')).not.toContain('private fixture path');
});

it('localizes workspace recovery and cancellation without claiming a successful save',()=>{for(const code of ['PROJECT_CONFLICT','WORKSPACE_BUSY','PROJECT_BUSY','TOOLCHAIN_BUSY','SAVE_CANCELLED','BACKUP_TOO_LARGE'])for(const locale of ['en','ru','kk'] as const){const text=operationErrorText({code,message:'private fixture path'},locale);expect(text.length).toBeGreaterThan(code.length+30);expect(text).not.toContain('private fixture path');expect(text.split(code)).toHaveLength(2);}});

it('explains rejected portable files and bounded project reads without echoing private paths',()=>{for(const code of ['ARCHIVE_UNSAFE','ARCHIVE_FORMAT','ARCHIVE_TOO_LARGE','ARCHIVE_CHANGED','PROJECT_FILE_INVALID','PROJECT_TOO_LARGE'])for(const locale of ['en','ru','kk'] as const){const text=operationErrorText({code,message:'C:/private/student/project.json'},locale);expect(text.length).toBeGreaterThan(code.length+30);expect(text).not.toContain('C:/private');expect(text.split(code)).toHaveLength(2);}});

it('explains rejected tool imports without echoing local bundle paths',()=>{for(const code of ['TOOLCHAIN_MANIFEST_CHANGED','TOOLCHAIN_HASH_MISMATCH','TOOLCHAIN_PATH_UNSAFE','TOOLCHAIN_CORE_MISSING','TOOLCHAIN_MANIFEST_TOO_LARGE'])for(const locale of ['en','ru','kk'] as const){const text=operationErrorText({code,message:'private local file'},locale);expect(text.length).toBeGreaterThan(code.length+30);expect(text).not.toContain('private local file');expect(text.split(code)).toHaveLength(2);}});

it('explains unsupported workspace data and stale opening without exposing private source',()=>{for(const code of ['PROJECT_WORKSPACE_INVALID','PROJECT_WORKSPACE_UNSAFE','PROJECT_OPEN_STALE','PROJECT_FORMAT','TOOLCHAIN_MANIFEST_INVALID'])for(const locale of ['en','ru','kk'] as const){const text=operationErrorText({code,message:'private source'},locale);expect(text.length).toBeGreaterThan(code.length+30);expect(text).not.toContain('private source');}});
