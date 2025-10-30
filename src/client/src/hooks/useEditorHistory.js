import { useRef } from "react";

export default function useEditorHistory() {
  const historyRef = useRef({ past: [], future: [] });

  const push = (value, textareaRef) => {
    const ta = textareaRef.current;
    historyRef.current.past.push({
      value,
      start: ta ? ta.selectionStart : null,
      end: ta ? ta.selectionEnd : null,
    });
    historyRef.current.future = [];
  };

  const apply = (
    setContent,
    queueAutoSave,
    isNew,
    textareaRef,
    entry,
    pushTo
  ) => {
    const ta = textareaRef.current;
    if (pushTo) {
      (historyRef.current[pushTo] || historyRef.current.past).push({
        value: entry.value,
        start: ta ? ta.selectionStart : null,
        end: ta ? ta.selectionEnd : null,
      });
    }
    setContent(entry.value);
    requestAnimationFrame(() => {
      if (textareaRef.current && entry.start != null && entry.end != null) {
        textareaRef.current.setSelectionRange(entry.start, entry.end);
        textareaRef.current.focus();
      }
    });
    if (!isNew) queueAutoSave({ content_md: entry.value });
  };

  const undo = (setContent, queueAutoSave, isNew, textareaRef) => {
    const { past } = historyRef.current;
    if (past.length === 0) return;
    const entry = past.pop();
    apply(setContent, queueAutoSave, isNew, textareaRef, entry, "future");
  };

  const redo = (setContent, queueAutoSave, isNew, textareaRef) => {
    const { future } = historyRef.current;
    if (future.length === 0) return;
    const entry = future.pop();
    apply(setContent, queueAutoSave, isNew, textareaRef, entry, "past");
  };

  const reset = () => (historyRef.current = { past: [], future: [] });

  return { push, undo, redo, reset };
}
