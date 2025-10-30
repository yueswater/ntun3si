import { useNavigate } from "react-router-dom";

export default function EventCard({ event, variant = "default" }) {
  const navigate = useNavigate();

  const defaultImg =
    "https://via.placeholder.com/800x450/e5e7eb/9ca3af?text=No+Image";

  const formatDate = (date) => {
    if (!date) return "日期待定";
    return new Date(date).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "日期待定";
    return new Date(date).toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (variant === "compact") {
    return (
      <div
        className="bg-base-100 hover:bg-base-200 transition-colors cursor-pointer group rounded-lg overflow-hidden shadow"
        onClick={() => navigate(`/events/${event.slug}`)}
      >
        <div
          className="relative w-full overflow-hidden bg-base-200"
          style={{ paddingTop: "100%", maxWidth: "100%" }}
        >
          <img
            src={event.previewImg || defaultImg}
            alt={event.title}
            className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            style={{ borderRadius: 0 }}
          />
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
            {event.description
              ? event.description.slice(0, 40) + "..."
              : "暫無描述"}
          </p>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-base-200">
            <span className="text-xs text-gray-400">
              {formatDate(event.date)}
            </span>
            <div className="badge badge-outline px-2 py-1 text-sm">活動</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-base-100 hover:bg-base-200 transition-colors cursor-pointer group rounded-lg overflow-hidden shadow"
      onClick={() => navigate(`/events/${event.slug}`)}
    >
      <div
        className="relative w-full overflow-hidden bg-base-200"
        style={{ paddingTop: "100%", maxWidth: "100%" }}
      >
        <img
          src={event.previewImg || defaultImg}
          alt={event.title}
          className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          style={{ borderRadius: 0 }}
        />
      </div>
      <div className="p-4">
        <h2 className="text-lg font-bold">
          {event.title}
          {event.maxParticipants &&
            event.participants?.length >= event.maxParticipants && (
              <div className="badge badge-error text-white ml-2">額滿</div>
            )}
        </h2>
        <p className="text-sm text-gray-500 line-clamp-2 mt-2">
          {event.description || "暫無描述"}
        </p>
        <div className="flex justify-between items-center mt-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">
              {formatDateTime(event.date)}
            </span>
            {event.location && (
              <span className="text-xs text-gray-400">{event.location}</span>
            )}
          </div>
          <div className="flex flex-col gap-1 items-end">
            {event.maxParticipants && (
              <span className="text-xs text-gray-400">
                {event.participants?.length || 0}/{event.maxParticipants}
              </span>
            )}
            <div className="badge badge-outline px-2 py-1 text-sm">活動</div>
          </div>
        </div>
      </div>
    </div>
  );
}
