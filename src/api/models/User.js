import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      default: () => "usr_" + uuidv4().slice(0, 8),
    },
    provider: {
      type: String,
      enum: ["local", "google", "facebook", "line"],
      default: "local",
    },
    providerId: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
      unique: true,
      sparse: true,
    },
    username: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
    verificationToken: { type: String, default: null },
    tokenExpiresAt: { type: Date, default: null },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
