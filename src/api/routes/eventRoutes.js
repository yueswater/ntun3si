import express from "express";
import {
  createEvent,
  getEvents,
  getEventByUid,
  getEventBySlug,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getParticipants,
} from "../controllers/eventController.js";
import { verifyToken, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/", getEvents);
router.get("/slug/:slug", getEventBySlug);
router.get("/:uid", getEventByUid);

// Admin
router.post("/", verifyToken, adminOnly, createEvent);
router.put("/:uid", verifyToken, adminOnly, updateEvent);
router.delete("/:uid", verifyToken, adminOnly, deleteEvent);
router.get("/:uid/participants", verifyToken, adminOnly, getParticipants);

// User actions
router.post("/:uid/register", verifyToken, registerForEvent);
router.delete("/:uid/register", verifyToken, cancelRegistration);

export default router;
