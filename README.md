# @treecombinator/sdk-server-queue

---

> Developed by Danthur Lice.\
> Copyright © 2026 Tree Combinator.\
> Contact: dev (at) treecombinator.com

---

The **queue** domain of the Tree Combinator SDK — a typed producer/consumer pair over Cloudflare Queues. A producer `enqueue`s one message or a batch, optionally delayed; a consumer Worker drains a batch through `consumeBatch`, which acks each message on success and retries it on throw. Zero runtime dependencies.

## Install

```bash
givo add @treecombinator/sdk-server-queue
```

## Use

```ts
import { createQueue, consumeBatch, type QueueMessageBatch } from "@treecombinator/sdk-server-queue";

// Producer — bind a Cloudflare Queue and enqueue typed messages:
type Job = { userId: string; kind: "welcome" };

const queue = createQueue<Job>({ binding: env.JOBS });
await queue.enqueue({ userId: "u1", kind: "welcome" });
await queue.enqueue({ userId: "u2", kind: "welcome" }, { delaySeconds: 60 });
await queue.enqueueBatch([
  { body: { userId: "u3", kind: "welcome" } },
  { body: { userId: "u4", kind: "welcome" }, delaySeconds: 30 },
]);

// Consumer — the Worker's queue() handler drains the batch:
export default {
  async queue(batch: QueueMessageBatch<Job>) {
    await consumeBatch(
      batch,
      async (job) => {
        // process one message; throw to retry it, return to ack it
      },
      {
        onError: (job, error) => console.error("job failed", job, error),
        retryDelaySeconds: (job, attempts) => Math.min(2 ** attempts, 300),
      },
    );
  },
};
```

`createQueue<T>({ binding })` returns a `MessageQueue<T>`:

- `enqueue(message, options?)` — send a single message onto the queue. `options.delaySeconds` delays its delivery.
- `enqueueBatch(entries, options?)` — send many messages; each entry is `{ body, delaySeconds? }` (Cloudflare's `sendBatch` shape), and a per-entry `delaySeconds` overrides the batch-level `options.delaySeconds`. Sliced automatically into chunks of 100 (Cloudflare's per-`sendBatch` cap).

`consumeBatch<T>(batch, handler, options?)` — process a queue batch inside the Worker's `queue()` handler. Each message is `ack`ed when the handler resolves and `retry`ed when it throws, so a failed message is redelivered without affecting its siblings. `handler` is `(message: T) => Promise<void>`. Options:

- `onError(message, error)` — observe each handler failure (log, meter, alert); the message is still retried.
- `retryDelaySeconds` — redelivery delay for retried messages: a fixed number of seconds, or `(message, attempts) => seconds` for backoff (`attempts` starts at 1).

## Notes

- Adapter: Cloudflare Queues. `binding` is the queue's producer binding; the package types it structurally (only `send`/`sendBatch`), so it needs no `@cloudflare/workers-types` — the real binding satisfies it as-is, and so does the `MessageBatch` your Worker receives.
- `consumeBatch` decides ack vs. retry purely from whether `handler` throws — it never throws itself, and an `onError` that throws does not affect delivery.
- Zero runtime dependencies.
