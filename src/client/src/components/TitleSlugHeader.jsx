import { useState, useRef, useEffect } from "react";

export default function TitleSlugHeader({
  mode,
  title,
  slug,
  onTitle,
  onSlug,
}) {
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [tempSlug, setTempSlug] = useState(slug);
  const slugInputRef = useRef(null);

  // 當 slug prop 改變時更新 tempSlug
  useEffect(() => {
    setTempSlug(slug);
  }, [slug]);

  // 當進入編輯模式時，focus input
  useEffect(() => {
    if (isEditingSlug && slugInputRef.current) {
      slugInputRef.current.focus();
      slugInputRef.current.select();
    }
  }, [isEditingSlug]);

  const handleSlugSave = () => {
    onSlug(tempSlug);
    setIsEditingSlug(false);
  };

  const handleSlugKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSlugSave();
    } else if (e.key === "Escape") {
      setTempSlug(slug); // 恢復原值
      setIsEditingSlug(false);
    }
  };

  const handleSlugBlur = () => {
    // 失去焦點時也儲存
    handleSlugSave();
  };

  if (mode === "new") {
    return (
      <div className="space-y-2">
        <input
          className="input input-bordered input-sm w-full max-w-md"
          placeholder="標題"
          value={title}
          onChange={(e) => onTitle(e.target.value)}
        />
        <input
          className="input input-bordered input-sm w-full max-w-md"
          placeholder="slug (URL識別碼)"
          value={slug}
          onChange={(e) => onSlug(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      {/* 左側：標題 */}
      <h2 className="text-xl font-semibold flex-1">標題：{title}</h2>

      {/* 右側：Slug (可點擊編輯) */}
      <div className="flex items-center gap-2">
        {isEditingSlug ? (
          <input
            ref={slugInputRef}
            className="input input-bordered input-xs w-48"
            placeholder="URL識別碼"
            value={tempSlug}
            onChange={(e) => setTempSlug(e.target.value)}
            onKeyDown={handleSlugKeyDown}
            onBlur={handleSlugBlur}
          />
        ) : (
          <button
            onClick={() => setIsEditingSlug(true)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-base-200"
            title="點擊編輯 URL 識別碼"
          >
            <span className="font-mono">/{slug || "未設定"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
