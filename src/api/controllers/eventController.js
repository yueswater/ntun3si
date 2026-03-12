import Event from "../models/Event.js";
import RegistrationForm from "../models/RegistrationForm.js";
import User from "../models/User.js";
import { sendEventRegistrationEmail } from "../utils/emailService.js";

/**
 * One-time migration: subtract 8 hours from all event dates
 * (fixes data stored by old code that treated local time as UTC)
 */
export async function migrateTimezones(req, res) {
  try {
    const OFFSET = 8 * 3600000; // 8 hours in ms

    // Fix Event dates
    const events = await Event.find({});
    let eventFixed = 0;
    for (const e of events) {
      let changed = false;
      if (e.date) { e.date = new Date(e.date.getTime() - OFFSET); changed = true; }
      if (e.endDate) { e.endDate = new Date(e.endDate.getTime() - OFFSET); changed = true; }
      if (changed) { await e.save(); eventFixed++; }
    }

    // Fix RegistrationForm dates
    const forms = await RegistrationForm.find({});
    let formFixed = 0;
    for (const f of forms) {
      let changed = false;
      if (f.registrationStartDate) { f.registrationStartDate = new Date(f.registrationStartDate.getTime() - OFFSET); changed = true; }
      if (f.registrationDeadline) { f.registrationDeadline = new Date(f.registrationDeadline.getTime() - OFFSET); changed = true; }
      if (changed) { await f.save(); formFixed++; }
    }

    res.json({ success: true, eventsFixed: eventFixed, formsFixed: formFixed });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Create new event (admin only)
 */
export async function createEvent(req, res) {
  try {
    const {
      title,
      slug,
      description,
      date,
      endDate,
      location,
      maxParticipants,
      speaker,
      speakerBio,
      notes,
      hashtags,
      previewImg,
    } = req.body;

    const newEvent = await Event.create({
      title,
      slug,
      description,
      date,
      endDate: endDate || null,
      location,
      maxParticipants,
      speaker: speaker || "",
      speakerBio: speakerBio || "",
      notes: notes || "",
      hashtags: hashtags || [],
      previewImg: previewImg || "",
    });

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get all events (public)
 */
export async function getEvents(req, res) {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get single event by UID (public)
 */
export async function getEventByUid(req, res) {
  try {
    const { uid } = req.params;
    const event = await Event.findOne({ uid }).populate(
      "participants",
      "name email uid"
    );
    if (!event) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });
    res.json(event);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get by event slug
 */
export const getEventBySlug = async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug });
  if (!event) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "活動不存在" } });
  res.json(event);
};

/**
 * Update event (admin only)
 */
export async function updateEvent(req, res) {
  try {
    const { uid } = req.params;
    const updates = req.body;

    const updated = await Event.findOneAndUpdate({ uid }, updates, {
      new: true,
    });
    if (!updated) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Delete event (admin only)
 */
export async function deleteEvent(req, res) {
  try {
    const { uid } = req.params;
    const deleted = await Event.findOneAndDelete({ uid });
    if (!deleted) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Register for an event (user only)
 */
export async function registerForEvent(req, res) {
  try {
    const { uid } = req.params;
    const userId = req.user.uid;

    const event = await Event.findOne({ uid });
    if (!event) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });

    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });

    if (event.participants.includes(user._id)) {
      return res.status(400).json({ success: false, error: { code: "ALREADY_REGISTERED", message: "Already registered" } });
    }

    if (
      event.maxParticipants &&
      event.participants.length >= event.maxParticipants
    ) {
      return res.status(400).json({ success: false, error: { code: "EVENT_FULL", message: "Event is full" } });
    }

    event.participants.push(user._id);
    await event.save();

    await sendEventRegistrationEmail(user, event);

    res.json({ success: true, message: "Successfully registered", event });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Cancel registration (user only)
 */
export async function cancelRegistration(req, res) {
  try {
    const { uid } = req.params;
    const userId = req.user.uid;

    const event = await Event.findOne({ uid });
    if (!event) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });

    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });

    event.participants = event.participants.filter(
      (p) => p.toString() !== user._id.toString()
    );

    await event.save();
    res.json({ success: true, message: "Registration canceled" });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get participant list (admin only)
 */
export async function getParticipants(req, res) {
  try {
    const { uid } = req.params;
    const event = await Event.findOne({ uid }).populate(
      "participants",
      "name email uid"
    );
    if (!event) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });
    res.json(event.participants);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}
