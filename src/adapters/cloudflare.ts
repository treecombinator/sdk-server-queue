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
      await config.binding.sendBatch(messages.map((body) => ({ body })));
    },
  };
}
