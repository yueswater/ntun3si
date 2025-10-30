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
export async function sendMail({ to, subject, markdown }) {
  const html = marked.parse(markdown || "");
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  };
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
    subject: "Welcome to NTUN3SI - Please confirm your email",
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
    event_date: new Date(event.date).toLocaleString("zh-TW"),
    event_location: event.location,
  });
  await sendMail({
    to: user.email,
    subject: `[NTUN3SI] ${event.title} 報名成功`,
    markdown,
  });
}

/**
 * Newsletter (Markdown template)
 */
export async function sendNewsletterEmail(recipients, subject, content) {
  const markdown = loadTemplate("newsletter", { subject, content });
  for (const email of recipients) {
    await sendMail({ to: email, subject, markdown });
  }
}
