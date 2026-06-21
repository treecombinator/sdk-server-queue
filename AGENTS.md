# AGENTS.md — @treecombinator/sdk-server-queue

> Guide for AI agents. Queue domain of the Tree Combinator SDK for Cloudflare Workers.
> A producer factory plus a consumer helper. Pass the Cloudflare Queue binding via config.

## Use

```ts
import { createQueue, consumeBatch } from "@treecombinator/sdk-server-queue";

const queue = createQueue({ binding: env.JOBS });
await queue.enqueue(msg);                 // or queue.enqueueBatch(msgs)

// consumer Worker:
export default {
  async queue(batch) {
    await consumeBatch(batch, async (msg) => { /* throw to retry, return to ack */ });
  },
};
```

`createQueue<T>({ binding })` → `enqueue(msg)`, `enqueueBatch(msgs)`. `consumeBatch<T>(batch, handler)`
acks each message on success and retries it on throw.

## Notes

- Adapter: Cloudflare Queues. `binding` is the producer `Queue<T>` binding from `@cloudflare/workers-types`.
- `consumeBatch` never throws — ack vs. retry is decided by whether `handler` throws. Zero runtime dependencies.
