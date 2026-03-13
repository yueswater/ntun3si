import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import { exportSignInSheet as _adminExportSignInSheet } from "./registrationController.js";
import { sendEventCheckinEmail, sendEventCheckoutEmail } from "../utils/emailService.js";

function formatTaipeiTime(date) {
    return new Date(date).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
}

function maskName(name) {
    if (!name) return "***";
    if (name.length <= 1) return "*";
    if (name.length === 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
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

/**
 * POST /api/checkin/verify-password
 * Verify dashboard password against env variable
 */
export const verifyDashboardPassword = async (req, res, next) => {
    try {
        const { password } = req.body;

        if (!password || !password.trim()) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_INPUT", message: "密碼為必填欄位" },
            });
        }

        const dashboardPassword = process.env.DASHBOARD_PASSWORD;
        if (!dashboardPassword) {
            console.error("[CHECKIN] DASHBOARD_PASSWORD not set in environment");
            return res.status(500).json({
                success: false,
                error: { code: "SERVER_ERROR", message: "伺服器設定錯誤" },
            });
        }

        if (password.trim() !== dashboardPassword) {
            return res.status(401).json({
                success: false,
                error: { code: "WRONG_PASSWORD", message: "密碼錯誤" },
            });
        }

        return res.json({ success: true, message: "驗證通過" });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/checkin/events
 * Return event list (id + title only) for dashboard dropdown
 */
export const getCheckinEvents = async (req, res, next) => {
    try {
        const events = await Event.find({}, { uid: 1, title: 1, date: 1, _id: 0 })
            .sort({ date: -1 })
            .lean();

        return res.json({ success: true, data: events });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/checkin/event/:eventUid
 * Check in an attendee by name + last 3 digits of phone
 */
export const checkinAttendee = async (req, res, next) => {
    try {
        const { eventUid } = req.params;
        const { name, phoneLast3 } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_INPUT", message: "姓名為必填欄位" },
            });
        }

        if (!phoneLast3 || !phoneLast3.trim()) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_INPUT", message: "手機末三碼為必填欄位" },
            });
        }

        const trimmedName = name.trim();
        const trimmedPhone3 = phoneLast3.trim();

        // Validate: must be exactly 3 digits
        if (!/^\d{3}$/.test(trimmedPhone3)) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_INPUT", message: "手機末三碼必須為 3 位數字" },
            });
        }

        // Find registration matching name AND phone last 3 digits
        // Phone is stored as "09xx-xxx-xxx", so last 3 digits are the last 3 chars after removing non-digits
        const registrations = await Registration.find({
            eventUid,
            name: trimmedName,
            status: "confirmed",
        });

        const matched = registrations.find((reg) => {
            const digits = reg.phone.replace(/\D/g, "");
            return digits.slice(-3) === trimmedPhone3;
        });

        if (!matched) {
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "查無符合的報名資料，請確認姓名與手機末三碼是否正確" },
            });
        }

        if (matched.isCheckedOut) {
            return res.status(409).json({
                success: false,
                error: { code: "ALREADY_CHECKED_OUT", message: "您已簽退，無法再次簽到" },
            });
        }

        if (matched.isCheckedIn) {
            return res.status(409).json({
                success: false,
                error: { code: "ALREADY_CHECKED_IN", message: "您已完成簽到，無需重複操作" },
            });
        }

        matched.isCheckedIn = true;
        matched.checkedInAt = new Date();
        await matched.save();

        // Send check-in confirmation email
        try {
            const event = await Event.findOne({ uid: eventUid });
            if (event) {
                await sendEventCheckinEmail(
                    { name: matched.name, email: matched.email },
                    event,
                    formatTaipeiTime(matched.checkedInAt)
                );
            }
        } catch (emailErr) {
            console.error("[CHECKIN] Failed to send check-in email:", emailErr);
        }

        return res.json({
            success: true,
            message: `${trimmedName}，簽到成功！`,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/checkin/event/:eventUid/attendees
 * Return attendee list for dashboard (name + checkin status ONLY, no PII)
 * Requires dashboard password in x-dashboard-password header
 */
export const getEventAttendees = async (req, res, next) => {
    try {
        const { eventUid } = req.params;
        const password = req.headers["x-dashboard-password"];

        if (!password || password !== process.env.DASHBOARD_PASSWORD) {
            return res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "未授權存取" },
            });
        }

        const registrations = await Registration.find(
            { eventUid, status: "confirmed" },
            { uid: 1, name: 1, email: 1, phone: 1, isCheckedIn: 1, checkedInAt: 1, isCheckedOut: 1, checkedOutAt: 1, _id: 0 }
        )
            .sort({ name: 1 })
            .lean();

        const total = registrations.length;
        const checkedIn = registrations.filter((r) => r.isCheckedIn).length;
        const checkedOut = registrations.filter((r) => r.isCheckedOut).length;

        const attendees = registrations.map((r) => ({
            uid: r.uid,
            name: maskName(r.name),
            email: maskEmail(r.email),
            phone: maskPhone(r.phone),
            isCheckedIn: r.isCheckedIn,
            isCheckedOut: r.isCheckedOut || false,
        }));

        return res.json({
            success: true,
            data: {
                total,
                checkedIn,
                checkedOut,
                attendees,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/checkin/event/:eventUid/signin-pdf
 * Export sign-in sheet PDF (password-protected via header)
 * Reuses the existing Quarto-based exportSignInSheet logic
 */
export const exportCheckinSignInSheet = async (req, res, next) => {
    try {
        const password = req.headers["x-dashboard-password"];

        if (!password || password !== process.env.DASHBOARD_PASSWORD) {
            return res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "未授權存取" },
            });
        }

        // Delegate to the admin export handler
        return _adminExportSignInSheet(req, res);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/checkin/event/:eventUid/checkout
 * Check out an attendee by name + last 3 digits of phone
 * Once checked out, cannot check in again
 */
export const checkoutAttendee = async (req, res, next) => {
    try {
        const { eventUid } = req.params;
        const { name, phoneLast3 } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_INPUT", message: "姓名為必填欄位" },
            });
        }

        if (!phoneLast3 || !phoneLast3.trim()) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_INPUT", message: "手機末三碼為必填欄位" },
            });
        }

        const trimmedName = name.trim();
        const trimmedPhone3 = phoneLast3.trim();

        if (!/^\d{3}$/.test(trimmedPhone3)) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_INPUT", message: "手機末三碼必須為 3 位數字" },
            });
        }

        const registrations = await Registration.find({
            eventUid,
            name: trimmedName,
            status: "confirmed",
        });

        const matched = registrations.find((reg) => {
            const digits = reg.phone.replace(/\D/g, "");
            return digits.slice(-3) === trimmedPhone3;
        });

        if (!matched) {
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "查無符合的報名資料，請確認姓名與手機末三碼是否正確" },
            });
        }

        if (!matched.isCheckedIn) {
            return res.status(400).json({
                success: false,
                error: { code: "NOT_CHECKED_IN", message: "您尚未簽到，無法簽退" },
            });
        }

        if (matched.isCheckedOut) {
            return res.status(409).json({
                success: false,
                error: { code: "ALREADY_CHECKED_OUT", message: "您已完成簽退，無需重複操作" },
            });
        }

        matched.isCheckedOut = true;
        matched.checkedOutAt = new Date();
        await matched.save();

        // Send check-out confirmation email
        try {
            const event = await Event.findOne({ uid: eventUid });
            if (event) {
                await sendEventCheckoutEmail(
                    { name: matched.name, email: matched.email },
                    event,
                    formatTaipeiTime(matched.checkedOutAt)
                );
            }
        } catch (emailErr) {
            console.error("[CHECKIN] Failed to send check-out email:", emailErr);
        }

        return res.json({
            success: true,
            message: `${trimmedName}，簽退成功！`,
        });
    } catch (err) {
        next(err);
    }
};
