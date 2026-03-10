import express from "express";
import {
  createForm,
  getAllForms,
  getFormByEventUid,
  getFormByUid,
  updateForm,
  deleteForm,
  toggleFormStatus,
} from "../controllers/formController.js";
import { verifyToken, adminOnly } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createFormSchema, updateFormSchema } from "../validators/formValidator.js";

const router = express.Router();

// Public routes
router.get("/event/:eventUid", getFormByEventUid);

// Admin routes
router.post("/", verifyToken, adminOnly, validate(createFormSchema), createForm);
router.get("/", verifyToken, adminOnly, getAllForms);
router.get("/:uid", verifyToken, adminOnly, getFormByUid);
router.put("/:uid", verifyToken, adminOnly, validate(updateFormSchema), updateForm);
router.delete("/:uid", verifyToken, adminOnly, deleteForm);
router.patch("/:uid/toggle", verifyToken, adminOnly, toggleFormStatus);

export default router;
