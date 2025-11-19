import express from "express";
import multer from "multer";
import { uploadToR2 } from "../middleware/uploadR2.js";
import { verifyToken, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", verifyToken, adminOnly, upload.single("file"), uploadToR2);

export default router;
