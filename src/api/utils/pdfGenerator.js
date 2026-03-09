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

    // Build the .qmd file with YAML front matter
    const qmdContent = `---
title: "${title.replace(/"/g, '\\"')}"
subtitle: "修改需求單"
author: "${submittedBy}"
date: "${createdAt}"
format:
  pdf:
    documentclass: article
    pdf-engine: xelatex
    include-in-header:
      text: |
        \\usepackage{fontspec}
        \\usepackage{xeCJK}
        \\setCJKmainfont[Path=${fontsPath},Extension=.ttf]{cwTeXMing}
        \\setCJKsansfont[Path=${fontsPath},Extension=.ttf]{cwTeXHei}
        \\setCJKmonofont[Path=${fontsPath},Extension=.ttf]{cwTeXKai}
        \\usepackage{fancyhdr}
        \\pagestyle{fancy}
        \\fancyhead[L]{臺大國安社 — 修改需求單}
        \\fancyhead[R]{${status}}
        \\fancyfoot[C]{\\thepage}
---

| 欄位 | 內容 |
|------|------|
| **狀態** | ${status} |
| **送出者** | ${submittedBy} |
| **送出時間** | ${createdAt} |

---

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
