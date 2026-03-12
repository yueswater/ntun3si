import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import Registration from "../models/Registration.js";
import RegistrationForm from "../models/RegistrationForm.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { sendEventRegistrationEmail, sendEventAcceptedEmail, sendEventCancelledEmail } from "../utils/emailService.js";

// ─── Sign-in sheet helpers ────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_DIR = path.resolve("tmp");
const HOME = os.homedir();
const VENDOR_DIR = path.resolve("vendor");

const extendedPATH = [
  `${VENDOR_DIR}/quarto/bin`,
  `${VENDOR_DIR}/TinyTeX/bin/x86_64-linux`,
  `${HOME}/quarto/bin`,
  `${HOME}/bin`,
  `${HOME}/.TinyTeX/bin/x86_64-linux`,
  process.env.PATH,
].join(":");

function maskEmail(email) {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return "*".repeat(local.length) + domain;
  const keepStart = Math.min(2, Math.floor(local.length / 3));
  const keepEnd = Math.min(1, Math.floor(local.length / 4));
  const masked =
    local.slice(0, keepStart) +
    "*".repeat(local.length - keepStart - keepEnd) +
    local.slice(local.length - keepEnd);
  return masked + domain;
}

function maskPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  return digits.slice(0, 4) + "-***-" + digits.slice(-3);
}

