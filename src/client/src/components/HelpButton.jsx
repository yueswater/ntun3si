import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faXmark } from "@fortawesome/free-solid-svg-icons";
import { marked } from "marked";

/**
 * HelpButton - 右下角懸浮的幫助按鈕
 * @param {string} title - Modal 標題
 * @param {string} markdownPath - Markdown 文件路徑（相對於 public 目錄）
 */
export default function HelpButton({ title = "使用說明", markdownPath }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && markdownPath && !content) {
      loadMarkdown();
    }
  }, [isOpen, markdownPath]);

  const loadMarkdown = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(markdownPath);
      if (!response.ok) {
        throw new Error("無法載入說明文件");
      }
      const text = await response.text();

      // 檢查是否載入到 HTML 而非 Markdown
      if (
        text.trim().startsWith("<!DOCTYPE") ||
        text.trim().startsWith("<html")
      ) {
        throw new Error(
          "檔案路徑錯誤：請確認 Markdown 文件是否放在 public/help/ 目錄下"
        );
      }

      // 配置 marked 選項
      marked.setOptions({
        breaks: true,
        gfm: true,
      });

      const html = marked.parse(text);
      setContent(html);
    } catch (err) {
      console.error("Error loading markdown:", err);
      setError(err.message || "無法載入說明內容");
    } finally {
      setLoading(false);
    }
  };

  // 內聯樣式定義
  const markdownStyles = `
    .help-markdown {
      line-height: 1.7;
      color: inherit;
    }
    .help-markdown h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid;
      opacity: 0.9;
    }
    .help-markdown h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
      opacity: 0.9;
    }
    .help-markdown h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      opacity: 0.9;
    }
    .help-markdown h4 {
      font-size: 1rem;
      font-weight: 700;
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
      opacity: 0.9;
    }
    .help-markdown p {
      margin: 0.75rem 0;
    }
    .help-markdown ul {
      list-style-type: disc;
      margin: 0.75rem 0;
      padding-left: 2rem;
    }
    .help-markdown ol {
      list-style-type: decimal;
      margin: 0.75rem 0;
      padding-left: 2rem;
    }
    .help-markdown li {
      margin: 0.375rem 0;
      padding-left: 0.25rem;
    }
    .help-markdown ul ul {
      list-style-type: circle;
      margin-top: 0.25rem;
      margin-bottom: 0.25rem;
    }
    .help-markdown strong {
      font-weight: 700;
      color: inherit;
    }
    .help-markdown em {
      font-style: italic;
    }
    .help-markdown code {
      background-color: rgba(0, 0, 0, 0.1);
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.9em;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .help-markdown pre {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 1rem 0;
    }
    .help-markdown pre code {
      background-color: transparent;
      padding: 0;
      font-size: 0.875rem;
    }
    .help-markdown blockquote {
      border-left: 4px solid #3b82f6;
      padding-left: 1rem;
      margin: 1rem 0;
      opacity: 0.8;
      font-style: italic;
    }
    .help-markdown a {
      color: #3b82f6;
      text-decoration: underline;
    }
    .help-markdown a:hover {
      opacity: 0.8;
    }
    .help-markdown hr {
      margin: 2rem 0;
      border: 0;
      border-top: 1px solid;
      opacity: 0.2;
    }
    .help-markdown table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    .help-markdown th,
    .help-markdown td {
      border: 1px solid;
      opacity: 0.2;
      padding: 0.5rem;
      text-align: left;
    }
    .help-markdown th {
      font-weight: 700;
      background-color: rgba(0, 0, 0, 0.05);
    }
  `;

  return (
    <>
      <style>{markdownStyles}</style>

      {/* 懸浮按鈕 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all z-40"
        aria-label="幫助"
      >
        <FontAwesomeIcon icon={faQuestionCircle} className="text-2xl" />
      </button>

      {/* Modal */}
      {isOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-3xl max-h-[85vh]">
            {/* 標題與關閉按鈕 */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
              <h3 className="font-bold text-2xl">{title}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
                aria-label="關閉"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xl" />
              </button>
            </div>

            {/* 內容區域 */}
            <div className="overflow-y-auto max-h-[calc(85vh-12rem)]">
              {loading && (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              )}
              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}
              {!loading && !error && content && (
                <div
                  className="help-markdown"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              )}
              {!loading && !error && !content && (
                <p className="text-center py-8 opacity-50">暫無說明內容</p>
              )}
            </div>

            {/* 底部按鈕 */}
            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-primary"
              >
                我知道了
              </button>
            </div>
          </div>

          {/* 背景遮罩 */}
          <div
            className="modal-backdrop bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
        </dialog>
      )}
    </>
  );
}
