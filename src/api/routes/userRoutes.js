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

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// User routes
router.get("/me", verifyToken, getProfile);
router.put("/me", verifyToken, updateMyProfile);
router.delete("/me", verifyToken, deleteMyAccount);
router.get("/verify", verifyEmailToken);

// Admin routes
router.get("/", verifyToken, adminOnly, getAllUsers);
router.get("/:uid", verifyToken, adminOnly, getUserByUid);
// router.put("/:uid", verifyToken, adminOnly, updateUserByUid);
router.put("/:uid", updateUserByUid);
router.delete("/:uid", verifyToken, adminOnly, deleteUserByUid);

export default router;
