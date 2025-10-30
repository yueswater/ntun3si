import multer from "multer";
import path from "path";
import fs from "fs";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "../config/r2Client.js";

import dotenv from "dotenv";
dotenv.config();

const upload = multer({ dest: "uploads/" });

/**
 * Map file type to corresponding folder in R2 bucket
 * Supported types: avatar, article, event
 * Default: misc
 */
const getFolderPath = (type) => {
  const folderMap = {
    avatar: "avatar",
    article: "article",
    event: "event",
  };

  return folderMap[type] || "misc";
};

export const uploadToR2 = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Get file type from request body (sent from frontend)
    const fileType = req.body.type || "misc";
    const folder = getFolderPath(fileType);

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname);
    const baseName = path.basename(req.file.originalname, ext);

    // Construct S3 key with folder structure
    const key = `${folder}/${Date.now()}_${baseName}${ext}`;

    const fileData = fs.readFileSync(filePath);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: fileData,
        ContentType: req.file.mimetype,
      })
    );

    // Clean up temporary file
    fs.unlinkSync(filePath);

    // Construct public URL
    const url = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;

    console.log(`File uploaded successfully to: ${key}`);

    return res.json({ message: "Upload successful", url });
  } catch (error) {
    console.error("R2 upload failed:", error);
    if (error.$response) {
      console.error("Response status:", error.$response.statusCode);
      console.error("Response body:", error.$response.body);
    }
    return res
      .status(500)
      .json({ message: "Upload failed", error: error.message });
  }
};
