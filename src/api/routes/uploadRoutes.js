import express from "express";
import multer from "multer";
import { uploadToR2 } from "../middleware/uploadR2.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), uploadToR2);

export default router;
