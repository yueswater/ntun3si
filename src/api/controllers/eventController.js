import Event from "../models/Event.js";
import User from "../models/User.js";
import { sendEventRegistrationEmail } from "../utils/emailService.js";

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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get by event slug
 */
export const getEventBySlug = async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug });
  if (!event) return res.status(404).json({ message: "活動不存在" });
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
    if (!updated) return res.status(404).json({ message: "Event not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Delete event (admin only)
 */
export async function deleteEvent(req, res) {
  try {
    const { uid } = req.params;
    const deleted = await Event.findOneAndDelete({ uid });
    if (!deleted) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    if (!event) return res.status(404).json({ message: "Event not found" });

    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (event.participants.includes(user._id)) {
      return res.status(400).json({ message: "Already registered" });
    }

    if (
      event.maxParticipants &&
      event.participants.length >= event.maxParticipants
    ) {
      return res.status(400).json({ message: "Event is full" });
    }

    event.participants.push(user._id);
    await event.save();

    await sendEventRegistrationEmail(user, event);

    res.json({ message: "Successfully registered", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    if (!event) return res.status(404).json({ message: "Event not found" });

    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    event.participants = event.participants.filter(
      (p) => p.toString() !== user._id.toString()
    );

    await event.save();
    res.json({ message: "Registration canceled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event.participants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
