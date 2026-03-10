import express from "express";
import multer from "multer";
import { uploadToR2 } from "../middleware/uploadR2.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
];

const upload = multer({
    dest: "uploads/",
    limits: { fileSize: parseInt(process.env.MAX_UPLOAD_SIZE_MB || "5", 10) * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} is not allowed`), false);
        }
    },
});

const router = express.Router();

router.post("/", verifyToken, upload.single("file"), uploadToR2);

export default router;
