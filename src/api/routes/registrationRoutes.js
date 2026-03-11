import express from "express";
import {
  submitRegistration,
  getEventRegistrations,
  getFormRegistrations,
  getRegistration,
  updateRegistrationStatus,
  deleteRegistration,
  getMyRegistrations,
  cancelMyRegistration,
  exportRegistrations,
  getEventRegistrationCount,
} from "../controllers/registrationController.js";
import {
  verifyToken,
  adminOnly,
  optionalAuth,
} from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { submitRegistrationSchema, updateRegistrationStatusSchema } from "../validators/registrationValidator.js";

const router = express.Router();

// Public/User routes (optionalAuth allows both logged-in and anonymous)
router.post("/event/:eventUid", optionalAuth, validate(submitRegistrationSchema), submitRegistration);
router.get("/event/:eventUid/count", getEventRegistrationCount);

// User routes (requires login)
router.get("/my", verifyToken, getMyRegistrations);
router.patch("/my/:uid/cancel", verifyToken, cancelMyRegistration);

// Admin routes
router.get(
  "/event/:eventUid/list",
  verifyToken,
  adminOnly,
  getEventRegistrations
);
router.get("/form/:formUid", verifyToken, adminOnly, getFormRegistrations);
router.get("/:uid", verifyToken, adminOnly, getRegistration);
router.patch("/:uid/status", verifyToken, adminOnly, validate(updateRegistrationStatusSchema), updateRegistrationStatus);
router.delete("/:uid", verifyToken, adminOnly, deleteRegistration);
router.get(
  "/event/:eventUid/export",
  verifyToken,
  adminOnly,
  exportRegistrations
);

export default router;
