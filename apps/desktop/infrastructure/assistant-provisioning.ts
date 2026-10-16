export type AssistantProvisioning={server:string|undefined;token:string|undefined};
/** Capture only learner provisioning; do not pass these secrets to renderers or CLI children. */
export function takeAssistantProvisioning(env:NodeJS.ProcessEnv):AssistantProvisioning{
 const pending={server:env.JECTIVE_ASSISTANT_SERVER,token:env.JECTIVE_ASSISTANT_TOKEN};
 delete env.JECTIVE_ASSISTANT_TOKEN;
 delete env.OPENAI_API_KEY;
 delete env.ASSISTANT_MASTER_KEY;
 return pending;
}
