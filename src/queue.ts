/**
 * Producer interface of the queue domain. The app calls `enqueue`; the consumer
 * side is a Worker `queue()` handler — drive it with `consumeBatch` (see ./consumer).
 * Primary adapter: Cloudflare Queues.
 */
export interface MessageQueue<T = unknown> {
  /** Enqueue a single message. */
  enqueue(message: T): Promise<void>;
  /** Enqueue many messages in one call. */
  enqueueBatch(messages: T[]): Promise<void>;
}
