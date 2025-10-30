import { useRef, useState } from "react";
import axiosClient from "../api/axiosClient";

export default function PreviewImageUploader({
  value,
  onChange,
  type,
  maxMB = 5,
  hint,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxMB * 1024 * 1024) {
      alert(`圖片大小不能超過 ${maxMB} MB`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await axiosClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(res.data.url);
    } catch {
      alert("上傳失敗");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4 bg-base-200 p-3 rounded-lg">
      <div className="w-24 h-24 bg-base-300 rounded-lg overflow-hidden">
        {value ? (
          <img src={value} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            無預覽圖
          </div>
        )}
      </div>
      <div className="flex-1">
        {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          className="btn btn-sm btn-outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              上傳中...
            </>
          ) : (
            "上傳預覽圖"
          )}
        </button>
      </div>
    </div>
  );
}
