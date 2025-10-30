import { useState, useEffect, useRef } from "react";
import AppAlert from "./AppAlert";
import AnimatedButton from "./AnimatedButton";

export default function EditorModalShell({
  title,
  onClose,
  onSave,
  flushSave,
  isPending,
  isNew,
  children,
}) {
  const [alert, setAlert] = useState({ type: "", message: "" });
  const modalRef = useRef(null);

  // Ctrl+S 快捷鍵
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSave = async () => {
    try {
      flushSave?.();
      await onSave?.();
      setAlert({ type: "success", message: "儲存成功！" });
    } catch (error) {
      console.error("Save error:", error);
      setAlert({ type: "error", message: "儲存失敗，請稍後再試。" });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]"
      tabIndex={-1}
    >
      <div
        ref={modalRef}
        className="bg-base-100 rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-base-300 px-6 py-3">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>

        <div className="relative flex-1 overflow-y-auto px-4 py-2">
          <div className="sticky top-2 z-50 flex justify-end pr-3">
            {alert.message && (
              <AppAlert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ type: "", message: "" })}
              />
            )}
          </div>
          <div className="pt-2">{children}</div>
        </div>

        <div className="border-t border-base-300 px-6 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {isNew
              ? "新建項目需手動儲存"
              : isPending
              ? "停止輸入 5 秒後自動儲存中..."
              : "已自動儲存"}
          </span>
          <div className="flex gap-3">
            <AnimatedButton
              label="儲存變更"
              icon="faFloppyDisk"
              variant="primary"
              onClick={handleSave}
            />
            <AnimatedButton
              label="關閉"
              icon="faXmark"
              variant="danger"
              onClick={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
