
import { buildTimeline } from './lib/replay/timelineBuilder';
import { logger } from './lib/logger';

async function test() {
  const sessionId = 'demo-voice-1';
  console.log(`Building timeline for: ${sessionId}`);
  const result = await buildTimeline(sessionId);
  console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
