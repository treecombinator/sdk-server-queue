/** Consumer side: drive a Worker queue() batch with ack/retry per message. */
export type MessageHandler<T> = (message: T) => Promise<void>;

/**
 * Process a Cloudflare Queues batch: ack on success, retry on throw.
 * Use inside the Worker's `queue(batch, env)` handler.
 */
export async function consumeBatch<T>(batch: MessageBatch<T>, handler: MessageHandler<T>): Promise<void> {
  for (const message of batch.messages) {
    try {
      await handler(message.body);
      message.ack();
    } catch {
      message.retry();
    }
  }
}
