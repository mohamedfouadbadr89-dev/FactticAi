import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runTest() {
  const orgId = '864c43c5-0484-4955-a353-f0435582a4af';
  const topic = `governance:${orgId}`;
  const restTopic = `realtime:governance:${orgId}`;
  
  const channel = supabase.channel(topic);
  
  channel.on('broadcast', { event: 'governance_event' }, payload => {
    console.log("\n[MSG RECEIVED] event: governance_event");
    console.log(JSON.stringify(payload, null, 2));
  });

  channel.on('broadcast', { event: 'broadcast' }, payload => {
    console.log("\n[MSG RECEIVED] event: broadcast");
    console.log(JSON.stringify(payload, null, 2));
  });
  
  console.log(`Subscribing to ${topic}...`);
  channel.subscribe((status) => console.log('Status:', status));
  
  await new Promise(r => setTimeout(r, 2000));
  
  const payloads = [
    // 1. The original "nested" way
    {
      topic: restTopic,
      event: "broadcast",
      payload: {
        type: "broadcast",
        event: "governance_event",
        payload: { test: 1 }
      }
    },
    // 2. The user's exact suggested way (event: "governance_event" at REST root)
    {
      topic: restTopic,
      event: "governance_event",
      payload: {
        event: "governance_event",
        data: { test: 2 }
      }
    },
    // 3. The way I currently have it (event: broadcast, payload contains event: governance_event but NO type: broadcast)
    {
      topic: restTopic,
      event: "broadcast",
      payload: {
        event: "governance_event",
        data: { test: 3 }
      }
    },
    // 4. Like User's but with 'type: broadcast'
    {
      topic: restTopic,
      event: "governance_event",
      payload: {
        type: "broadcast",
        event: "governance_event",
        data: { test: 4 }
      }
    },
    // 5. REST event 'broadcast', payload type 'broadcast', and direct data
    {
      topic: restTopic,
      event: "broadcast",
      payload: {
        type: "broadcast",
        event: "governance_event",
        data: { test: 5 }
      }
    }
  ];

  for (let i = 0; i < payloads.length; i++) {
    console.log(`\n--- Sending Payload Variation ${i + 1} (topic: ${restTopic}) ---`);
    let res = await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ messages: [payloads[i]] })
    });
    console.log("REST Response:", res.status);
    await new Promise(r => setTimeout(r, 500));
    
    console.log(`--- Sending Payload Variation ${i + 1} (topic: ${topic}) ---`);
    const p2 = { ...payloads[i], topic: topic };
    res = await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ messages: [p2] })
    });
    console.log("REST Response:", res.status);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  supabase.removeChannel(channel);
  console.log("\nFinished.");
  process.exit(0);
}

runTest();
