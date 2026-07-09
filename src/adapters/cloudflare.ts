import type { EnqueueOptions, MessageQueue, QueueBatchEntry } from "../queue";

/**
 * Structural slice of the Cloudflare Queues producer binding (`Queue<T>` in
 * `@cloudflare/workers-types`) — only the members this package calls, so apps
 * type-check against it without depending on workers-types.
 */
export interface CloudflareQueueBinding<T> {
  send(message: T, options?: EnqueueOptions): Promise<unknown>;
  sendBatch(messages: QueueBatchEntry<T>[], options?: EnqueueOptions): Promise<unknown>;
}

/** Wraps a Cloudflare Queues producer binding. */
export interface CloudflareQueueConfig<T> {
  binding: CloudflareQueueBinding<T>;
}

export function createCloudflareQueue<T>(config: CloudflareQueueConfig<T>): MessageQueue<T> {
  return {
    async enqueue(message, options) {
      await config.binding.send(message, options);
    },
    async enqueueBatch(entries, options) {
      // Cloudflare Queues caps sendBatch at 100 messages per call.
      for (let i = 0; i < entries.length; i += 100) {
        await config.binding.sendBatch(entries.slice(i, i + 100), options);
      }
    },
  };
}
