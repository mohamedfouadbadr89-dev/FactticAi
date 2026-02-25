import { logger } from './logger';
import { isFeatureEnabled } from '@/config/featureFlags';

interface RetryTask {
  id: string;
  payload: any;
  attempt: number;
}

export class WebhookQueue {
  private queue: RetryTask[] = [];
  private maxRetries = 5;

  async enqueue(taskId: string, payload: any): Promise<boolean> {
    if (!isFeatureEnabled('WEBHOOK_RETRY_QUEUE')) {
      logger.warn('Webhook queue disabled. Dropping payload', { taskId });
      return false;
    }
    this.queue.push({ id: taskId, payload, attempt: 0 });
    logger.info('Task enqueued for processing', { taskId });
    this.processNext();
    return true;
  }

  private async processNext() {
    if (this.queue.length === 0) return;
    
    const task = this.queue.shift();
    if (!task) return;

    try {
      // Simulating processing logic...
      if (Math.random() < 0.5) throw new Error('Simulated random failure');
      logger.info('Webhook processed successfully', { taskId: task.id, attempt: task.attempt });
    } catch (error: any) {
      task.attempt++;
      if (task.attempt >= this.maxRetries) {
        logger.error('Webhook permanently failed after max retries', { taskId: task.id, finalAttempt: task.attempt });
      } else {
        const backoffMs = Math.pow(2, task.attempt) * 1000;
        logger.warn(`Webhook failed. Retrying in ${backoffMs}ms`, { taskId: task.id, attempt: task.attempt });
        setTimeout(() => {
          this.queue.push(task);
          this.processNext();
        }, backoffMs);
      }
    }
  }
}

export const webhookQueue = new WebhookQueue();
