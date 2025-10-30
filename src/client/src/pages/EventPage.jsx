import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { get } from "../utils/api";
import EventRegistrationForm from "../components/event/EventRegistrationForm";

/**
 * Event Page - Shows event details and registration form
 */
export default function EventPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch event details
        const eventData = await get(`/events/slug/${slug}`);
        setEvent(eventData);

        // Fetch registration form if exists
        try {
          const formData = await get(`/forms/event/${eventData.uid}`);
          setForm(formData);
        } catch (formError) {
          // Form might not exist, that's okay
          console.log("No registration form for this event");
          setForm(null);
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("活動不存在或已被刪除");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-error mb-4">
          {error || "活動不存在"}
        </h2>
        <a href="/events" className="btn btn-primary">
          返回活動列表
        </a>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isPastEvent = eventDate < new Date();

  return (
    <div className="container mx-auto px-6 py-10">
      {/* Event Hero Section */}
      <div className="mb-12">
        {event.previewImg && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <img
              src={event.previewImg}
              alt={event.title}
              className="w-full max-h-[500px] object-cover"
            />
          </div>
        )}

        <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

        {/* Event Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-sm text-gray-500">活動時間</p>
              <p className="font-medium">{eventDate.toLocaleString("zh-TW")}</p>
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-500">活動地點</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Speaker Info */}
        {event.speaker && (
          <div className="bg-base-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-2">講者</h3>
            <p className="font-medium mb-2">{event.speaker}</p>
            {event.speakerBio && (
              <p className="text-sm text-gray-600">{event.speakerBio}</p>
            )}
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="prose prose-lg max-w-none mb-8">
            <h3 className="text-xl font-semibold mb-3">活動簡介</h3>
            <p className="whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div className="alert alert-info mb-6">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="font-bold">注意事項</h4>
              <p className="text-sm whitespace-pre-wrap">{event.notes}</p>
            </div>
          </div>
        )}

        {/* Hashtags */}
        {event.hashtags && event.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.hashtags.map((tag, index) => (
              <span key={index} className="badge badge-outline">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Registration Form Section */}
      {form && !isPastEvent && (
        <div className="border-t pt-12">
          <h2 className="text-3xl font-bold mb-6">活動報名</h2>
          <EventRegistrationForm event={event} form={form} />
        </div>
      )}

      {/* Past Event Message */}
      {isPastEvent && (
        <div className="alert alert-warning">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>此活動已結束，無法報名</span>
        </div>
      )}

      {/* No Form Message */}
      {!form && !isPastEvent && (
        <div className="alert alert-info">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>此活動暫時尚未開放報名</span>
        </div>
      )}
    </div>
  );
}
