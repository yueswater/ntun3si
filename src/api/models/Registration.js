import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

/**
 * Registration Schema
 * Stores individual registration submissions
 */
const registrationSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      default: () => "reg_" + uuidv4().slice(0, 8),
    },
    formUid: {
      type: String,
      required: true,
      ref: "RegistrationForm",
    },
    eventUid: {
      type: String,
      required: true,
      ref: "Event",
    },
    // User info (if logged in)
    userUid: {
      type: String,
      ref: "User",
    },
    // Required fields
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    nationality: {
      type: String,
      required: true,
      default: "中華民國",
    },
    // Optional fields
    school: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    studentId: {
      type: String,
      trim: true,
    },
    // Custom field responses
    customResponses: [
      {
        fieldId: String,
        label: String,
        value: mongoose.Schema.Types.Mixed, // Can be string, array, etc.
      },
    ],
    // Meta
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
registrationSchema.index({ eventUid: 1, email: 1 });
registrationSchema.index({ formUid: 1 });

export default mongoose.model("Registration", registrationSchema);
