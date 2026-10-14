import {processUncertaintyRequest} from '../../../packages/content/uncertainty-worker';
self.onmessage=(event:MessageEvent<unknown>)=>self.postMessage(processUncertaintyRequest(event.data));
