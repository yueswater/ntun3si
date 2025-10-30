import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Fuse from "fuse.js";
import { getList } from "../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faNewspaper } from "@fortawesome/free-solid-svg-icons";

export default function ISearch() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("query") || "";
  const [results, setResults] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (!query.trim()) return setResults([]);
      try {
        const [articles, events] = await Promise.all([
          getList("articles"),
          getList("events"),
        ]);
        const combined = [
          ...articles.map((a) => ({ ...a, type: "article" })),
          ...events.map((e) => ({ ...e, type: "event" })),
        ];

        const fuse = new Fuse(combined, {
          includeScore: true,
          threshold: 0.35,
          keys: ["title", "description", "content_md", "content_html"],
        });

        const result = fuse.search(query);
        setResults(result.map((r) => r.item));
      } catch (err) {
        console.error("Search failed:", err);
      }
    }
    fetchData();
  }, [query]);

  return (
    <div className="container mx-auto px-6 py-10 max-w-5xl">
      <h1 className="text-3xl font-bold text-[#03045E] mb-6">
        搜尋結果：「{query}」
      </h1>

      {results.length === 0 ? (
        <p className="text-gray-500">找不到相關結果。</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {results.map((item) => (
            <li key={item._id} className="py-4">
              <Link
                to={
                  item.type === "article"
                    ? `/articles/${item.slug}`
                    : `/events/${item.slug}`
                }
                className="block hover:bg-gray-50 rounded-lg p-3 transition"
              >
                <h2 className="text-lg font-semibold text-[#03045E] mb-1">
                  {item.title}
                </h2>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {item.preview || item.description || "暫無簡介"}
                </p>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={
                      item.type === "article" ? faNewspaper : faCalendarDays
                    }
                    className="text-[#03045E]"
                  />
                  {item.type === "article" ? "文章" : "活動"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
