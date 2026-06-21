import type { MessageQueue } from "./queue";
import { createCloudflareQueue, type CloudflareQueueConfig } from "./adapters/cloudflare";

export type { MessageQueue } from "./queue";
export type { CloudflareQueueConfig } from "./adapters/cloudflare";
export { consumeBatch, type MessageHandler } from "./consumer";

/** Queue domain factory (producer). Primary adapter: Cloudflare Queues. */
export function createQueue<T>(config: CloudflareQueueConfig<T>): MessageQueue<T> {
  return createCloudflareQueue(config);
}
