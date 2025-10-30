import { forwardRef } from "react";

const MarkdownEditor = forwardRef(function MarkdownEditor(
  { value, onChange, onKeyDown, textareaRef },
  ref
) {
  return (
    <textarea
      ref={textareaRef}
      className="flex-1 textarea textarea-bordered resize-none p-4 font-mono text-sm rounded-none border-0 focus:outline-none"
      defaultValue={value}
      onInput={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="在此輸入 Markdown 內容..."
    />
  );
});

export default MarkdownEditor;
