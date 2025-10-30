import { useState } from "react";
import axiosClient from "../api/axiosClient";

export default function ImageUploader({ type, onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await axiosClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(res.data.url);
      alert("上傳成功！");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("上傳失敗，請稍後重試。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && (
        <img src={preview} alt="preview" className="w-40 h-40 object-cover" />
      )}
      <button
        onClick={handleUpload}
        className="btn btn-primary btn-sm w-fit"
        disabled={!file || uploading}
      >
        {uploading ? "上傳中..." : "上傳"}
      </button>
    </div>
  );
}
