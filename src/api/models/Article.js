import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const articleSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      default: () => "art_" + uuidv4().slice(0, 8),
    },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content_md: { type: String, required: true },
    content_html: { type: String },
    previewImg: { type: String, default: "" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    views: { type: Number, default: 0 },
    hashtags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "最多只能新增 5 個標籤",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Article", articleSchema);
