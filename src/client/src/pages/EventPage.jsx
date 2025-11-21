import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { get } from "../utils/api";
import EventRegistrationForm from "../components/event/EventRegistrationForm";
import { useTranslation } from "react-i18next";

export default function EventPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const eventData = await get(`/events/slug/${slug}`);
        setEvent(eventData);

        try {
          const formData = await get(`/forms/event/${eventData.uid}`);
          setForm(formData);
        } catch {
          setForm(null);
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError(t("event.not_found"));
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug, t]);

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
          {error || t("event.not_found")}
        </h2>
        <a href="/events" className="btn btn-primary">
          {t("event.back_list")}
        </a>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isPastEvent = eventDate < new Date();

  return (
    <div className="container mx-auto px-6 py-10">
      {/* Top Section */}
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

        {/* Event Meta */}
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
              <p className="text-sm text-gray-500">{t("event.time")}</p>
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
                <p className="text-sm text-gray-500">{t("event.location")}</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Speaker */}
        {event.speaker && (
          <div className="bg-base-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-2">{t("event.speaker")}</h3>
            <p className="font-medium mb-2">{event.speaker}</p>
            {event.speakerBio && (
              <p className="text-sm text-gray-600">{event.speakerBio}</p>
            )}
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="prose prose-lg max-w-none mb-8">
            <h3 className="text-xl font-semibold mb-3">
              {t("event.description_title")}
            </h3>
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
              <h4 className="font-bold">{t("event.notes_title")}</h4>
              <p className="text-sm whitespace-pre-wrap">{event.notes}</p>
            </div>
          </div>
        )}

        {/* Hashtags */}
        {event.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.hashtags.map((tag, index) => (
              <span key={index} className="badge badge-outline">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Registration */}
      {form && !isPastEvent && (
        <div className="border-t pt-12">
          <h2 className="text-3xl font-bold mb-6">{t("event.registration")}</h2>
          <EventRegistrationForm event={event} form={form} />
        </div>
      )}

      {/* Past Event */}
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
          <span>{t("event.ended")}</span>
        </div>
      )}

      {/* No Form */}
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
          <span>{t("event.not_open")}</span>
        </div>
      )}
    </div>
  );
}
