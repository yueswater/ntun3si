import { useState, useEffect, useRef, useCallback } from "react";
import { post, get } from "../../utils/api";
import axiosClient from "../../api/axiosClient";

const PAGE_SIZE = 10;

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
    const [stats, setStats] = useState({ total: 0, checkedIn: 0, checkedOut: 0 });
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pdfLoading, setPdfLoading] = useState(false);

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
            setStats({ total: data.total, checkedIn: data.checkedIn, checkedOut: data.checkedOut || 0 });
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
    const totalPages = Math.max(1, Math.ceil(attendees.length / PAGE_SIZE));
    const paginatedAttendees = attendees.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handleExportPDF = async () => {
        if (!selectedEventUid || !verifiedPassword.current) return;
        setPdfLoading(true);
        try {
            const res = await axiosClient.get(
                `/checkin/event/${selectedEventUid}/signin-pdf`,
                {
                    headers: { "x-dashboard-password": verifiedPassword.current },
                    responseType: "blob",
                }
            );
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = "signin-sheet.pdf";
            link.click();
            window.URL.revokeObjectURL(url);
        } catch {
            alert("PDF 產生失敗，請稍後再試");
        } finally {
            setPdfLoading(false);
        }
    };

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
                        setStats({ total: 0, checkedIn: 0, checkedOut: 0 });
                        setCurrentPage(1);
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
                                    <div className="stat-title">已簽退</div>
                                    <div className="stat-value text-warning">{stats.checkedOut}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">已確認報名人數</div>
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

                            {/* PDF Export button */}
                            <div className="flex justify-end">
                                <button
                                    className="btn btn-outline btn-sm gap-2"
                                    onClick={handleExportPDF}
                                    disabled={pdfLoading || attendees.length === 0}
                                >
                                    {pdfLoading ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            產生中...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            匯出簽到表 PDF
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Attendee table */}
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr>
                                            <th className="w-16">編號</th>
                                            <th>姓名</th>
                                            <th>電子郵件</th>
                                            <th>電話</th>
                                            <th className="w-28 text-center">簽到</th>
                                            <th className="w-28 text-center">簽退</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedAttendees.map((a, idx) => (
                                            <tr key={a.uid}>
                                                <td>{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                                <td>{a.name}</td>
                                                <td className="text-sm">{a.email}</td>
                                                <td className="text-sm">{a.phone}</td>
                                                <td className="text-center">
                                                    {a.isCheckedIn ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success mx-auto" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : null}
                                                </td>
                                                <td className="text-center">
                                                    {a.isCheckedOut ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning mx-auto" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {attendees.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    此活動尚無已確認的報名者
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center">
                                    <div className="join">
                                        <button
                                            className="join-item btn btn-sm"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage((p) => p - 1)}
                                        >
                                            «
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                className={`join-item btn btn-sm ${currentPage === page ? "btn-active" : ""}`}
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            className="join-item btn btn-sm"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage((p) => p + 1)}
                                        >
                                            »
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
