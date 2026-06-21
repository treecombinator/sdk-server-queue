# @treecombinator/sdk-server-queue

---

> Developed by Danthur Lice.\
> Copyright © 2026 Tree Combinator.\
> Contact: dev (at) treecombinator.com

---

The **queue** domain of the Tree Combinator SDK — a typed producer/consumer pair over Cloudflare Queues. A producer `enqueue`s one message or a batch; a consumer Worker drains a batch through `consumeBatch`, which acks each message on success and retries it on throw. Zero runtime dependencies.

## Install

```bash
npm install github:treecombinator/sdk-server-queue
```

## Use

```ts
import { createQueue, consumeBatch } from "@treecombinator/sdk-server-queue";

// Producer — bind a Cloudflare Queue and enqueue typed messages:
type Job = { userId: string; kind: "welcome" };

const queue = createQueue<Job>({ binding: env.JOBS });
await queue.enqueue({ userId: "u1", kind: "welcome" });
await queue.enqueueBatch([
  { userId: "u2", kind: "welcome" },
  { userId: "u3", kind: "welcome" },
]);

// Consumer — the Worker's queue() handler drains the batch:
export default {
  async queue(batch: MessageBatch<Job>) {
    await consumeBatch(batch, async (job) => {
      // process one message; throw to retry it, return to ack it
    });
  },
};
```

`createQueue<T>({ binding })` returns a `MessageQueue<T>`:

- `enqueue(message)` — send a single message onto the queue.
- `enqueueBatch(messages)` — send many messages in one call.

`consumeBatch<T>(batch, handler)` — process a `MessageBatch<T>` inside the Worker's `queue()` handler. Each message is `ack`ed when the handler resolves and `retry`ed when it throws, so a failed message is redelivered without affecting its siblings. `handler` is `(message: T) => Promise<void>`.

## Notes

- Adapter: Cloudflare Queues. `binding` is the producer `Queue<T>` binding from `@cloudflare/workers-types`.
- `consumeBatch` decides ack vs. retry purely from whether `handler` throws — it never throws itself.
- Zero runtime dependencies.
