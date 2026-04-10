import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { performance } from 'perf_hooks';
import { GovernancePipeline } from '../governancePipeline';

export interface StressTestOptions {
  org_id: string;
  concurrency: number;
  duration_seconds: number;
  endpoint?: string;
}

export interface StressTestResult {
  total_requests: number;
  success_count: number;
  failure_count: number;
  failure_rate: number;
  latency_p50: number;
  latency_p95: number;
  latency_p99: number;
  /** @deprecated use latency_p95 */
  latency_ms: number;
  throughput_rps: number;
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
  // Synthetic prompts that exercise different governance pathways
  private static STRESS_PROMPTS = [
    'What are your business hours?',
    'Help me reset my password',
    'I need to speak with a human agent',
    'What products do you offer?',
    'Can I get a refund for my order?',
    'Tell me about your pricing plans',
    'How do I cancel my subscription?',
    'I have a question about my invoice',
  ];

  static async runStressTest(options: StressTestOptions): Promise<StressTestResult | null> {
    const { org_id, concurrency, duration_seconds } = options;
    const results: { success: boolean; latency: number }[] = [];
    const startTime = Date.now();
    const endTime = startTime + (duration_seconds * 1000);

    logger.info('STRESS_TEST_START', { org_id, concurrency, duration_seconds });

    try {
      let batchIndex = 0;

      while (Date.now() < endTime) {
        const batch = Array(concurrency).fill(null).map(async (_, i) => {
          const prompt = this.STRESS_PROMPTS[(batchIndex * concurrency + i) % this.STRESS_PROMPTS.length];
          const t0 = performance.now();
          try {
            await GovernancePipeline.execute({
              org_id,
              session_id: `stress_${Date.now()}_${i}`,
              prompt,
            });
            return { success: true, latency: performance.now() - t0 };
          } catch {
            return { success: false, latency: performance.now() - t0 };
          }
        });

        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
        batchIndex++;

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const totalRequests = results.length;
      if (totalRequests === 0) return null;

      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const failures = results.filter(r => !r.success).length;
      const failureRate = (failures / totalRequests) * 100;

      const latencies = results.map(r => r.latency).sort((a, b) => a - b);
      const p = (pct: number) => latencies[Math.max(0, Math.floor(latencies.length * pct) - 1)] ?? 0;
      const p50 = p(0.50);
      const p95 = p(0.95);
      const p99 = p(0.99);
      const throughput = totalRequests / elapsedSeconds;

      const finalResult: StressTestResult = {
        total_requests: totalRequests,
        success_count: totalRequests - failures,
        failure_count: failures,
        failure_rate: Math.round(failureRate * 100) / 100,
        latency_p50: Math.round(p50),
        latency_p95: Math.round(p95),
        latency_p99: Math.round(p99),
        latency_ms: Math.round(p95),
        throughput_rps: Math.round(throughput * 10) / 10,
        executed_at: new Date().toISOString(),
      };

      // Persist to database
      const { error } = await supabaseServer
        .from('stress_test_runs')
        .insert({
          org_id,
          concurrent_sessions: concurrency,
          failure_rate: finalResult.failure_rate,
          latency_ms: finalResult.latency_p95,
          executed_at: finalResult.executed_at,
        });

      if (error) logger.error('STRESS_PERSISTENCE_FAILED', { error: error.message });

      logger.info('STRESS_TEST_COMPLETE', {
        totalRequests,
        failureRate: finalResult.failure_rate,
        p50, p95, p99,
        throughput: finalResult.throughput_rps,
      });

      return finalResult;

    } catch (err: any) {
      logger.error('STRESS_TEST_ERRORED', { error: err.message });
      return null;
    }
  }
}
