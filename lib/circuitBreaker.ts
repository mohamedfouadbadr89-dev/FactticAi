import { logger } from './logger';
import { isFeatureEnabled } from '@/config/featureFlags';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface BreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private nextAttempt: number = Date.now();
  private options: BreakerOptions;

  constructor(options: BreakerOptions = { failureThreshold: 3, resetTimeoutMs: 10000 }) {
    this.options = options;
  }

  async execute<T>(action: () => Promise<T>, provider: string): Promise<T> {
    if (!isFeatureEnabled('AI_CIRCUIT_BREAKER')) {
      return action();
    }

    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
        logger.info(`Circuit HALF_OPEN for ${provider}. Testing connection.`);
      } else {
        throw new Error(`CircuitBreaker OPEN for provider ${provider}`);
      }
    }

    try {
      const result = await action();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        logger.info(`Circuit CLOSED for ${provider}. Connection restored.`);
      }
      return result;
    } catch (error: any) {
      this.failureCount++;
      logger.error(`CircuitBreaker execution failed for ${provider}`, { failures: this.failureCount });
      
      if (this.failureCount >= this.options.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.options.resetTimeoutMs;
        logger.warn(`Circuit OPEN for ${provider}. Backing off for ${this.options.resetTimeoutMs}ms`);
      }
      throw error;
    }
  }
}

export const aiBreaker = new CircuitBreaker();
