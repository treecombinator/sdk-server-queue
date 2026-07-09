# AGENTS.md — @treecombinator/sdk-server-queue

> Guide for AI agents. Queue domain of the Tree Combinator SDK for Cloudflare Workers.
> A producer factory plus a consumer helper. Pass the Cloudflare Queue binding via config.

## Use

```ts
import { createQueue, consumeBatch } from "@treecombinator/sdk-server-queue";

const queue = createQueue({ binding: env.JOBS });
await queue.enqueue(msg);                                  // or enqueue(msg, { delaySeconds: 60 })
await queue.enqueueBatch([{ body: msg1 }, { body: msg2, delaySeconds: 30 }]);

// consumer Worker:
export default {
  async queue(batch) {
    await consumeBatch(
      batch,
      async (msg) => { /* throw to retry, return to ack */ },
      {
        onError: (msg, error) => console.error(msg, error),
        retryDelaySeconds: (msg, attempts) => Math.min(2 ** attempts, 300),
      },
    );
  },
};
```

`createQueue<T>({ binding })` → `enqueue(msg, options?)` and `enqueueBatch(entries, options?)`, where
`options.delaySeconds` delays delivery and each batch entry is `{ body, delaySeconds? }` (per-entry delay
overrides the batch-level one). `consumeBatch<T>(batch, handler, options?)` acks each message on success
and retries it on throw; `options.onError(message, error)` observes each failure (the message is still
retried), and `options.retryDelaySeconds` is a fixed number of seconds or `(message, attempts) => seconds`
for backoff (`attempts` starts at 1).

## Notes

- Adapter: Cloudflare Queues. `binding` is the queue's producer binding, typed structurally (only
  `send`/`sendBatch`) — no `@cloudflare/workers-types` needed; the real binding and the Worker's
  `MessageBatch` satisfy the package's types as-is.
- `consumeBatch` never throws — ack vs. retry is decided by whether `handler` throws, and a throwing
  `onError` does not affect delivery. `enqueueBatch` slices into chunks of 100 (Cloudflare's
  per-`sendBatch` cap). Zero runtime dependencies.
