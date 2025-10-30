import { useState, useRef, useEffect } from "react";
import MarkdownToolbar from "../markdown/MarkdownToolbar";
import MarkdownEditor from "../markdown/MarkdownEditor";
import MarkdownPreview from "../markdown/MarkdownPreview";

export default function ArticleFormFields({
  content,
  onContentChange,
  previewRef,
  onPickImage,
}) {
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const syncTimer = useRef(null);

  const insertMarkdown = (before, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.slice(start, end);
    const replacement = before + selectedText + after;

    textarea.focus();
    textarea.setSelectionRange(start, end);
    document.execCommand("insertText", false, replacement);

    if (syncTimer.current) cancelAnimationFrame(syncTimer.current);
    syncTimer.current = requestAnimationFrame(() => {
      onContentChange(textarea.value);
    });

    requestAnimationFrame(() => {
      const newPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  const handleKeyDown = (e) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (key === "z" || key === "y") return;

    if (isCtrl && key === "b" && !e.shiftKey) {
      e.preventDefault();
      insertMarkdown("**", "**");
      return;
    }

    if (isCtrl && key === "i" && !e.shiftKey) {
      e.preventDefault();
      insertMarkdown("_", "_");
      return;
    }

    if (isCtrl && key === "u" && !e.shiftKey) {
      e.preventDefault();
      insertMarkdown("<u>", "</u>");
      return;
    }

    if (isCtrl && e.shiftKey && key === "s") {
      e.preventDefault();
      insertMarkdown("~~", "~~");
      return;
    }

    if (isCtrl && key === "`" && !e.shiftKey) {
      e.preventDefault();
      insertMarkdown("`", "`");
      return;
    }

    if (isCtrl && key === "h" && !e.shiftKey) {
      e.preventDefault();
      setShowHeadingMenu((prev) => !prev);
      return;
    }
  };

  const handleHeadingSelect = (level) => {
    insertMarkdown("#".repeat(level) + " ", "");
    setShowHeadingMenu(false);
  };

  // 處理圖片上傳
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 驗證文件類型
    if (!file.type.startsWith("image/")) {
      alert("請選擇圖片檔案");
      return;
    }

    // 驗證文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("圖片大小不能超過 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      // 上傳圖片
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "article");

      const token = localStorage.getItem("token");
      const baseURL =
        import.meta.env.VITE_BASE_URL || "http://localhost:5050/api";

      const response = await fetch(`${baseURL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("上傳失敗");
      }

      const data = await response.json();
      const imageUrl = data.url;

      // 插入圖片 Markdown
      insertMarkdown(`![${file.name}](${imageUrl})`, "");
    } catch (error) {
      console.error("圖片上傳失敗:", error);
      alert("圖片上傳失敗，請稍後重試");
    } finally {
      setUploadingImage(false);
      // 清空 input，允許重複上傳同一張圖片
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (!showHeadingMenu) return;

    const handleClickOutside = (e) => {
      const dropdown = document.getElementById("heading-menu");

      // 如果點擊的是下拉選單內部，不處理
      if (dropdown && dropdown.contains(e.target)) {
        return;
      }

      // 如果點擊的是 heading 按鈕，不處理
      const headingBtn = e.target.closest("[data-heading-btn]");
      if (headingBtn) {
        return;
      }

      // 點擊其他任何地方都關閉
      setShowHeadingMenu(false);
    };

    // 使用 click 事件而不是 mousedown，並在下一個事件循環中添加
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [showHeadingMenu]);

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <div className="w-1/2 flex flex-col border-r border-base-300 relative">
        <MarkdownToolbar
          onBold={() => insertMarkdown("**", "**")}
          onItalic={() => insertMarkdown("_", "_")}
          onUnderline={() => insertMarkdown("<u>", "</u>")}
          onStrike={() => insertMarkdown("~~", "~~")}
          onCode={() => insertMarkdown("`", "`")}
          onList={() => insertMarkdown("- ", "")}
          onOList={() => insertMarkdown("1. ", "")}
          onQuote={() => insertMarkdown("> ", "")}
          onLink={() => insertMarkdown("[連結文字](網址)", "")}
          onImage={() => imageInputRef.current?.click()}
          onHeading={() => setShowHeadingMenu((p) => !p)}
          uploadingImage={uploadingImage}
        />

        {/* 隱藏的圖片上傳 input */}
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        {/* 下拉式標題選單 - 帶動畫 */}
        {showHeadingMenu && (
          <div
            id="heading-menu"
            className="absolute top-12 left-4 bg-base-100 shadow-lg border border-base-300 rounded-md z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleHeadingSelect(lvl)}
                className="block px-4 py-2 w-full text-left hover:bg-base-200 transition-colors duration-150 first:rounded-t-md last:rounded-b-md"
              >
                <span className="font-semibold">H{lvl}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {"#".repeat(lvl)} 標題 {lvl}
                </span>
              </button>
            ))}
          </div>
        )}

        <MarkdownEditor
          value={content}
          onChange={(val) => {
            if (syncTimer.current) cancelAnimationFrame(syncTimer.current);
            syncTimer.current = requestAnimationFrame(() =>
              onContentChange(val)
            );
          }}
          onKeyDown={handleKeyDown}
          textareaRef={textareaRef}
        />
      </div>

      <div className="w-1/2">
        <MarkdownPreview ref={previewRef} content={content} />
      </div>
    </div>
  );
}
