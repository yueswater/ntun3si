import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const changeRequestSchema = new mongoose.Schema(
    {
        uid: {
            type: String,
            unique: true,
            default: () => "cr_" + uuidv4().slice(0, 8),
        },
        title: { type: String, required: true },
        content_md: { type: String, required: true },
        content_html: { type: String },
        status: {
            type: String,
            enum: ["submitted", "in_progress", "completed"],
            default: "submitted",
        },
        submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("ChangeRequest", changeRequestSchema);
