export type AssistantProvisioning={server:string|undefined;token:string|undefined};
declare const __JECTIVE_ASSISTANT_PROVISIONING__:AssistantProvisioning|null;
export function bundledAssistantProvisioning():AssistantProvisioning|null{
 return typeof __JECTIVE_ASSISTANT_PROVISIONING__==='undefined'?null:__JECTIVE_ASSISTANT_PROVISIONING__;
}
/** Capture only learner provisioning; do not pass these secrets to renderers or CLI children. */
export function takeAssistantProvisioning(env:NodeJS.ProcessEnv):AssistantProvisioning{
 const pending={server:env.JECTIVE_ASSISTANT_SERVER,token:env.JECTIVE_ASSISTANT_TOKEN};
 delete env.JECTIVE_ASSISTANT_TOKEN;
 delete env.OPENAI_API_KEY;
 delete env.ASSISTANT_MASTER_KEY;
 return pending;
}
