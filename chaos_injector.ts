/**
 * Black Swan Simulation: Chaos Injector (v3.4)
 * 
 * Objectives:
 * 1. Simulate Redis Outage.
 * 2. Simulate DB Latency.
 * 3. Simulate Worker Failure.
 */

import { cache } from './lib/redis';
import { supabaseServer } from './lib/supabaseServer';

async function simulateRedisOutage() {
  console.log('[CHAOS] Simulating Redis Outage...');
  // Force manual disconnection or config override
  (cache as any).client = null; 
}

async function simulateDBLatency(ms: number) {
  console.log(`[CHAOS] Injecting ${ms}ms DB Latency...`);
  // This would ideally be done via proxy, but here we can wrap our client
  const originalRpc = supabaseServer.rpc;
  (supabaseServer as any).rpc = async (...args: any[]) => {
    await new Promise(resolve => setTimeout(resolve, ms));
    return (originalRpc as any).apply(supabaseServer, args);
  };
}

async function runChaosSimulation() {
  console.log('--- STARTING BLACK SWAN CHAOS PHASE ---');
  
  await simulateRedisOutage();
  // Check health endpoint - should return 503 Fail-CLOSED for rate-limited routes
  
  await simulateDBLatency(500);
  // Measure impact on ingestion timing
  
  console.log('--- CHAOS PHASE COMPLETE ---');
}

// Exported for orchestrator
export { simulateRedisOutage, simulateDBLatency };
