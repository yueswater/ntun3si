import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateMyProfile,
  deleteMyAccount,
  getAllUsers,
  getUserByUid,
  updateUserByUid,
  deleteUserByUid,
} from "../controllers/userController.js";
import { verifyToken, adminOnly } from "../middleware/authMiddleware.js";
import { verifyEmailToken } from "../controllers/userController.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, updateProfileSchema } from "../validators/authValidator.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public routes
router.post("/register", authLimiter, validate(registerSchema), registerUser);
router.post("/login", authLimiter, validate(loginSchema), loginUser);

// User routes
router.get("/me", verifyToken, getProfile);
router.put("/me", verifyToken, validate(updateProfileSchema), updateMyProfile);
router.delete("/me", verifyToken, deleteMyAccount);
router.get("/verify", verifyEmailToken);

// Admin routes
router.get("/", verifyToken, adminOnly, getAllUsers);
router.get("/:uid", verifyToken, adminOnly, getUserByUid);
router.put("/:uid", verifyToken, adminOnly, updateUserByUid);
router.delete("/:uid", verifyToken, adminOnly, deleteUserByUid);

export default router;
