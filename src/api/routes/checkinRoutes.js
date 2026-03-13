import { Router } from "express";
import {
    verifyDashboardPassword,
    getCheckinEvents,
    checkinAttendee,
    getEventAttendees,
} from "../controllers/checkinController.js";

const router = Router();

// Verify dashboard password
router.post("/verify-password", verifyDashboardPassword);

// Get event list for dashboard dropdown
router.get("/events", getCheckinEvents);

// Attendee check-in
router.post("/event/:eventUid", checkinAttendee);

// Dashboard: get attendee list (password-protected via header)
router.get("/event/:eventUid/attendees", getEventAttendees);

export default router;
