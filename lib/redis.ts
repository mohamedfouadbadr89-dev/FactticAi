import Redis from 'ioredis';
import { isFeatureEnabled } from '@/config/featureFlags';
import { logger } from './logger';

class CacheService {
  private client: Redis | null = null;
  private memoryMap: Map<string, { value: any; expiry: number }> = new Map();

  constructor() {
    if (isFeatureEnabled('REDIS_CACHE_LAYER') && process.env.REDIS_URL) {
      try {
        this.client = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 1,
          retryStrategy(times) {
            return Math.min(times * 50, 2000);
          }
        });
        
        this.client.on('error', (err) => {
          logger.warn('Redis connection failed, falling back to memory', { error: err.message });
          this.client = null;
        });
      } catch (err) {
        logger.warn('Failed to initialize Redis, using memory fallback');
      }
    }
  }

  async get(key: string): Promise<any | null> {
    if (this.client) {
      const val = await this.client.get(key);
      return val ? JSON.parse(val) : null;
    }
    const cached = this.memoryMap.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }
    if (cached) this.memoryMap.delete(key);
    return null;
  }

  async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    if (this.client) {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
      return;
    }
    this.memoryMap.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
  }

  async increment(key: string): Promise<number> {
    if (this.client) {
      return await this.client.incr(key);
    }
    const cached = this.memoryMap.get(key);
    const newVal = (cached?.value || 0) + 1;
    this.memoryMap.set(key, { value: newVal, expiry: cached?.expiry || Date.now() + 60000 });
    return newVal;
  }
}

export const cache = new CacheService();
