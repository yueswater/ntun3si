import Registration from "../models/Registration.js";
import Event from "../models/Event.js";

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
            status: { $ne: "cancelled" },
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

        if (matched.isCheckedIn) {
            return res.status(409).json({
                success: false,
                error: { code: "ALREADY_CHECKED_IN", message: "您已完成簽到，無需重複操作" },
            });
        }

        matched.isCheckedIn = true;
        matched.checkedInAt = new Date();
        await matched.save();

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
            { eventUid, status: { $ne: "cancelled" } },
            { uid: 1, name: 1, isCheckedIn: 1, checkedInAt: 1, _id: 0 }
        )
            .sort({ name: 1 })
            .lean();

        const total = registrations.length;
        const checkedIn = registrations.filter((r) => r.isCheckedIn).length;

        return res.json({
            success: true,
            data: {
                total,
                checkedIn,
                attendees: registrations,
            },
        });
    } catch (err) {
        next(err);
    }
};
