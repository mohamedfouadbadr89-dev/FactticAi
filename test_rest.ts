import { createClient } from '@supabase/supabase-js';

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/realtime/v1/api/broadcast';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      messages: [{
        topic: 'realtime:governance:864c43c5-0484-4955-a353-f0435582a4af',
        event: 'broadcast',
        payload: { test: true }
      }]
    })
  });
  console.log("Status:", res.status);
  console.log("Text:", await res.text());
}
run();
