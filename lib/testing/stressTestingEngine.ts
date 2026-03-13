import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { performance } from 'perf_hooks';

export interface StressTestOptions {
  org_id: string;
  concurrency: number;
  duration_seconds: number;
  endpoint?: string;
}

export interface StressTestResult {
  total_requests: number;
  failure_rate: number;
  latency_ms: number; // P95
  executed_at: string;
}

/**
 * Stress Testing Engine
 * 
 * CORE RESPONSIBILITY: Test system stability under concurrent AI sessions.
 */
export class StressTestingEngine {
  private static MOCK_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  /**
   * Runs a stress test by spawning concurrent requests.
   */
  static async runStressTest(options: StressTestOptions): Promise<StressTestResult | null> {
    const { org_id, concurrency, duration_seconds, endpoint = '/api/health' } = options;
    const results: { status: number; latency: number }[] = [];
    const startTime = Date.now();
    const endTime = startTime + (duration_seconds * 1000);

    logger.info('STRESS_TEST_START', { org_id, concurrency, duration_seconds });

    try {
      while (Date.now() < endTime) {
        // Execute a batch of concurrent requests
        const batch = Array(concurrency).fill(null).map(async () => {
          const start = performance.now();
          try {
            // Note: In a real environment, we would hit various internal routes
            // to test different database and cache pathways.
            const response = await fetch(`${this.MOCK_BASE_URL}${endpoint}`, {
              method: 'GET',
              headers: { 'Cache-Control': 'no-cache' }
            });
            const lat = performance.now() - start;
            return { status: response.status, latency: lat };
          } catch (err) {
            const lat = performance.now() - start;
            return { status: 500, latency: lat };
          }
        });

        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
        
        // Brief pause to prevent CPU pegging if concurrency is low
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Calculate Metrics
      const totalRequests = results.length;
      if (totalRequests === 0) return null;

      const failures = results.filter(r => r.status >= 500).length;
      const failureRate = (failures / totalRequests) * 100;

      const latencies = results.map(r => r.latency).sort((a, b) => a - b);
      const p95 = latencies[Math.floor(latencies.length * 0.95)];

      const finalResult: StressTestResult = {
        total_requests: totalRequests,
        failure_rate: failureRate,
        latency_ms: p95,
        executed_at: new Date().toISOString()
      };

      // Persist to database
      const { error } = await supabaseServer
        .from('stress_test_runs')
        .insert({
          org_id,
          concurrent_sessions: concurrency,
          failure_rate: finalResult.failure_rate,
          latency_ms: finalResult.latency_ms,
          executed_at: finalResult.executed_at
        });

      if (error) {
        logger.error('STRESS_PERSISTENCE_FAILED', { error: error.message });
      }

      logger.info('STRESS_TEST_COMPLETE', { 
        totalRequests, 
        failureRate: finalResult.failure_rate, 
        p95: finalResult.latency_ms 
      });

      return finalResult;

    } catch (err: any) {
      logger.error('STRESS_TEST_ERRORED', { error: err.message });
      return null;
    }
  }
}
