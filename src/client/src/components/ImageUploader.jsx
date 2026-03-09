import { useState } from "react";
import axiosClient from "../api/axiosClient";
import { useToast } from "../contexts/ToastContext";
import { useTranslation } from "react-i18next";

export default function ImageUploader({ type, onUploaded }) {
  const toast = useToast();
  const { t } = useTranslation();
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
      toast.success(t("toast.upload_success"));
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(t("toast.upload_failed"));
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
