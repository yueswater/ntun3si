import Registration from "../models/Registration.js";
import RegistrationForm from "../models/RegistrationForm.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { sendEventRegistrationEmail } from "../utils/emailService.js";

// ─── Sign-in sheet helpers ────────────────────────────────────────────────────

const signInSheetCache = new Map();
const SIGNIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

function buildSignInSheetHTML(event, registrations) {
  const title = escapeHtml(event.title);
  const startTime = formatEventTime(event.date);
  const endTime = event.endDate ? ` ～ ${formatEventTime(event.endDate)}` : "";
  const timeStr = startTime + endTime;

  const PAGE_SIZE = 20;
  const pages = [];
  for (let i = 0; i < Math.max(registrations.length, 1); i += PAGE_SIZE) {
    pages.push(registrations.slice(i, i + PAGE_SIZE));
  }
  const totalPages = pages.length;

  const pagesHTML = pages
    .map((regs, pi) => {
      const rows = regs
        .map((reg, ri) => {
          const no = pi * PAGE_SIZE + ri + 1;
          return `<tr>
          <td style="text-align:center;">${no}</td>
          <td>${escapeHtml(reg.name)}</td>
          <td class="masked-cell">${escapeHtml(maskEmail(reg.email))}</td>
          <td class="masked-cell">${escapeHtml(maskPhone(reg.phone))}</td>
          <td class="sign-col"></td>
          <td class="sign-col"></td>
        </tr>`;
        })
        .join("");

      const isLast = pi === pages.length - 1;
      return `<div class="page${isLast ? "" : " page-break"}">
      <div class="page-header">
        <h1>${title}</h1>
        <p class="event-time">活動時間：${escapeHtml(timeStr)}</p>
        <p class="sheet-label">簽到表</p>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:30pt;">#</th>
            <th>姓名</th>
            <th>電子郵件</th>
            <th>電話</th>
            <th class="sign-col">簽到</th>
            <th class="sign-col">簽退</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="page-footer">第 ${pi + 1} 頁 / 共 ${totalPages} 頁</div>
    </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<title>${title} - 簽到表</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", "Arial", sans-serif;
    font-size: 11pt;
    color: #000;
    background: #fff;
  }
  @page {
    size: A4 portrait;
    margin: 18mm 15mm 22mm 15mm;
  }
  .page {
    position: relative;
    min-height: calc(297mm - 40mm);
    padding-bottom: 14mm;
  }
  .page-break { page-break-after: always; }
  .page-header {
    text-align: center;
    margin-bottom: 6mm;
    padding-bottom: 4mm;
    border-bottom: 2px solid #000;
  }
  .page-header h1 { font-size: 17pt; font-weight: 700; margin-bottom: 2mm; }
  .event-time { font-size: 10.5pt; margin-bottom: 1.5mm; }
  .sheet-label { font-size: 13pt; font-weight: 700; margin-top: 1.5mm; }
  table { width: 100%; border-collapse: collapse; }
  th {
    background: #e5e7eb;
    border: 1px solid #374151;
    padding: 4pt 6pt;
    text-align: center;
    font-weight: 700;
    font-size: 10.5pt;
  }
  td {
    border: 1px solid #374151;
    padding: 3pt 6pt;
    height: 22pt;
    vertical-align: middle;
  }
  .masked-cell { font-size: 9.5pt; }
  .sign-col { width: 68pt; text-align: center; }
  .page-footer {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 100%;
    text-align: right;
    font-size: 9pt;
    color: #555;
    padding-top: 3mm;
    border-top: 1px solid #d1d5db;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-footer { position: fixed; bottom: 8mm; right: 15mm; border-top: none; width: auto; }
  }
</style>
</head>
<body>
${pagesHTML}
<script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };</script>
</body>
</html>`;
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

    // Check if already registered (by email)
    const existing = await Registration.findOne({ eventUid, email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: { code: "ALREADY_REGISTERED", message: "This email has already registered for this event" } });
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

    const registration = await Registration.findOneAndUpdate(
      { uid },
      { status },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Registration not found" } });
    }

    res.json(registration);
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
        new Date(reg.submittedAt).toLocaleString("zh-TW"),
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
 * Export sign-in sheet as HTML (admin only)
 * Returns a print-ready HTML page; cached for 5 minutes per event.
 */
export async function exportSignInSheet(req, res) {
  try {
    const { eventUid } = req.params;

    // Serve from cache if available and fresh
    const cached = signInSheetCache.get(eventUid);
    if (cached && Date.now() - cached.ts < SIGNIN_CACHE_TTL) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(cached.html);
    }

    const [event, registrations] = await Promise.all([
      Event.findOne({ uid: eventUid }),
      Registration.find({ eventUid, status: "confirmed" }).sort({ submittedAt: 1 }),
    ]);

    if (!event) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });
    }

    const html = buildSignInSheetHTML(event, registrations);
    signInSheetCache.set(eventUid, { html, ts: Date.now() });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
}
