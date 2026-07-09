/** Consumer side: drive a Worker `queue()` batch with ack/retry per message. */

/** Structural slice of a Cloudflare Queues message — only the members this package uses. */
export interface QueueMessage<T> {
  readonly body: T;
  /** Delivery attempts made for this message, starting at 1. */
  readonly attempts: number;
  ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}

/** Structural slice of a Cloudflare Queues `MessageBatch` — only the members this package uses. */
export interface QueueMessageBatch<T> {
  readonly messages: readonly QueueMessage<T>[];
}

export type MessageHandler<T> = (message: T) => Promise<void>;

export interface ConsumeBatchOptions<T> {
  /** Observes a message the handler failed on; the message is still retried. */
  onError?: (message: T, error: unknown) => void;
  /**
   * Redelivery delay in seconds for retried messages: a fixed value, or a
   * function of the message and its delivery attempt count (for backoff).
   */
  retryDelaySeconds?: number | ((message: T, attempts: number) => number);
}

/**
 * Process a Cloudflare Queues batch: ack on success, retry on throw.
 * Use inside the Worker's `queue(batch, env)` handler. Never throws — a
 * failing message is retried (optionally delayed) without affecting siblings.
 */
export async function consumeBatch<T>(
  batch: QueueMessageBatch<T>,
  handler: MessageHandler<T>,
  options: ConsumeBatchOptions<T> = {},
): Promise<void> {
  for (const message of batch.messages) {
    try {
      await handler(message.body);
      message.ack();
    } catch (error) {
      try {
        options.onError?.(message.body, error);
      } catch {
        // Delivery must not depend on the observer.
      }
      let retry: { delaySeconds: number } | undefined;
      try {
        retry = retryOptions(message, options.retryDelaySeconds);
      } catch {
        // A failing delay function degrades to an undelayed retry.
      }
      message.retry(retry);
    }
  }
}

function retryOptions<T>(
  message: QueueMessage<T>,
  delay: ConsumeBatchOptions<T>["retryDelaySeconds"],
): { delaySeconds: number } | undefined {
  if (delay === undefined) return undefined;
  return { delaySeconds: typeof delay === "function" ? delay(message.body, message.attempts) : delay };
}
