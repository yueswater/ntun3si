import { useEffect, useState, useCallback } from "react";

/**
 * Custom hook for scroll spy functionality
 * Tracks which section is currently visible and auto-expands parent sections
 * @param {Array} toc - Table of contents array
 * @param {string} html - Article HTML content
 * @returns {Object} Current section, active section, and handlers
 */
export default function useScrollSpy(toc, html) {
  const [activeSection, setActiveSection] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);

  // Scroll spy effect
  useEffect(() => {
    if (!toc.length) return;

    const handleScroll = () => {
      const headings = document.querySelectorAll(
        "#article-content h2, #article-content h3"
      );
      if (!headings.length) return;

      // Find the heading closest to the top of the viewport
      let currentId = null;
      let minDistance = Infinity;

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        const distance = Math.abs(rect.top - 100);

        if (rect.top < window.innerHeight && rect.top > -100) {
          if (distance < minDistance) {
            minDistance = distance;
            currentId = heading.id;
          }
        }
      });

      if (currentId) {
        setCurrentSection(currentId);

        // Auto-expand the parent section
        const tocItem = toc.find((item) => item.id === currentId);
        if (tocItem) {
          if (tocItem.level === 3) {
            // If it's an h3, find and expand its parent h2
            const parentIdx = toc.findIndex((item) => item.id === currentId);
            for (let i = parentIdx - 1; i >= 0; i--) {
              if (toc[i].level === 2) {
                setActiveSection(toc[i].id);
                break;
              }
            }
          } else if (tocItem.level === 2) {
            // If it's an h2, expand it
            setActiveSection(currentId);
          }
        }
      }
    };

    // Initial call
    handleScroll();

    // Add scroll listener with throttling
    let timeoutId;
    const throttledScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleScroll();
        timeoutId = null;
      }, 100);
    };

    window.addEventListener("scroll", throttledScroll);
    return () => {
      window.removeEventListener("scroll", throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [toc, html]);

  // Smooth scroll to heading
  const scrollToId = useCallback((id) => {
    const target = document.getElementById(id);
    if (!target) {
      console.error("Target not found for id:", id);
      return;
    }
    const yOffset = -80;
    const y = target.getBoundingClientRect().top + window.scrollY + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback(
    (id) => {
      setActiveSection((prev) => (prev === id ? null : id));
      requestAnimationFrame(() => scrollToId(id));
    },
    [scrollToId]
  );

  return {
    activeSection,
    currentSection,
    scrollToId,
    toggleSection,
  };
}
