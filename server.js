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

// ------------------------------------------------------------
// Resolve __dirname in ES modules
// ------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------------------------------------
// Create Express app
// ------------------------------------------------------------
const app = express();

// ------------------------------------------------------------
// Global middleware
// ------------------------------------------------------------

// CORS configuration
// Add all allowed frontend origins here
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ntun3si.space",
      "https://www.ntun3si.space",
      "https://ntun3si.onrender.com"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// Parse JSON request bodies
app.use(express.json());

// (Optional but recommended) support URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Initialize Passport (JWT / strategies)
app.use(passport.initialize());

// ------------------------------------------------------------
// Database connection
// ------------------------------------------------------------
await connectDB();

// ------------------------------------------------------------
// API routes (must come BEFORE static file serving)
// ------------------------------------------------------------
app.use("/api/articles", articleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/mail", mailRoutes);

// ------------------------------------------------------------
// Static frontend (only in production)
// ------------------------------------------------------------
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "src/client/dist");

  // Serve compiled frontend assets (JS, CSS, images, etc.)
  app.use(express.static(distPath));

  // Serve sitemap explicitly
  app.get("/sitemap.xml", (req, res) => {
    res.sendFile(path.join(distPath, "sitemap.xml"));
  });

  // SPA fallback: send index.html for all non-API routes
  // IMPORTANT: this must stay AFTER all /api/* routes
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ------------------------------------------------------------
// Start HTTP server
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV === "production") {
    console.log("Serving frontend from src/client/dist");
  }
});

// ------------------------------------------------------------
// Scheduled job: delete expired, unverified users every day at 3 AM
// ------------------------------------------------------------
cron.schedule("0 3 * * *", async () => {
  try {
    const result = await User.deleteMany({
      emailVerified: false,
      tokenExpiresAt: { $lt: new Date() },
    });

    if (result.deletedCount > 0) {
      console.log(`[CRON] Deleted ${result.deletedCount} unverified accounts`);
    }
  } catch (err) {
    console.error("[CRON] Failed to delete unverified accounts:", err);
  }
});
