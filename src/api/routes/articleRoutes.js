import express from "express";
import {
  createArticle,
  getArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  getHotArticles,
} from "../controllers/articleController.js";
import { verifyToken, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// CRUD endpoints
router.post("/", verifyToken, adminOnly, createArticle); // Create
router.get("/", getArticles); // Read all
router.get("/hot", getHotArticles); // Hot articles
router.get("/:id", getArticle); // Read single (by UID or slug)
router.put("/:id", verifyToken, adminOnly, updateArticle); // Update
router.delete("/:id", verifyToken, adminOnly, deleteArticle); // Delete

export default router;
