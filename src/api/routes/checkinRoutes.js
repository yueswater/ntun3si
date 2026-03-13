import { Router } from "express";
import {
    verifyDashboardPassword,
    getCheckinEvents,
    checkinAttendee,
    checkoutAttendee,
    getEventAttendees,
    exportCheckinSignInSheet,
} from "../controllers/checkinController.js";

const router = Router();

// Verify dashboard password
router.post("/verify-password", verifyDashboardPassword);

// Get event list for dashboard dropdown
router.get("/events", getCheckinEvents);

// Attendee check-in
router.post("/event/:eventUid", checkinAttendee);

// Attendee check-out
router.post("/event/:eventUid/checkout", checkoutAttendee);

// Dashboard: get attendee list (password-protected via header)
router.get("/event/:eventUid/attendees", getEventAttendees);

// Dashboard: export sign-in sheet PDF (password-protected via header)
router.get("/event/:eventUid/signin-pdf", exportCheckinSignInSheet);

export default router;