function formatEventTime(date) {
  if (!date) return "—";
  const d = new Date(date);
  const taipei = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const y = taipei.getUTCFullYear();
  const m = String(taipei.getUTCMonth() + 1).padStart(2, "0");
  const day = String(taipei.getUTCDate()).padStart(2, "0");
  const h = String(taipei.getUTCHours()).padStart(2, "0");
  const min = String(taipei.getUTCMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}`;
}

function escapeLatex(str) {
  if (!str) return "";
  return String(str)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[&%$#_{}~^]/g, (m) => "\\" + m);
}

function generateSignInSheetPDF(event, registrations) {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  const id = uuidv4().slice(0, 8);
  const qmdPath = path.join(TMP_DIR, `signin_${id}.qmd`);
  const pdfPath = path.join(TMP_DIR, `signin_${id}.pdf`);

  const fontsPath = path.join(VENDOR_DIR, "fonts") + "/";
  const templatePath = path.join(__dirname, "..", "templates", "signin-sheet.qmd");
  const template = fs.readFileSync(templatePath, "utf-8");

  const title = escapeLatex(event.title);

  let content = "";

  // Title
  content += "\\begin{center}\n";
  content += `{\\LARGE\\bfseries ${title}}\\\\[0.3em]\n`;
  content += "{\\large\\bfseries 報到簽名表}\n";
  content += "\\end{center}\n\n";
  content += "\\vspace{0.5em}\n\n";

  // Sign-in table — xltabular auto-breaks across pages
  content += "\\begingroup\\small\n";
  content += "\\renewcommand{\\arraystretch}{1.8}\n";
  content += "\\begin{xltabular}{\\textwidth}{|c|C{2cm}|Y|C{2.2cm}|C{2.2cm}|C{2.2cm}|}\n";
  content += "\\hline\n";
  content += "\\textbf{編號} & \\textbf{姓名} & \\textbf{電子郵件} & \\textbf{電話} & \\textbf{簽到} & \\textbf{簽退} \\\\\n";
  content += "\\hline\n";
  content += "\\endhead\n";

  if (registrations.length === 0) {
    content += "— & 目前無已確認的報名者 & & & & \\\\\n\\hline\n";
  } else {
    for (let i = 0; i < registrations.length; i++) {
      const reg = registrations[i];
      content += `${i + 1} & ${escapeLatex(reg.name)} & ${escapeLatex(maskEmail(reg.email))} & ${escapeLatex(maskPhone(reg.phone))} & & \\\\\n\\hline\n`;
    }
  }

  content += "\\end{xltabular}\n\\endgroup\n";

  // Stamp line at the bottom of last page
  content += "\n\\vfill\n\n";
  content += "\\hfill 承辦人簽章：\\underline{\\hspace{4cm}}\n";

  const qmdContent = template
    .replace(/\{\{FONTS_PATH\}\}/g, fontsPath)
    .replace("{{CONTENT}}", content);

  fs.writeFileSync(qmdPath, qmdContent, "utf-8");

  try {
    execSync(`quarto render "${qmdPath}" --to pdf`, {
      cwd: TMP_DIR,
      timeout: 60000,
      stdio: "pipe",
      env: { ...process.env, PATH: extendedPATH, HOME, OSFONTDIR: path.join(VENDOR_DIR, "fonts") },
    });
  } catch (err) {
    fs.unlink(qmdPath, () => { });
    throw new Error(`Quarto PDF generation failed: ${err.stderr?.toString() || err.message}`);
  }

  fs.unlink(qmdPath, () => { });

  if (!fs.existsSync(pdfPath)) {
    throw new Error("PDF file was not generated");
  }

  return pdfPath;
}

/**
 * Submit a registration (public)
 */
export async function submitRegistration(req, res) {
  try {
    const { eventUid } = req.params;
    const {
      name,
      email,
      phone,
      nationality,
      affiliationType,
      affiliation,
      department,
      jobTitle,
      customResponses,
    } = req.body;

    // Get form configuration
    const form = await RegistrationForm.findOne({ eventUid, isActive: true });
    if (!form) {
      return res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Registration form not found or inactive" } });
    }

    // Get event
    const event = await Event.findOne({ uid: eventUid });
    if (!event) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });
    }

    // Check deadline
    if (
      form.registrationDeadline &&
      new Date() > new Date(form.registrationDeadline)
    ) {
      return res
        .status(400)
        .json({ success: false, error: { code: "DEADLINE_PASSED", message: "Registration deadline has passed" } });
    }

    // Check if already registered (by email or phone)
    const existing = await Registration.findOne({
      eventUid,
      $or: [{ email }, { phone }],
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: { code: "ALREADY_REGISTERED", message: "您已報名過此活動！" } });
    }

    // Check max registrations
    if (form.maxRegistrations) {
      const count = await Registration.countDocuments({ eventUid });
      if (count >= form.maxRegistrations) {
        return res.status(400).json({ success: false, error: { code: "LIMIT_REACHED", message: "Registration limit reached" } });
      }
    }

    // Get user UID if logged in
    let userUid = null;
    if (req.user) {
      userUid = req.user.uid;
    }

    // Create registration
    const registration = await Registration.create({
      formUid: form.uid,
      eventUid,
      userUid,
      name,
      email,
      phone,
      nationality: nationality || "中華民國",
      affiliationType: affiliationType || "school",
      affiliation,
      department: department || "",
      jobTitle: jobTitle || "",
      customResponses: customResponses || [],
      submittedAt: new Date(),
    });

    // Send confirmation email
    try {
      await sendEventRegistrationEmail(
        { email, name },
        event,
        form.confirmationMessage
      );
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      success: true,
      message: "Registration submitted successfully",
      registration,
      confirmationMessage: form.confirmationMessage,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get confirmed registration count for an event (public)
 */
export async function getEventRegistrationCount(req, res) {
  try {
    const { eventUid } = req.params;
    const confirmedCount = await Registration.countDocuments({ eventUid, status: "confirmed" });
    res.json({ confirmedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get all registrations for an event (admin only)
 */
export async function getEventRegistrations(req, res) {
  try {
    const { eventUid } = req.params;
    const registrations = await Registration.find({ eventUid }).sort({
      submittedAt: -1,
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get all registrations for a form (admin only)
 */
export async function getFormRegistrations(req, res) {
  try {
    const { formUid } = req.params;
    const registrations = await Registration.find({ formUid }).sort({
      submittedAt: -1,
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get single registration (admin only)
 */
export async function getRegistration(req, res) {
  try {
    const { uid } = req.params;
    const registration = await Registration.findOne({ uid });

    if (!registration) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Registration not found" } });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Update registration status (admin only)
 */
export async function updateRegistrationStatus(req, res) {
  try {
    const { uid } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, error: { code: "INVALID_STATUS", message: "Invalid status" } });
    }

    const oldRegistration = await Registration.findOne({ uid });
    if (!oldRegistration) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Registration not found" } });
    }

    const oldStatus = oldRegistration.status;
    oldRegistration.status = status;
    await oldRegistration.save();

    // Send notification emails on status transitions
    if (oldStatus !== status) {
      try {
        const event = await Event.findOne({ uid: oldRegistration.eventUid });
        if (event) {
          const user = { name: oldRegistration.name, email: oldRegistration.email };
          if (status === "confirmed" && oldStatus === "pending") {
            await sendEventAcceptedEmail(user, event);
          } else if (status === "cancelled" && oldStatus === "confirmed") {
            await sendEventCancelledEmail(user, event);
          }
        }
      } catch (emailErr) {
        console.error("Failed to send status change email:", emailErr);
      }
    }

    res.json(oldRegistration);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Delete registration (admin only)
 */
export async function deleteRegistration(req, res) {
  try {
    const { uid } = req.params;
    const registration = await Registration.findOneAndDelete({ uid });

    if (!registration) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Registration not found" } });
    }

    res.json({ success: true, message: "Registration deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Get my registrations (user only)
 */
export async function getMyRegistrations(req, res) {
  try {
    const userUid = req.user.uid;
    const registrations = await Registration.find({ userUid }).sort({
      submittedAt: -1,
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Cancel my registration (user only)
 */
export async function cancelMyRegistration(req, res) {
  try {
    const { uid } = req.params;
    const userUid = req.user.uid;

    const registration = await Registration.findOne({ uid, userUid });

    if (!registration) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Registration not found" } });
    }

    registration.status = "cancelled";
    await registration.save();

    res.json({ success: true, message: "Registration cancelled successfully", registration });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Export registrations to CSV (admin only)
 */
export async function exportRegistrations(req, res) {
  try {
    const { eventUid } = req.params;
    const registrations = await Registration.find({ eventUid }).sort({
      submittedAt: 1,
    });

    if (registrations.length === 0) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No registrations found" } });
    }

    // Build CSV
    const headers = [
      "報名時間",
      "姓名",
      "Email",
      "電話",
      "國籍",
      "身份類別",
      "所屬單位",
      "允許報名",
    ];

    // Add custom field headers
    if (registrations[0].customResponses.length > 0) {
      registrations[0].customResponses.forEach((resp) => {
        headers.push(resp.label);
      });
    }

    const rows = [headers];

    registrations.forEach((reg) => {
      const row = [
        new Date(reg.submittedAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
        reg.name,
        reg.email,
        reg.phone,
        reg.nationality,
        reg.affiliationType === "school" ? "學校" : "任職單位",
        reg.affiliation || "-",
        reg.status,
      ];

      // Add custom responses
      reg.customResponses.forEach((resp) => {
        row.push(
          Array.isArray(resp.value) ? resp.value.join("; ") : resp.value
        );
      });

      rows.push(row);
    });

    // Convert to CSV
    const csv = rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Add BOM for Excel UTF-8 support
    const bom = "\uFEFF";

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="registrations-${eventUid}-${Date.now()}.csv"`
    );
    res.send(bom + csv);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}

/**
 * Export sign-in sheet as PDF (admin only)
 * Always regenerates the PDF from the latest data.
 */
export async function exportSignInSheet(req, res) {
  try {
    const { eventUid } = req.params;

    const [event, registrations] = await Promise.all([
      Event.findOne({ uid: eventUid }),
      Registration.find({ eventUid, status: "confirmed" }).sort({ submittedAt: 1 }),
    ]);

    if (!event) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });
    }

    const pdfPath = generateSignInSheetPDF(event, registrations);
    const pdfBuffer = fs.readFileSync(pdfPath);
    fs.unlink(pdfPath, () => { });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="signin-sheet.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}
