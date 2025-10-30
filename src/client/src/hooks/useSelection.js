import { useState, useCallback, useMemo } from "react";

/**
 * Manage a selected item (for modal editors).
 * Returns { selected, open, close, update, isNew }
 */
export default function useSelection(initial = null) {
  const [selected, setSelected] = useState(initial);

  const open = useCallback((item) => setSelected(item || null), []);
  const close = useCallback(() => setSelected(null), []);
  const update = useCallback(
    (patch) =>
      setSelected((prev) =>
        prev
          ? { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }
          : prev
      ),
    []
  );

  const isNew = useMemo(() => selected?.uid === "new", [selected]);

  return { selected, open, close, update, isNew, setSelected };
}
