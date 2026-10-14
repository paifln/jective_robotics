import {processInvestigationRequest} from '../../../packages/content/investigation-worker';
self.onmessage=(event:MessageEvent<unknown>)=>self.postMessage(processInvestigationRequest(event.data));
