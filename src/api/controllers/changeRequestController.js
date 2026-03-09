import ChangeRequest from "../models/ChangeRequest.js";
import User from "../models/User.js";
import { parseMarkdown } from "../utils/markdownParser.js";
import { sendMail } from "../utils/emailService.js";
import { generateChangeRequestPDF } from "../utils/pdfGenerator.js";
import fs from "fs";

const ADMIN_EMAIL = "sungpinyue@gmail.com";

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

        // Populate submittedBy for email
        await cr.populate("submittedBy", "name email");

        // Send email notification
        try {
            await sendMail({
                to: ADMIN_EMAIL,
                subject: `【臺大國安社】新修改需求：${title}`,
                markdown:
                    `## 新修改需求單\n\n` +
                    `**標題：** ${title}\n\n` +
                    `**送出者：** ${user.name} (${user.email})\n\n` +
                    `**送出時間：** ${new Date().toLocaleString("zh-TW")}\n\n` +
                    `---\n\n${content_md}`,
            });
        } catch (emailErr) {
            console.error("Failed to send change request email:", emailErr);
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

        // Send email on status change
        if (status && status !== oldStatus) {
            const statusLabels = {
                submitted: "已送出",
                in_progress: "修改中",
                completed: "修改完畢",
            };
            try {
                await sendMail({
                    to: ADMIN_EMAIL,
                    subject: `【臺大國安社】修改需求狀態更新：${updated.title}`,
                    markdown:
                        `## 修改需求狀態更新\n\n` +
                        `**標題：** ${updated.title}\n\n` +
                        `**狀態變更：** ${statusLabels[oldStatus]} → ${statusLabels[status]}\n\n` +
                        `**更新時間：** ${new Date().toLocaleString("zh-TW")}\n\n`,
                });
            } catch (emailErr) {
                console.error("Failed to send status update email:", emailErr);
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
        res.json({ message: "Change request deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Download change request as PDF (generated via Quarto)
 */
export async function downloadChangeRequestPDF(req, res) {
    try {
        const cr = await ChangeRequest.findOne({ uid: req.params.id }).populate(
            "submittedBy",
            "name email"
        );
        if (!cr)
            return res.status(404).json({ message: "Change request not found" });

        const statusLabels = {
            submitted: "已送出",
            in_progress: "修改中",
            completed: "修改完畢",
        };

        const pdfPath = await generateChangeRequestPDF({
            title: cr.title,
            content_md: cr.content_md,
            submittedBy: cr.submittedBy?.name || "未知",
            status: statusLabels[cr.status],
            createdAt: new Date(cr.createdAt).toLocaleString("zh-TW"),
        });

        res.download(pdfPath, `修改需求_${cr.title}.pdf`, (err) => {
            // Clean up temp file after download
            fs.unlink(pdfPath, () => { });
            if (err && !res.headersSent) {
                res.status(500).json({ message: "PDF download failed" });
            }
        });
    } catch (error) {
        console.error("PDF generation error:", error);
        res.status(500).json({ message: error.message });
    }
}
