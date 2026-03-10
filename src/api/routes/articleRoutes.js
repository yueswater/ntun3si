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
import { validate } from "../middleware/validate.js";
import { createArticleSchema, updateArticleSchema } from "../validators/articleValidator.js";

const router = express.Router();

// CRUD endpoints
router.post("/", verifyToken, adminOnly, validate(createArticleSchema), createArticle);
router.get("/", getArticles);
router.get("/hot", getHotArticles);
router.get("/:id", getArticle);
router.put("/:id", verifyToken, adminOnly, validate(updateArticleSchema), updateArticle);
router.delete("/:id", verifyToken, adminOnly, deleteArticle);

export default router;
