import {processCollisionRequest} from '../../../packages/content/collision-worker';
self.onmessage=(event:MessageEvent<unknown>)=>self.postMessage(processCollisionRequest(event.data));
