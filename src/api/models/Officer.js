import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const officerSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      default: () => "ofc_" + uuidv4().slice(0, 8),
    },
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    bio: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Officer", officerSchema);
