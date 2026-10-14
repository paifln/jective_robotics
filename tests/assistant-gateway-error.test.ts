import {it,expect} from 'vitest';
import {gatewayHttpError} from '../packages/assistant/gateway-error';
import {assistantErrorText} from '../apps/desktop/renderer/assistant-error-text';
it('gateway failures give learner recovery without directing them to provider keys or models',()=>{
 for(const status of [400,401,403,404,413,429,500,502,503,504])for(const locale of ['en','ru','kk'] as const){
  const output=assistantErrorText({code:gatewayHttpError(status)},locale);
  // “Подключение” is a connection, not a reference to an API “ключ”.
  expect(output.length).toBeGreaterThan(40);expect(output).not.toMatch(/API|OpenAI|model|модел|кілт|(?<!\p{L})ключ(?!\p{L})|Help|«Помощь»/iu);
 }
 expect(gatewayHttpError(401)).not.toBe(gatewayHttpError(429));expect(gatewayHttpError(413)).toBe('AI_QUESTION_TOO_LARGE');
});
