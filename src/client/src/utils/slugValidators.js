/**
 * Utility functions for validating and generating URL slugs.
 */

/**
 * Normalize a title into a slug-friendly format.
 * Converts to lowercase, replaces non-alphanumeric characters with dashes,
 * trims extra dashes, and encodes URI for safe use in URLs.
 * @param {string} title
 * @returns {string}
 */
export function normalizeSlugFromTitle(title) {
  if (!title) return "";
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-") // allow Chinese characters
    .replace(/(^-|-$)/g, "");
  return encodeURIComponent(slug);
}

/**
 * Check if a slug is valid.
 * Rules:
 *  - Must not be empty.
 *  - Must not contain "new-event-" placeholder.
 *  - Must contain at least one alphanumeric or CJK character.
 * @param {string} slug
 * @returns {boolean}
 */
export function isValidSlug(slug) {
  if (!slug) return false;
  const decoded = decodeURIComponent(slug);
  if (decoded.includes("new-event-")) return false;
  return /^[a-z0-9\u4e00-\u9fa5-_]+$/i.test(decoded);
}
