/**
 * Producer interface of the queue domain. The app calls `enqueue`; the consumer
 * side is a Worker `queue()` handler — drive it with `consumeBatch` (see ./consumer).
 * Primary adapter: Cloudflare Queues.
 */

/** Delivery options for `enqueue` and `enqueueBatch`. */
export interface EnqueueOptions {
  /** Delay delivery by this many seconds. */
  delaySeconds?: number;
}

/** One `enqueueBatch` entry. A per-entry `delaySeconds` overrides the batch-level option. */
export interface QueueBatchEntry<T> {
  body: T;
  delaySeconds?: number;
}

export interface MessageQueue<T = unknown> {
  /** Enqueue a single message. */
  enqueue(message: T, options?: EnqueueOptions): Promise<void>;
  /** Enqueue many messages in one call; each entry wraps its body and may carry its own delay. */
  enqueueBatch(entries: QueueBatchEntry<T>[], options?: EnqueueOptions): Promise<void>;
}
