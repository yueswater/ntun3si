import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { get } from "../utils/api";
import EventCheckinForm from "../components/event/EventCheckinForm";

export default function EventCheckinPage() {
    const { slug } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoading(true);
                const eventData = await get(`/events/slug/${slug}`);
                setEvent(eventData);
            } catch {
                setError("找不到此活動");
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchEvent();
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
                    {error || "找不到此活動"}
                </h2>
                <a href="/events" className="btn btn-primary">
                    返回活動列表
                </a>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-10">
            <div className="max-w-xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                <p className="text-gray-500 mb-8">活動簽到</p>

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <EventCheckinForm eventUid={event.uid} />
                    </div>
                </div>
            </div>
        </div>
    );
}
