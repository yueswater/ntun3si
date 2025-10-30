import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

/**
 * Registration Form Schema
 * Stores the configuration for event registration forms
 */
const registrationFormSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      default: () => "form_" + uuidv4().slice(0, 8),
    },
    eventUid: {
      type: String,
      required: true,
      unique: true, // One form per event
      ref: "Event",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Custom fields that admin can add
    customFields: [
      {
        fieldId: {
          type: String,
          default: () => "field_" + uuidv4().slice(0, 8),
        },
        label: { type: String, required: true }, // e.g., "想了解什麼議題"
        type: {
          type: String,
          enum: ["text", "textarea", "select", "radio", "checkbox"],
          default: "text",
        },
        options: [String], // For select/radio/checkbox
        required: { type: Boolean, default: false },
        placeholder: String,
      },
    ],
    // Settings
    maxRegistrations: Number, // Optional limit
    registrationDeadline: Date, // Optional deadline
    confirmationMessage: {
      type: String,
      default: "感謝您的報名！我們會盡快與您聯繫。",
    },
  },
  { timestamps: true }
);

export default mongoose.model("RegistrationForm", registrationFormSchema);
