import express from "express";
import cron from "node-cron";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import User from "./src/api/models/User.js";
import { connectDB } from "./src/api/utils/db.js";
import articleRoutes from "./src/api/routes/articleRoutes.js";
import userRoutes from "./src/api/routes/userRoutes.js";
import eventRoutes from "./src/api/routes/eventRoutes.js";
import mailRoutes from "./src/api/routes/mailRoutes.js";
import passport from "./src/api/middleware/passport.js";
import authRoutes from "./src/api/routes/authRoutes.js";
import uploadRoutes from "./src/api/routes/uploadRoutes.js";
import formRoutes from "./src/api/routes/formRoutes.js";
import registrationRoutes from "./src/api/routes/registrationRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware setup
app.use(
  cors({
    origin: ["http://localhost:5173", "https://ntun3si.onrender.com"],
    credentials: true,
  })
);
app.use(express.json());
app.use(passport.initialize());

// Connect to MongoDB before starting the server
await connectDB();

// API routes
app.use("/api/articles", articleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/mail", mailRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV === "production") {
    console.log("Serving frontend from src/client/dist");
  }
});

// Scheduled task: delete unverified users daily at 3 AM
cron.schedule("0 3 * * *", async () => {
  const result = await User.deleteMany({
    emailVerified: false,
    tokenExpiresAt: { $lt: new Date() },
  });
  if (result.deletedCount > 0) {
    console.log(`[CRON] Deleted ${result.deletedCount} unverified accounts`);
  }
});
