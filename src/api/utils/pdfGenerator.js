import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const TMP_DIR = path.resolve("tmp");
const HOME = os.homedir();
const VENDOR_DIR = path.resolve("vendor");

// Extend PATH to include project-local vendor installs (Render-safe)
const extendedPATH = [
    `${VENDOR_DIR}/quarto/bin`,
    `${VENDOR_DIR}/TinyTeX/bin/x86_64-linux`,
    `${HOME}/quarto/bin`,
    `${HOME}/bin`,
    `${HOME}/.TinyTeX/bin/x86_64-linux`,
    process.env.PATH,
].join(":");

/** Format a Date to zh-TW string without relying on ICU locale data */
function formatDateZH(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "未知日期";
    // Convert to Taipei time (UTC+8)
    const taipei = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    const y = taipei.getUTCFullYear();
    const m = taipei.getUTCMonth() + 1;
    const day = taipei.getUTCDate();
    const h = taipei.getUTCHours();
    const min = String(taipei.getUTCMinutes()).padStart(2, "0");
    const sec = String(taipei.getUTCSeconds()).padStart(2, "0");
    const period = h < 12 ? "上午" : "下午";
    const h12 = h % 12 || 12;
    return `${y}/${m}/${day} ${period} ${h12}:${min}:${sec}`;
}

/**
 * Generate a PDF from a change request using Quarto + XeLaTeX + cwTeX
 */
export async function generateChangeRequestPDF({
    title,
    content_md,
    submittedBy,
    status,
    createdAt,
}) {
    // Ensure tmp directory exists
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

    const id = uuidv4().slice(0, 8);
    const qmdPath = path.join(TMP_DIR, `cr_${id}.qmd`);
    const pdfPath = path.join(TMP_DIR, `cr_${id}.pdf`);

    // Resolve absolute font path for XeLaTeX (trailing slash required by fontspec Path option)
    const fontsPath = path.join(VENDOR_DIR, "fonts") + "/";

    // Format date reliably (Node on Render may lack full ICU)
    const dateStr = formatDateZH(createdAt);

    // Build the .qmd file with YAML front matter
    const qmdContent = `---
title: "${title.replace(/"/g, '\\"')}"
author: "${submittedBy}"
format:
  pdf:
    documentclass: article
    pdf-engine: xelatex
    include-in-header:
      text: |
        \\usepackage{fontspec}
        \\usepackage{xeCJK}
        \\usepackage{graphicx}
        \\usepackage{titlesec}
        \\usepackage{titling}
        \\setCJKmainfont[Path=${fontsPath},Extension=.ttf]{cwTeXQMing-Medium}
        \\setCJKsansfont[Path=${fontsPath},Extension=.ttf]{cwTeXQHei-Bold}
        \\setCJKmonofont[Path=${fontsPath},Extension=.ttf]{cwTeXQKai-Medium}
        \\newCJKfontfamily\\cwHei[Path=${fontsPath},Extension=.ttf]{cwTeXQHei-Bold}
        \\newCJKfontfamily\\cwYuan[Path=${fontsPath},Extension=.ttf]{cwTeXQYuan-Medium}
        \\pagestyle{plain}
        \\setkeys{Gin}{width=0.7\\textwidth}
        \\titleformat{\\section}{\\Large\\bfseries\\cwHei}{\\thesection}{1em}{}
        \\titleformat{\\subsection}{\\large\\bfseries\\cwYuan}{\\thesubsection}{1em}{}
        \\pretitle{\\begin{center}\\huge\\bfseries\\cwHei}
        \\posttitle{\\par\\vskip 0.3em{\\Large\\cwHei 修改需求單}\\par\\end{center}\\vskip 0.5em}
        \\date{${dateStr}}
---

| 欄位 | 內容 |
|------|------|
| **狀態** | ${status} |
| **送出者** | ${submittedBy} |
| **送出時間** | ${dateStr} |

${content_md}
`;

    fs.writeFileSync(qmdPath, qmdContent, "utf-8");

    try {
        execSync(`quarto render "${qmdPath}" --to pdf`, {
            cwd: TMP_DIR,
            timeout: 60000,
            stdio: "pipe",
            env: { ...process.env, PATH: extendedPATH, HOME, OSFONTDIR: path.join(VENDOR_DIR, "fonts") },
        });
    } catch (err) {
        // Clean up .qmd on failure
        fs.unlink(qmdPath, () => { });
        throw new Error(`Quarto PDF generation failed: ${err.stderr?.toString() || err.message}`);
    }

    // Clean up .qmd after successful render
    fs.unlink(qmdPath, () => { });

    if (!fs.existsSync(pdfPath)) {
        throw new Error("PDF file was not generated");
    }

    return pdfPath;
}
