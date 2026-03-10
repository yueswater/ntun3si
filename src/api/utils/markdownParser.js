import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

/**
 * Convert markdown text to sanitized HTML
 */
export function parseMarkdown(markdownText) {
  const rawHtml = marked.parse(markdownText || "");
  return DOMPurify.sanitize(rawHtml);
}
