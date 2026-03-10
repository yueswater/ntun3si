import ChangeRequest from "../models/ChangeRequest.js";
import User from "../models/User.js";
import { parseMarkdown } from "../utils/markdownParser.js";
import { sendMail } from "../utils/emailService.js";
import { generateChangeRequestPDF } from "../utils/pdfGenerator.js";
import fs from "fs";
import path from "path";

const ADMIN_EMAIL = "sungpinyue@gmail.com";
const PDF_CACHE_DIR = path.resolve("tmp/pdf_cache");
if (!fs.existsSync(PDF_CACHE_DIR)) fs.mkdirSync(PDF_CACHE_DIR, { recursive: true });

/** Return a stable cache path for a CR's PDF */
function cachedPdfPath(uid) {
    return path.join(PDF_CACHE_DIR, `cr_${uid}.pdf`);
}

/** Generate PDF, copy to cache, return cache path */
async function generateAndCache(cr, statusLabels) {
    const tmpPath = await generateChangeRequestPDF({
        title: cr.title,
        content_md: cr.content_md,
        submittedBy: cr.submittedBy?.name || "未知",
        status: statusLabels[cr.status],
        createdAt: cr.createdAt,
    });
    const dest = cachedPdfPath(cr.uid);
    fs.copyFileSync(tmpPath, dest);
    fs.unlink(tmpPath, () => { });
    // Update the pdfPath in DB (fire-and-forget)
    ChangeRequest.updateOne({ uid: cr.uid }, { pdfPath: dest }).catch(() => { });
    return dest;
}

/**
 * Create a new change request and email the admin
 */
export async function createChangeRequest(req, res) {
    try {
        const { title, content_md } = req.body;
        const content_html = parseMarkdown(content_md);

        const user = await User.findOne({ uid: req.user.uid });
        if (!user) return res.status(404).json({ message: "User not found" });

        const cr = await ChangeRequest.create({
            title,
            content_md,
            content_html,
            submittedBy: user._id,
        });

        // Generate PDF, cache it, and send as email attachment
        try {
            const statusLabels = { submitted: "已送出", in_progress: "修改中", completed: "修改完畢" };
            await cr.populate("submittedBy", "name email");
            const pdfPath = await generateAndCache(cr, statusLabels);
            await sendMail({
                to: ADMIN_EMAIL,
                subject: `【臺大國安社】新修改需求：${title}`,
                markdown: `收到一份新的修改需求單，請查看附件 PDF。\n\n**標題：** ${title}\n\n**送出者：** ${user.name}`,
                attachments: [{ filename: `修改需求_${title}.pdf`, path: pdfPath }],
            });
            console.log(`Change request email with PDF sent to ${ADMIN_EMAIL}`);
        } catch (emailErr) {
            console.error("Failed to send change request email:", emailErr.message, emailErr.stack);
        }

        res.status(201).json(cr);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Get all change requests
 */
export async function getChangeRequests(req, res) {
    try {
        const list = await ChangeRequest.find()
            .populate("submittedBy", "name email")
            .sort({ createdAt: -1 });
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Get single change request by UID
 */
export async function getChangeRequest(req, res) {
    try {
        const cr = await ChangeRequest.findOne({ uid: req.params.id }).populate(
            "submittedBy",
            "name email"
        );
        if (!cr)
            return res.status(404).json({ message: "Change request not found" });
        res.json(cr);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Update change request (content and/or status)
 */
export async function updateChangeRequest(req, res) {
    try {
        const { id } = req.params;
        const { title, content_md, status } = req.body;

        const existing = await ChangeRequest.findOne({ uid: id });
        if (!existing)
            return res.status(404).json({ message: "Change request not found" });

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content_md !== undefined) {
            updateData.content_md = content_md;
            updateData.content_html = parseMarkdown(content_md);
        }

        const oldStatus = existing.status;

        if (status !== undefined) updateData.status = status;

        const updated = await ChangeRequest.findOneAndUpdate(
            { uid: id },
            updateData,
            { new: true }
        ).populate("submittedBy", "name email");

        // Send email with PDF on any content/status change
        const contentChanged = content_md !== undefined || title !== undefined;
        const statusChanged = status && status !== oldStatus;

        if (contentChanged || statusChanged) {
            const statusLabels = {
                submitted: "已送出",
                in_progress: "修改中",
                completed: "修改完畢",
            };
            try {
                const pdfPath = await generateAndCache(updated, statusLabels);
                const emailSubject = statusChanged
                    ? `【臺大國安社】修改需求狀態更新：${updated.title}`
                    : `【臺大國安社】修改需求已更新：${updated.title}`;
                const emailBody = statusChanged
                    ? `修改需求狀態已變更，請查看附件 PDF。\n\n**標題：** ${updated.title}\n\n**狀態：** ${statusLabels[oldStatus]} → ${statusLabels[status]}`
                    : `修改需求內容已更新，請查看附件 PDF。\n\n**標題：** ${updated.title}`;
                await sendMail({
                    to: ADMIN_EMAIL,
                    subject: emailSubject,
                    markdown: emailBody,
                    attachments: [{ filename: `修改需求_${updated.title}.pdf`, path: pdfPath }],
                });
                console.log(`Change request update email with PDF sent to ${ADMIN_EMAIL}`);
            } catch (emailErr) {
                console.error("Failed to send update email:", emailErr.message, emailErr.stack);
            }
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Delete change request
 */
export async function deleteChangeRequest(req, res) {
    try {
        const deleted = await ChangeRequest.findOneAndDelete({
            uid: req.params.id,
        });
        if (!deleted)
            return res.status(404).json({ message: "Change request not found" });
        // Remove cached PDF
        const cached = cachedPdfPath(deleted.uid);
        fs.unlink(cached, () => { });
        res.json({ message: "Change request deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Download change request as PDF – serve cached version if available
 */
export async function downloadChangeRequestPDF(req, res) {
    try {
        const cr = await ChangeRequest.findOne({ uid: req.params.id }).populate(
            "submittedBy",
            "name email"
        );
        if (!cr)
            return res.status(404).json({ message: "Change request not found" });

        // Check cache first
        const cached = cachedPdfPath(cr.uid);
        if (fs.existsSync(cached)) {
            return res.download(cached, `修改需求_${cr.title}.pdf`, (err) => {
                if (err && !res.headersSent) {
                    res.status(500).json({ message: "PDF download failed" });
                }
            });
        }

        // Cache miss — regenerate
        const statusLabels = {
            submitted: "已送出",
            in_progress: "修改中",
            completed: "修改完畢",
        };

        const pdfPath = await generateAndCache(cr, statusLabels);

        res.download(pdfPath, `修改需求_${cr.title}.pdf`, (err) => {
            if (err && !res.headersSent) {
                res.status(500).json({ message: "PDF download failed" });
            }
        });
    } catch (error) {
        console.error("PDF generation error:", error);
        res.status(500).json({ message: error.message });
    }
}
