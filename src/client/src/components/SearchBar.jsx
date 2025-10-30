import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import { getList } from "../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faNewspaper,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Stockfeel-style search bar
 * - Supports Chinese fuzzy search (Fuse.js)
 * - Delayed trigger for Zhuyin input (0.5s debounce)
 * - Instantly displays dropdown search suggestions
 */
export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [fuse, setFuse] = useState(null);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Initialize Fuse.js (merge articles and events)
  useEffect(() => {
    async function initSearch() {
      try {
        const [articles, events] = await Promise.all([
          getList("articles"),
          getList("events"),
        ]);
        const combined = [
          ...articles.map((a) => ({ ...a, type: "article" })),
          ...events.map((e) => ({ ...e, type: "event" })),
        ];

        const fuseInstance = new Fuse(combined, {
          includeScore: true,
          threshold: 0.35, // Fuzzy tolerance (lower = stricter)
          keys: ["title", "description", "content_md", "content_html"],
        });
        setFuse(fuseInstance);
      } catch (err) {
        console.error("Search initialization failed:", err);
      }
    }
    initSearch();
  }, []);

  // Debounce search (trigger after 500ms of no typing)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!fuse || !query.trim()) {
        setResults([]);
        return;
      }
      const searchResults = fuse.search(query).slice(0, 6);
      setResults(searchResults.map((r) => r.item));
    }, 500);
    return () => clearTimeout(handler);
  }, [query, fuse]);

  // Handle selecting a result (navigate to article or event)
  const handleSelect = (item) => {
    if (item.type === "article") navigate(`/articles/${item.slug}`);
    else if (item.type === "event") navigate(`/events/${item.slug}`);
    setQuery("");
    setResults([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-64" ref={containerRef}>
      {/* Search input box */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜尋文章或活動"
        className="input input-bordered w-full rounded-full text-[#262626] placeholder:text-gray-400 pr-10"
      />
      <FontAwesomeIcon
        icon={faSearch}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
      />

      {/* Dropdown results */}
      {results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl">
          <ul className="divide-y divide-gray-100">
            {results.map((item) => (
              <li
                key={item._id}
                onClick={() => handleSelect(item)}
                className="p-3 hover:bg-gray-50 cursor-pointer"
              >
                {/* Type indicator */}
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={
                      item.type === "article" ? faNewspaper : faCalendarDays
                    }
                    className="text-[#03045E]"
                  />
                  {item.type === "article" ? "文章" : "活動"}
                </p>

                {/* Title */}
                <p className="font-semibold text-[#03045E] text-base truncate">
                  {item.title}
                </p>

                {/* Description / preview */}
                <p className="text-sm text-gray-500 line-clamp-1">
                  {item.preview ||
                    item.description ||
                    (item.content_md
                      ? item.content_md
                          .replace(/[#>*`[\]!]/g, "")
                          .slice(0, 60) + "..."
                      : "暫無內容")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
