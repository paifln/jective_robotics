import {it,expect} from 'vitest';
import {takeAssistantProvisioning} from '../apps/desktop/infrastructure/assistant-provisioning';
it('captures only learner connection details and scrubs provider/master/token values even for incomplete setup',()=>{
 for(const partial of [false,true]){
  const env:NodeJS.ProcessEnv={PATH:'unchanged',JECTIVE_ASSISTANT_TOKEN:'EXPLICIT_LEARNER_FIXTURE',OPENAI_API_KEY:'EXPLICIT_PROVIDER_FIXTURE',ASSISTANT_MASTER_KEY:'EXPLICIT_MASTER_FIXTURE',...(partial?{}:{JECTIVE_ASSISTANT_SERVER:'https://approved.example'})};
  expect(takeAssistantProvisioning(env)).toEqual({server:partial?undefined:'https://approved.example',token:'EXPLICIT_LEARNER_FIXTURE'});expect(env).toEqual({PATH:'unchanged',...(partial?{}:{JECTIVE_ASSISTANT_SERVER:'https://approved.example'})});
 }
 expect(takeAssistantProvisioning({})).toEqual({server:undefined,token:undefined});
});
