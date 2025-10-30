import { useState, useCallback } from "react";
import axiosClient from "../api/axiosClient";

/**
 * File upload helper for <input type="file"> flows.
 * const { upload, uploading } = useFileUpload({ type: "article", maxMB: 5 });
 * await upload(file) -> returns URL string
 */
export default function useFileUpload({
  endpoint = "/upload",
  type = "misc",
  maxMB = 5,
  fieldName = "file",
} = {}) {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file) => {
      if (!file) return null;

      const maxBytes = maxMB * 1024 * 1024;
      if (file.size > maxBytes) {
        throw new Error(`檔案大小不能超過 ${maxMB}MB`);
      }

      const formData = new FormData();
      formData.append(fieldName, file);
      formData.append("type", type);

      setUploading(true);
      try {
        const res = await axiosClient.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const url = res?.data?.url;
        if (!url) throw new Error("上傳成功但未取得網址");
        return url;
      } finally {
        setUploading(false);
      }
    },
    [endpoint, fieldName, maxMB, type]
  );

  return { upload, uploading };
}
