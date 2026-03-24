
import { buildTimeline } from './lib/replay/timelineBuilder';

async function test() {
  const sessionId = 'd92587e5-3039-428c-beea-4623591bc575';
  console.log(`Building timeline for: ${sessionId}`);
  const result = await buildTimeline(sessionId);
  console.log('Final Timeline Count:', result?.timeline?.length);
  if (result?.timeline && result.timeline.length > 0) {
    console.log('Sample Event:', JSON.stringify(result.timeline[0], null, 2));
  }
}

test().catch(console.error);
