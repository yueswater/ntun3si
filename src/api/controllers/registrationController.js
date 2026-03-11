import Registration from "../models/Registration.js";
import RegistrationForm from "../models/RegistrationForm.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { sendEventRegistrationEmail } from "../utils/emailService.js";

/**
 * Submit a registration (public)
 */
export async function submitRegistration(req, res) {
  try {
    const { eventUid } = req.params;
    const {
      name,
      email,
      phone,
      nationality,
      affiliationType,
      affiliation,
      customResponses,
    } = req.body;

    // Get form configuration
    const form = await RegistrationForm.findOne({ eventUid, isActive: true });
    if (!form) {
      return res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Registration form not found or inactive" } });
    }

    // Get event
    const event = await Event.findOne({ uid: eventUid });
    if (!event) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });
    }

    // Check deadline
    if (
      form.registrationDeadline &&
      new Date() > new Date(form.registrationDeadline)
    ) {
      return res
        .status(400)
        .json({ success: false, error: { code: "DEADLINE_PASSED", message: "Registration deadline has passed" } });
    }

    // Check if already registered (by email)
    const existing = await Registration.findOne({ eventUid, email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: { code: "ALREADY_REGISTERED", message: "This email has already registered for this event" } });
    }

    // Check max registrations
    if (form.maxRegistrations) {
      const count = await Registration.countDocuments({ eventUid });
      if (count >= form.maxRegistrations) {
        return res.status(400).json({ success: false, error: { code: "LIMIT_REACHED", message: "Registration limit reached" } });
      }
    }

    // Get user UID if logged in
    let userUid = null;
    if (req.user) {
      userUid = req.user.uid;
    }

    // Create registration
    const registration = await Registration.create({
      formUid: form.uid,
      eventUid,
      userUid,
      name,
      email,
      phone,
      nationality: nationality || "中華民國",
      affiliationType: affiliationType || "school",
      affiliation,
      customResponses: customResponses || [],
      submittedAt: new Date(),
    });

    // Send confirmation email
    try {
      await sendEventRegistrationEmail(
        { email, name },
        event,
        form.confirmationMessage
      );
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      success: true,
      message: "Registration submitted successfully",
      registration,
      confirmationMessage: form.confirmationMessage,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get confirmed registration count for an event (public)
 */
export async function getEventRegistrationCount(req, res) {
  try {
    const { eventUid } = req.params;
    const confirmedCount = await Registration.countDocuments({ eventUid, status: "confirmed" });
    res.json({ confirmedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get all registrations for an event (admin only)
 */
export async function getEventRegistrations(req, res) {
  try {
    const { eventUid } = req.params;
    const registrations = await Registration.find({ eventUid }).sort({
      submittedAt: -1,
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get all registrations for a form (admin only)
 */
export async function getFormRegistrations(req, res) {
  try {
    const { formUid } = req.params;
    const registrations = await Registration.find({ formUid }).sort({
      submittedAt: -1,
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get single registration (admin only)
 */
export async function getRegistration(req, res) {
  try {
    const { uid } = req.params;
    const registration = await Registration.findOne({ uid });

    if (!registration) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Registration not found" } });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Update registration status (admin only)
 */
export async function updateRegistrationStatus(req, res) {
  try {
    const { uid } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, error: { code: "INVALID_STATUS", message: "Invalid status" } });
    }

    const registration = await Registration.findOneAndUpdate(
      { uid },
      { status },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Registration not found" } });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Delete registration (admin only)
 */
export async function deleteRegistration(req, res) {
  try {
    const { uid } = req.params;
    const registration = await Registration.findOneAndDelete({ uid });

    if (!registration) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Registration not found" } });
    }

    res.json({ success: true, message: "Registration deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get my registrations (user only)
 */
export async function getMyRegistrations(req, res) {
  try {
    const userUid = req.user.uid;
    const registrations = await Registration.find({ userUid }).sort({
      submittedAt: -1,
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Cancel my registration (user only)
 */
export async function cancelMyRegistration(req, res) {
  try {
    const { uid } = req.params;
    const userUid = req.user.uid;

    const registration = await Registration.findOne({ uid, userUid });

    if (!registration) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Registration not found" } });
    }

    registration.status = "cancelled";
    await registration.save();

    res.json({ success: true, message: "Registration cancelled successfully", registration });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Export registrations to CSV (admin only)
 */
export async function exportRegistrations(req, res) {
  try {
    const { eventUid } = req.params;
    const registrations = await Registration.find({ eventUid }).sort({
      submittedAt: 1,
    });

    if (registrations.length === 0) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No registrations found" } });
    }

    // Build CSV
    const headers = [
      "報名時間",
      "姓名",
      "Email",
      "電話",
      "國籍",
      "身份類別",
      "所屬單位",
      "允許報名",
    ];

    // Add custom field headers
    if (registrations[0].customResponses.length > 0) {
      registrations[0].customResponses.forEach((resp) => {
        headers.push(resp.label);
      });
    }

    const rows = [headers];

    registrations.forEach((reg) => {
      const row = [
        new Date(reg.submittedAt).toLocaleString("zh-TW"),
        reg.name,
        reg.email,
        reg.phone,
        reg.nationality,
        reg.affiliationType === "school" ? "學校" : "任職單位",
        reg.affiliation || "-",
        reg.status,
      ];

      // Add custom responses
      reg.customResponses.forEach((resp) => {
        row.push(
          Array.isArray(resp.value) ? resp.value.join("; ") : resp.value
        );
      });

      rows.push(row);
    });

    // Convert to CSV
    const csv = rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Add BOM for Excel UTF-8 support
    const bom = "\uFEFF";

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="registrations-${eventUid}-${Date.now()}.csv"`
    );
    res.send(bom + csv);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}
