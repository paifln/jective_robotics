import {it,expect} from 'vitest';
import {assistantErrorText} from '../apps/desktop/renderer/assistant-error-text';

it('shows distinct localized recovery without backend details or fabricated success',()=>{
 for(const locale of ['en','ru','kk'] as const){
  const codes=['AI_DISABLED','AI_BUSY','AI_INTERRUPTED_OR_TIMEOUT','AI_RESPONSE_TOO_LARGE','AI_EMPTY_RESPONSE','AI_CONFIG_INVALID','AI_SECURE_STORAGE_UNAVAILABLE','AI_ENDPOINT_INVALID','AI_ENDPOINT_REQUIRES_HTTPS_OR_LOCALHOST','AI_PROVIDER_HTTP_400','AI_PROVIDER_HTTP_401','AI_PROVIDER_HTTP_403','AI_PROVIDER_HTTP_404','AI_PROVIDER_HTTP_429','AI_PROVIDER_HTTP_503','AI_REQUEST_FAILED'];
  for(const code of codes){const error={code,message:'PRIVATE fixture-key and source path'};const output=assistantErrorText(error,locale);expect(output.length).toBeGreaterThan(40);expect(output).not.toContain(error.message);expect(output).not.toContain(code);}
  expect(assistantErrorText({code:'AI_PROVIDER_HTTP_401'},locale)).not.toBe(assistantErrorText({code:'AI_PROVIDER_HTTP_429'},locale));
 }
 expect(assistantErrorText({code:'AI_PROVIDER_HTTP_401'},'ru')).toContain('API-ключ');
 expect(assistantErrorText({code:'AI_PROVIDER_HTTP_429'},'kk')).toContain('шектеп');
});
it('unknown and inherited codes cannot leak diagnostics or resolve prototype properties',()=>{
 for(const code of ['toString','constructor','__proto__','AI_PROVIDER_HTTP_401: PRIVATE KEY','untrusted diagnostic'])for(const locale of ['en','ru','kk'] as const){expect(assistantErrorText({code},locale)).toBe(assistantErrorText({code:'AI_REQUEST_FAILED'},locale));}
});
