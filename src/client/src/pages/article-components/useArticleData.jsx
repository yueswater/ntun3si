import { useEffect, useState, useCallback } from "react";
import { pinyin } from "pinyin-pro";
import { get } from "../../utils/api";
import { markdownToHtml } from "../../utils/markdown";

/**
 * Custom hook for fetching and processing article data
 * @param {string} slug - Article slug from URL params
 * @returns {Object} Article data, HTML content, and TOC
 */
export default function useArticleData(slug) {
  const [article, setArticle] = useState(null);
  const [html, setHtml] = useState("");
  const [toc, setToc] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Slugify function for creating URL-friendly IDs
  const slugify = useCallback((text) => {
    if (!text) return "";

    // First try pinyin conversion
    const pinyinArray = pinyin(text, { toneType: "none", type: "array" });
    const converted = pinyinArray
      .join("-")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    if (converted && converted.length > 0) {
      return converted;
    }

    // Fallback for text that doesn't convert well
    return text
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[！!、。．·・：:（）()【】［］「」『』—–‧‥...%]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
  }, []);

  // Add IDs to headings in HTML
  const addHeadingIds = useCallback(
    (htmlString) => {
      const temp = document.createElement("div");
      temp.innerHTML = htmlString;

      const headings = temp.querySelectorAll("h2, h3");
      headings.forEach((el, idx) => {
        const text = el.textContent || `未命名標題 ${idx + 1}`;
        const id = slugify(text) || `heading-${idx}`;
        el.id = id;
      });

      return temp.innerHTML;
    },
    [slugify]
  );

  // Generate TOC from HTML
  const generateToc = useCallback(
    (htmlString) => {
      const temp = document.createElement("div");
      temp.innerHTML = htmlString;

      const headings = Array.from(temp.querySelectorAll("h2, h3")).map(
        (el, idx) => {
          const text = el.textContent || `未命名標題 ${idx + 1}`;
          const id = el.id || slugify(text) || `heading-${idx}`;

          return {
            id: id,
            text: text,
            level: el.tagName === "H2" ? 2 : 3,
          };
        }
      );

      return headings;
    },
    [slugify]
  );

  useEffect(() => {
    let didFetch = false;
    const fetchArticle = async () => {
      if (didFetch) return;
      didFetch = true;
      if (!slug) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await get(`articles/${slug}`);
        setArticle(data);

        // Convert markdown to HTML (async)
        const rawHtml =
          data.content_html || (await markdownToHtml(data.content_md || ""));

        // Add IDs to headings
        const htmlWithIds = addHeadingIds(rawHtml);

        // Generate TOC
        const tocData = generateToc(htmlWithIds);

        // Update state
        setHtml(htmlWithIds);
        setToc(tocData);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [slug, slugify, addHeadingIds, generateToc]);

  // Ensure DOM headings have IDs after render
  useEffect(() => {
    if (!html || !toc.length) return;

    const container = document.getElementById("article-content");
    if (!container) return;

    const headings = container.querySelectorAll("h2, h3");
    let needsUpdate = false;

    headings.forEach((el, idx) => {
      if (!el.id || el.id.trim() === "") {
        const tocItem = toc[idx];
        el.id = tocItem
          ? tocItem.id
          : slugify(el.textContent) || `heading-${idx}`;
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      console.log("IDs were missing and have been reapplied");
    }
  }, [html, toc, slugify]);

  return {
    article,
    html,
    toc,
    isLoading,
    error,
  };
}
