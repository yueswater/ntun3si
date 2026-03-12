import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Registration from "../models/Registration.js";
import RegistrationForm from "../models/RegistrationForm.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { sendEventRegistrationEmail } from "../utils/emailService.js";

// ─── Sign-in sheet helpers ────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const signInSheetCache = new Map();
const SIGNIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let _tplCache = null;
function getSignInAssets() {
  if (!_tplCache) {
    _tplCache = {
      html: fs.readFileSync(path.join(__dirname, "../templates/signin-sheet.html"), "utf-8"),
    };
  }
  return _tplCache;
}

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
  const { html: template } = getSignInAssets();

  const title = escapeHtml(event.title);
  const startTime = formatEventTime(event.date);
  const endTime = event.endDate ? ` ～ ${formatEventTime(event.endDate)}` : "";
  const timeStr = startTime + endTime;
  const location = event.location ? escapeHtml(event.location) : "—";

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(registrations.length / PAGE_SIZE));

  const pagesHTML = Array.from({ length: totalPages }, (_, pi) => {
    const pageRegs = registrations.slice(pi * PAGE_SIZE, (pi + 1) * PAGE_SIZE);

    const rowsHTML = pageRegs.length === 0
      ? `<tr><td colspan="6" style="text-align:center;padding:12pt;color:#9ca3af;">目前無已確認的報名者</td></tr>`
      : pageRegs.map((reg, ri) => {
        const no = pi * PAGE_SIZE + ri + 1;
        return `<tr>
            <td>${no}</td>
            <td class="col-name">${escapeHtml(reg.name)}</td>
            <td class="col-email">${escapeHtml(maskEmail(reg.email))}</td>
            <td class="col-phone">${escapeHtml(maskPhone(reg.phone))}</td>
            <td class="sign-cell"></td>
            <td class="sign-cell"></td>
          </tr>`;
      }).join("");

    const pageInfo = `第 ${pi + 1} 頁 ／ 共 ${totalPages} 頁`;

    return `<div class="sheet"> 
  <div class="header">
    <div class="header-top">
      <div class="logo-mark">簽</div>
      <div class="badge"><i class="fa-solid fa-clipboard-check"></i> 出席簽到表</div>
    </div>
    <div class="event-title">${title}</div>
    <div class="meta-row">
      <div class="meta-item">
        <div class="meta-icon"><i class="fa-regular fa-calendar"></i></div>
        <div><div class="meta-label">活動時間</div><div class="meta-value">${escapeHtml(timeStr)}</div></div>
      </div>
      <div class="meta-item">
        <div class="meta-icon"><i class="fa-solid fa-location-dot"></i></div>
        <div><div class="meta-label">活動地點</div><div class="meta-value">${location}</div></div>
      </div>
      <div class="meta-item">
        <div class="meta-icon"><i class="fa-solid fa-users"></i></div>
        <div><div class="meta-label">報名人數</div><div class="meta-value">${registrations.length} 人</div></div>
      </div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="table-section">
    <div class="section-label"><i class="fa-solid fa-list-check"></i> 簽到名單</div>
    <table>
      <thead>
        <tr>
          <th class="col-no">#</th>
          <th class="col-name">姓名</th>
          <th class="col-email">電子郵件</th>
          <th class="col-phone">電話</th>
          <th class="col-sign">簽到</th>
          <th class="col-sign">簽退</th>
        </tr>
      </thead>
      <tbody>${rowsHTML}</tbody>
    </table>
  </div>
  <div class="footer">
    <div class="footer-note">
      <i class="fa-solid fa-shield-halved"></i> 機密文件 — 請妥善保管，活動結束後依規定銷毀
    </div>
    <div class="footer-stamp">
      <div class="label">承辦人簽章</div>
      <div class="stamp-line"></div>
    </div>
  </div>
  <div class="page-info">${pageInfo}</div>
</div>`;
  }).join("\n");

  return template
    .replace(/\{\{EVENT_TITLE\}\}/g, title)
    .replace("{{PAGES}}", pagesHTML);
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
