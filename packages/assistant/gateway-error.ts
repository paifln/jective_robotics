/** Student-facing gateway failures do not expose provider account configuration. */
export function gatewayHttpError(status:number){
 if(status===401||status===403)return 'AI_ACCESS_UNAVAILABLE';
 if(status===413)return 'AI_QUESTION_TOO_LARGE';
 if(status===429)return 'AI_PROVIDER_HTTP_429';
 return 'AI_SERVICE_UNAVAILABLE';
}
