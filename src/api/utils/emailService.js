// src/api/utils/emailService.js
import nodemailer from "nodemailer";
import { marked } from "marked";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Load Markdown template and replace {{variables}}
 */
function loadTemplate(templateName, variables = {}) {
  const filePath = path.join(
    __dirname,
    "../email_templates",
    `${templateName}.md`
  );
  if (!fs.existsSync(filePath))
    throw new Error(`Template not found: ${templateName}`);
  let content = fs.readFileSync(filePath, "utf-8");
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    content = content.replace(regex, value);
  }
  return content;
}

/**
 * Send generic email
 */
export async function sendMail({ to, subject, markdown, attachments }) {
  const html = marked.parse(markdown || "");
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  };
  if (attachments) mailOptions.attachments = attachments;
  const info = await transporter.sendMail(mailOptions);
  return info;
}

/**
 * Registration confirmation
 */
export async function sendRegistrationEmail(user, verifyUrl) {
  const markdown = loadTemplate("registration", {
    name: user.name,
    verifyUrl,
  });
  await sendMail({
    to: user.email,
    subject: "【臺大國安社】請驗證您的電子郵件 | Email Verification Required",
    markdown,
  });
}

/**
 * Event registration confirmation
 */
export async function sendEventRegistrationEmail(user, event) {
  const markdown = loadTemplate("event_registration", {
    name: user.name,
    event_title: event.title,
    event_date: new Date(event.date).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
    event_location: event.location,
  });
  await sendMail({
    to: user.email,
    subject: `【臺大國安社】${event.title} 報名成功 | Event Registration Confirmed`,
    markdown,
  });
}

/**
 * Event accepted notification (正取通知)
 */
export async function sendEventAcceptedEmail(user, event) {
  const markdown = loadTemplate("event_accepted", {
    name: user.name,
    event_title: event.title,
    event_date: new Date(event.date).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
    event_location: event.location || "待通知",
  });
  await sendMail({
    to: user.email,
    subject: `【臺大國安社】${event.title} 正取通知 | Event Acceptance Notification`,
    markdown,
  });
}

/**
 * Event cancellation notification (取消通知)
 */
export async function sendEventCancelledEmail(user, event) {
  const markdown = loadTemplate("event_cancelled", {
    name: user.name,
    event_title: event.title,
    event_date: new Date(event.date).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
    event_location: event.location || "待通知",
  });
  await sendMail({
    to: user.email,
    subject: `【臺大國安社】${event.title} 報名取消通知 | Registration Cancellation Notice`,
    markdown,
  });
}

/**
 * Newsletter (Markdown template)
 */
export async function sendNewsletterEmail(email) {
  const unsubscribeUrl = `${process.env.BASE_URL}/api/mail/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

  const markdown = loadTemplate("newsletter_welcome", {
    unsubscribeUrl,
  });

  await sendMail({
    to: email,
    subject: "【臺大國安社】電子報訂閱成功 | Newsletter Subscription Confirmed",
    markdown,
  });
}

