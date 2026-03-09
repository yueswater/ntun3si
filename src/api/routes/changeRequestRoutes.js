import express from "express";
import {
    createChangeRequest,
    getChangeRequests,
    getChangeRequest,
    updateChangeRequest,
    deleteChangeRequest,
    downloadChangeRequestPDF,
} from "../controllers/changeRequestController.js";
import { verifyToken, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, adminOnly, createChangeRequest);
router.get("/", verifyToken, adminOnly, getChangeRequests);
router.get("/:id", verifyToken, adminOnly, getChangeRequest);
router.get("/:id/pdf", verifyToken, adminOnly, downloadChangeRequestPDF);
router.put("/:id", verifyToken, adminOnly, updateChangeRequest);
router.delete("/:id", verifyToken, adminOnly, deleteChangeRequest);

export default router;
