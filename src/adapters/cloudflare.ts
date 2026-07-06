import type { MessageQueue } from "../queue";

/** Wraps a Cloudflare Queues producer binding (`Queue<T>` from workers-types). */
export interface CloudflareQueueConfig<T> {
  binding: Queue<T>;
}

export function createCloudflareQueue<T>(config: CloudflareQueueConfig<T>): MessageQueue<T> {
  return {
    async enqueue(message) {
      await config.binding.send(message);
    },
    async enqueueBatch(messages) {
      // Cloudflare Queues caps sendBatch at 100 messages per call.
      for (let i = 0; i < messages.length; i += 100) {
        await config.binding.sendBatch(messages.slice(i, i + 100).map((body) => ({ body })));
      }
    },
  };
}
