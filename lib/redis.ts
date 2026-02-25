import Redis from 'ioredis'
import { isFeatureEnabled } from '@/config/featureFlags'
import { logger } from './logger'

class CacheService {
  private client: Redis | null = null
  private memoryMap: Map<string, { value: any; expiry: number }> =
    new Map()

  private initialized = false
  private connecting = false

  constructor() {
    // Lazy init only
  }

  // ===============================
  // SAFE LAZY INIT
  // ===============================
  private initIfNeeded() {
    if (this.initialized || this.connecting) return
    this.connecting = true

    if (
      !isFeatureEnabled('REDIS_CACHE_LAYER') ||
      !process.env.REDIS_URL
    ) {
      this.initialized = true
      this.connecting = false
      return
    }

    try {
      const redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 0,
        connectTimeout: 1000,
        retryStrategy: () => null, // 🚫 no auto infinite retry
      })

      redis.on('error', (err) => {
        logger.warn('Redis error — fallback to memory', {
          error: err?.message,
        })
        this.safeShutdown()
      })

      redis.on('end', () => {
        logger.warn('Redis connection ended')
        this.safeShutdown()
      })

      this.client = redis
    } catch (err: any) {
      logger.warn('Redis init failed — using memory cache', {
        error: err?.message,
      })
      this.client = null
    }

    this.initialized = true
    this.connecting = false
  }

  private safeShutdown() {
    try {
      this.client?.disconnect()
    } catch {}
    this.client = null
  }

  // ===============================
  // STATUS
  // ===============================
  isReady(): boolean {
    this.initIfNeeded()
    return this.client !== null
  }

  // ===============================
  // GET
  // ===============================
  async get(key: string): Promise<any | null> {
    this.initIfNeeded()

    if (this.client) {
      try {
        const val = await this.client.get(key)
        return val ? JSON.parse(val) : null
      } catch {
        this.safeShutdown()
      }
    }

    const cached = this.memoryMap.get(key)

    if (cached && cached.expiry > Date.now()) {
      return cached.value
    }

    if (cached) this.memoryMap.delete(key)
    return null
  }

  // ===============================
  // SET
  // ===============================
  async set(
    key: string,
    value: any,
    ttlSeconds: number = 60
  ): Promise<void> {
    this.initIfNeeded()

    if (this.client) {
      try {
        await this.client.setex(
          key,
          ttlSeconds,
          JSON.stringify(value)
        )
        return
      } catch {
        this.safeShutdown()
      }
    }

    this.memoryMap.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    })
  }

  // ===============================
  // INCREMENT
  // ===============================
  async increment(key: string): Promise<number> {
    this.initIfNeeded()

    if (this.client) {
      try {
        return await this.client.incr(key)
      } catch {
        this.safeShutdown()
      }
    }

    const cached = this.memoryMap.get(key)
    const newVal = (cached?.value || 0) + 1

    this.memoryMap.set(key, {
      value: newVal,
      expiry:
        cached?.expiry || Date.now() + 60000,
    })

    return newVal
  }

  // ===============================
  // ATOMIC INCREMENT
  // ===============================
  async atomicIncrement(
    key: string,
    ttlSeconds: number
  ): Promise<number> {
    this.initIfNeeded()

    if (!this.client) {
      return this.increment(key)
    }

    try {
      const res = await this.client
        .multi()
        .incr(key)
        .expire(key, ttlSeconds, 'NX')
        .exec()

      if (!res || res[0][0]) {
        throw new Error('Redis transaction failed')
      }

      return res[0][1] as number
    } catch {
      this.safeShutdown()
      return this.increment(key)
    }
  }
}

export const cache = new CacheService()