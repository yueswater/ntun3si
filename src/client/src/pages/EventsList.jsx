import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getList } from "../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    getList("events")
      .then((data) => setEvents(data))
      .catch((err) => console.error("Failed to fetch events:", err));
  }, []);

  const totalPages = Math.ceil(events.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentItems = events.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="container mx-auto px-6 py-10 max-w-5xl">
      <div className="flex flex-col divide-y divide-gray-200">
        {currentItems.map((event) => {
          const imgSrc =
            event.previewImg ||
            event.cover ||
            "https://via.placeholder.com/400x400?text=No+Image";

          return (
            <Link
              key={event._id || event.id}
              to={`/events/${event.slug}`}
              className="flex flex-col sm:flex-row gap-6 py-6 hover:bg-gray-50 rounded-xl px-4 transition"
            >
              {/* 左側縮圖 */}
              <div className="w-full sm:w-40 md:w-48 h-40 md:h-48 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                <img
                  src={imgSrc}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 右側內容 */}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#03045E] mb-2">
                  {event.title}
                </h2>

                <p className="text-gray-600 line-clamp-2 mb-3">
                  {event.description || "暫無活動說明"}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faCalendarDays}
                      className="text-[#03045E]"
                    />
                    {event.date
                      ? new Date(event.date).toLocaleDateString("zh-TW", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "日期未定"}
                  </span>

                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faLocationDot}
                      className="text-[#03045E]"
                    />
                    {event.location || "地點待定"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`btn btn-sm rounded-full ${
                currentPage === num
                  ? "bg-[#03045E] text-white"
                  : "bg-gray-200 text-[#03045E] hover:bg-gray-300"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
