import { useState, useEffect, useRef, useCallback } from "react";
import { post, get } from "../../utils/api";
import axiosClient from "../../api/axiosClient";

export default function CheckinDashboard() {
    const [password, setPassword] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [authError, setAuthError] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    // Store the verified password for subsequent API calls
    const verifiedPassword = useRef("");

    const [events, setEvents] = useState([]);
    const [selectedEventUid, setSelectedEventUid] = useState("");
    const [attendees, setAttendees] = useState([]);
    const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
    const [loading, setLoading] = useState(false);

    const pollingRef = useRef(null);

    // Step 1: Verify password
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setAuthError("");

        if (!password.trim()) {
            setAuthError("請輸入密碼");
            return;
        }

        setAuthLoading(true);
        try {
            await post("/checkin/verify-password", { password: password.trim() });
            verifiedPassword.current = password.trim();
            setAuthenticated(true);
        } catch (err) {
            setAuthError(err.response?.data?.error?.message || "驗證失敗");
        } finally {
            setAuthLoading(false);
        }
    };

    // Step 2: Load events after authentication
    useEffect(() => {
        if (!authenticated) return;

        const fetchEvents = async () => {
            try {
                const res = await get("/checkin/events");
                setEvents(res.data || []);
            } catch {
                setEvents([]);
            }
        };

        fetchEvents();
    }, [authenticated]);

    // Step 3: Fetch attendees for selected event
    const fetchAttendees = useCallback(async () => {
        if (!selectedEventUid || !verifiedPassword.current) return;

        try {
            const res = await axiosClient.get(
                `/checkin/event/${selectedEventUid}/attendees`,
                { headers: { "x-dashboard-password": verifiedPassword.current } }
            );
            const data = res.data.data;
            setAttendees(data.attendees || []);
            setStats({ total: data.total, checkedIn: data.checkedIn });
        } catch {
            // If unauthorized, force re-auth
            setAuthenticated(false);
            verifiedPassword.current = "";
        }
    }, [selectedEventUid]);

    // Polling: fetch every 3 seconds when an event is selected
    useEffect(() => {
        if (!selectedEventUid || !authenticated) {
            clearInterval(pollingRef.current);
            return;
        }

        // Fetch immediately on selection change
        setLoading(true);
        fetchAttendees().finally(() => setLoading(false));

        pollingRef.current = setInterval(fetchAttendees, 3000);

        return () => clearInterval(pollingRef.current);
    }, [selectedEventUid, authenticated, fetchAttendees]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearInterval(pollingRef.current);
    }, []);

    // --- Render: Password gate ---
    if (!authenticated) {
        return (
            <div className="max-w-md mx-auto">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title justify-center text-2xl mb-4">
                            簽到儀表板
                        </h2>
                        <p className="text-center text-sm text-gray-500 mb-4">
                            請輸入主辦方密碼以存取儀表板
                        </p>

                        {authError && (
                            <div className="alert alert-error mb-4">
                                <span>{authError}</span>
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="form-control">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder="請輸入密碼"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                disabled={authLoading}
                            >
                                {authLoading ? (
                                    <>
                                        <span className="loading loading-spinner"></span>
                                        驗證中...
                                    </>
                                ) : (
                                    "進入儀表板"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // --- Render: Dashboard ---
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">簽到儀表板</h2>

            {/* Event selector */}
            <div className="form-control max-w-md">
                <label className="label">
                    <span className="label-text">選擇活動</span>
                </label>
                <select
                    value={selectedEventUid}
                    onChange={(e) => {
                        setSelectedEventUid(e.target.value);
                        setAttendees([]);
                        setStats({ total: 0, checkedIn: 0 });
                    }}
                    className="select select-bordered w-full"
                >
                    <option value="">— 請選擇活動 —</option>
                    {events.map((evt) => (
                        <option key={evt.uid} value={evt.uid}>
                            {evt.title}
                        </option>
                    ))}
                </select>
            </div>

            {/* Stats & attendees */}
            {selectedEventUid && (
                <>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : (
                        <>
                            {/* Stats bar */}
                            <div className="stats shadow w-full">
                                <div className="stat">
                                    <div className="stat-title">已簽到</div>
                                    <div className="stat-value text-success">{stats.checkedIn}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">總報名人數</div>
                                    <div className="stat-value">{stats.total}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">簽到率</div>
                                    <div className="stat-value text-primary">
                                        {stats.total > 0
                                            ? Math.round((stats.checkedIn / stats.total) * 100)
                                            : 0}
                                        %
                                    </div>
                                </div>
                            </div>

                            {/* Attendee grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {attendees.map((a) => (
                                    <div
                                        key={a.uid}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${a.isCheckedIn
                                                ? "bg-success/20 text-success-content border border-success"
                                                : "bg-base-200 text-base-content border border-base-300"
                                            }`}
                                    >
                                        {a.isCheckedIn ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-success shrink-0"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-gray-400 shrink-0"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                        <span className="truncate">{a.name}</span>
                                    </div>
                                ))}
                            </div>

                            {attendees.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    此活動尚無報名者
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
