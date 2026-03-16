import { Queue, type JobsOptions } from 'bullmq';
import zlib from 'zlib';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};

/**
 * GovernanceQueue
 * 
 * Extends the BullMQ Queue to include backpressure protection.
 * If the queue depth exceeds 50,000 waiting jobs (typically during a database outage),
 * the queue will reject new jobs to prevent Redis memory exhaustion.
 */
class GovernanceQueue extends Queue {
  async add(name: string, data: any, opts?: JobsOptions): Promise<any> {
    const waiting = await this.getWaitingCount();
    
    if (waiting > 50000) {
       throw new Error("QUEUE_OVERFLOW_PROTECTION");
    }

    // ── Fix 2: Economic Redis Persistence ────────────────────────────────────
    // Large governance payloads (unredacted prompts + signals) can trigger
    // memory fragmentation. Compressing here reduces Redis overhead significantly.
    const buffer = Buffer.from(JSON.stringify(data));
    const compressed = zlib.gzipSync(buffer);

    return super.add(name, {
      payload: compressed.toString('base64'),
      compressed: true
    }, opts);
  }

  /**
   * Returns the current number of waiting jobs.
   * Can be used for observability metrics.
   */
  async getQueueDepth() {
    return await this.getWaitingCount();
  }
}

export const governanceQueue = new GovernanceQueue('governance_event_job', { 
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});
