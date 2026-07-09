/** Consumer side: drive a Worker `queue()` batch with ack/retry per message. */

/** Structural slice of a Cloudflare Queues message — only the members this package uses. */
export interface QueueMessage<T> {
  readonly body: T;
  ack(): void;
  retry(): void;
}

/** Structural slice of a Cloudflare Queues `MessageBatch` — only the members this package uses. */
export interface QueueMessageBatch<T> {
  readonly messages: readonly QueueMessage<T>[];
}

export type MessageHandler<T> = (message: T) => Promise<void>;

/**
 * Process a Cloudflare Queues batch: ack on success, retry on throw.
 * Use inside the Worker's `queue(batch, env)` handler.
 */
export async function consumeBatch<T>(batch: QueueMessageBatch<T>, handler: MessageHandler<T>): Promise<void> {
  for (const message of batch.messages) {
    try {
      await handler(message.body);
      message.ack();
    } catch {
      message.retry();
    }
  }
}
