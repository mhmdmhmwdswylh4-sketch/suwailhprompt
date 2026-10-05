import "server-only";

/** Per-instance concurrency gate for expensive upstream (LLM) calls, with a bounded wait queue. */
const MAX = Number(process.env.ENGINEER_MAX_CONCURRENT || 24);
const MAX_QUEUE = Number(process.env.ENGINEER_MAX_QUEUE || 60);
const WAIT_MS = 12_000;

let active = 0;
const queue: { go: () => void }[] = [];

export type Release = () => void;

export function acquire(): Promise<Release | null> {
  const mk = (): Release => {
    let done = false;
    return () => {
      if (done) return;
      done = true;
      active--;
      const next = queue.shift();
      if (next) next.go();
    };
  };
  if (active < MAX) {
    active++;
    return Promise.resolve(mk());
  }
  if (queue.length >= MAX_QUEUE) return Promise.resolve(null);
  return new Promise((resolve) => {
    const entry = {
      go: () => {
        clearTimeout(timer);
        active++;
        resolve(mk());
      },
    };
    const timer = setTimeout(() => {
      const i = queue.indexOf(entry);
      if (i >= 0) queue.splice(i, 1);
      resolve(null);
    }, WAIT_MS);
    queue.push(entry);
  });
}

export const loadStats = () => ({ active, queued: queue.length, max: MAX });
