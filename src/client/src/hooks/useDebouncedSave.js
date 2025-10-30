import { useRef, useCallback, useState } from "react";

/**
 * Debounce any async save function.
 * Returns { queue, flush, cancel, isPending }.
 * - queue(payload): schedule save after delay
 * - flush(payload?): run immediately (cancels timer)
 * - cancel(): cancel pending timer
 */
export default function useDebouncedSave(saveFn, delay = 5000) {
  const timerRef = useRef(null);
  const lastPayloadRef = useRef(undefined);
  const [isPending, setIsPending] = useState(false);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      setIsPending(false);
    }
  }, []);

  const run = useCallback(
    async (payload) => {
      try {
        await saveFn(payload);
      } finally {
        setIsPending(false);
      }
    },
    [saveFn]
  );

  const queue = useCallback(
    (payload) => {
      lastPayloadRef.current = payload;
      cancel();
      setIsPending(true);
      timerRef.current = setTimeout(() => run(lastPayloadRef.current), delay);
    },
    [cancel, delay, run]
  );

  const flush = useCallback(
    async (payload) => {
      cancel();
      const toRun = payload !== undefined ? payload : lastPayloadRef.current;
      await run(toRun);
    },
    [cancel, run]
  );

  return { queue, flush, cancel, isPending };
}
