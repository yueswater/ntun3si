import Newsletter from "../models/Newsletter.js";
import { sendNewsletterEmail } from "../utils/emailService.js";

export async function subscribeNewsletter(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Email is required." } });
    }

    // Save to database (create or update)
    let subscriber = await Newsletter.findOne({ email });

    if (!subscriber) {
      subscriber = await Newsletter.create({
        email,
        subscribed: true,
      });
    } else {
      subscriber.subscribed = true;
      subscriber.subscribedAt = new Date();
      await subscriber.save();
    }

    // Send welcome email
    await sendNewsletterEmail(email);

    return res.status(200).json({ success: true, message: "Subscription success" });
  } catch (err) {
    console.error("Newsletter error:", err);
    return res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Subscription failed" } });
  }
}

export async function unsubscribeNewsletter(req, res) {
  try {
    const { email } = req.body;

    const user = await Newsletter.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Email not found" } });
    }

    user.subscribed = false;
    await user.save();

    res.status(200).json({ success: true, message: "Unsubscribed successfully" });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Unsubscribe failed" } });
  }
}

export async function unsubscribeByLink(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.redirect("/unsubscribe?status=error");
    }

    const user = await Newsletter.findOne({ email });
    if (!user) {
      return res.redirect("/unsubscribe?status=not_found");
    }

    user.subscribed = false;
    await user.save();

    return res.redirect("/unsubscribe?status=success");
  } catch (err) {
    console.error(err);
    return res.redirect("/unsubscribe?status=error");
  }
}


