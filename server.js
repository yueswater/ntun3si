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
import { sendMail } from "./src/api/utils/emailService.js";
import {
  sendRegistrationEmail,
  sendEventRegistrationEmail,
  sendNewsletterEmail,
} from "./src/api/utils/emailService.js";
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

// Test mail sending endpoint
app.post("/api/test/mail", async (req, res) => {
  try {
    const { to, subject, markdown } = req.body;
    await sendMail({ to, subject, markdown });
    res.json({ message: "Test mail sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test registration email
app.post("/api/test/registration", async (req, res) => {
  try {
    const { name, email, uid } = req.body;
    await sendRegistrationEmail({ name, email, uid });
    res.json({ message: "Registration email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test event registration email
app.post("/api/test/event", async (req, res) => {
  try {
    const { user, event } = req.body;
    await sendEventRegistrationEmail(user, event);
    res.json({ message: "Event registration email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test newsletter email
app.post("/api/test/newsletter", async (req, res) => {
  try {
    const { recipients, subject, content } = req.body;
    await sendNewsletterEmail(recipients, subject, content);
    res.json({ message: "Newsletter sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Simple test route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express backend" });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "src/client/dist")));

  // Catch-all route for React Router - use middleware instead of app.get("*")
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "src/client/dist/index.html"));
  });
}

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
