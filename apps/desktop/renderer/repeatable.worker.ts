import {processRepeatableRequest} from '../../../packages/content/repeatable-worker';
self.onmessage=(event:MessageEvent<unknown>)=>self.postMessage(processRepeatableRequest(event.data));
