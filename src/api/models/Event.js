import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const eventSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      default: () => "evt_" + uuidv4().slice(0, 8),
    },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    date: { type: Date, required: true },
    location: { type: String },
    maxParticipants: { type: Number },
    speaker: { type: String, default: "" },
    speakerBio: { type: String, default: "" },
    notes: { type: String, default: "" },
    hashtags: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length >= 1 && v.length <= 5;
        },
        message: "Hashtags must be between 1 and 5",
      },
    },
    previewImg: { type: String, default: "" },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
