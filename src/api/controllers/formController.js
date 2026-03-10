import RegistrationForm from "../models/RegistrationForm.js";
import Event from "../models/Event.js";

/**
 * Create a registration form for an event (admin only)
 */
export async function createForm(req, res) {
  try {
    const {
      eventUid,
      customFields,
      maxRegistrations,
      registrationDeadline,
      confirmationMessage,
    } = req.body;

    // Check if event exists
    const event = await Event.findOne({ uid: eventUid });
    if (!event) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });
    }

    // Check if form already exists for this event
    const existing = await RegistrationForm.findOne({ eventUid });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: { code: "DUPLICATE", message: "Form already exists for this event" } });
    }

    const form = await RegistrationForm.create({
      eventUid,
      customFields: customFields || [],
      maxRegistrations,
      registrationDeadline,
      confirmationMessage,
    });

    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get all forms (admin only)
 */
export async function getAllForms(req, res) {
  try {
    const forms = await RegistrationForm.find().sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get form by event UID (public)
 */
export async function getFormByEventUid(req, res) {
  try {
    const { eventUid } = req.params;
    const form = await RegistrationForm.findOne({ eventUid, isActive: true });

    if (!form) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Form not found" } });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get form by form UID (admin)
 */
export async function getFormByUid(req, res) {
  try {
    const { uid } = req.params;
    const form = await RegistrationForm.findOne({ uid });

    if (!form) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Form not found" } });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Update form (admin only)
 */
export async function updateForm(req, res) {
  try {
    const { uid } = req.params;
    const updates = req.body;

    // Don't allow changing eventUid
    delete updates.eventUid;

    const form = await RegistrationForm.findOneAndUpdate({ uid }, updates, {
      new: true,
    });

    if (!form) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Form not found" } });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Delete form (admin only)
 */
export async function deleteForm(req, res) {
  try {
    const { uid } = req.params;
    const form = await RegistrationForm.findOneAndDelete({ uid });

    if (!form) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Form not found" } });
    }

    res.json({ success: true, message: "Form deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Toggle form active status (admin only)
 */
export async function toggleFormStatus(req, res) {
  try {
    const { uid } = req.params;
    const form = await RegistrationForm.findOne({ uid });

    if (!form) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Form not found" } });
    }

    form.isActive = !form.isActive;
    await form.save();

    res.json({
      success: true,
      message: `Form ${form.isActive ? "activated" : "deactivated"}`,
      form,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}
