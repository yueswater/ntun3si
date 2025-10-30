import { marked } from "marked";

/**
 * Convert markdown text to HTML
 */
export function parseMarkdown(markdownText) {
  return marked.parse(markdownText || "");
}
