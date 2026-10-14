import {processChallengeRequest} from '../../../packages/content/challenge-worker';
self.onmessage=(event:MessageEvent<unknown>)=>self.postMessage(processChallengeRequest(event.data));
