import express from "express";
import {
  sendMail,
  sendRegistrationEmail,
  sendEventRegistrationEmail,
  sendNewsletterEmail,
} from "../utils/emailService.js";
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  unsubscribeByLink,
} from "../controllers/newsletterController.js";


const router = express.Router();

// General mail sender
router.post("/send", async (req, res) => {
  try {
    const { to, subject, markdown } = req.body;
    await sendMail({ to, subject, markdown });
    res.json({ message: "Mail sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Registration confirmation email
router.post("/registration", async (req, res) => {
  try {
    const { name, email, uid } = req.body;
    await sendRegistrationEmail({ name, email, uid });
    res.json({ message: "Registration email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Event registration confirmation email
router.post("/event", async (req, res) => {
  try {
    const { user, event } = req.body;
    await sendEventRegistrationEmail(user, event);
    res.json({ message: "Event registration email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Newsletter email
router.post("/newsletter", subscribeNewsletter);
router.post("/newsletter/unsubscribe", unsubscribeNewsletter);
router.get("/newsletter/unsubscribe", unsubscribeByLink);

export default router;
