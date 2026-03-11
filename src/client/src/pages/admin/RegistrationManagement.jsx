import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get, patch, del } from "../../utils/api";
import DataTable from "../../components/DataTable";
import AnimatedButton from "../../components/AnimatedButton";
import { useToast } from "../../contexts/ToastContext";
import { useTranslation } from "react-i18next";
import HelpButton from "../../components/HelpButton";

/**
 * Registration Management - Admin view for event registrations
 */
export default function RegistrationManagement() {
  const { eventUid } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const [registrations, setRegistrations] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchData();
  }, [eventUid]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const eventData = await get(`/events/${eventUid}`);
      setEvent(eventData);
      const regsData = await get(`/registrations/event/${eventUid}/list`);
      setRegistrations(regsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("無法載入報名資料");
    } finally {
      setLoading(false);
    }
  };

  // Update registration status
  const handleStatusChange = async (uid, newStatus) => {
    try {
      await patch(`/registrations/${uid}/status`, { status: newStatus });
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.uid === uid ? { ...reg, status: newStatus } : reg
        )
      );
      toast.success(t("toast.status_updated"));
    } catch {
      toast.error(t("toast.status_update_failed"));
    }
  };

  // Delete registration
  const handleDelete = async (uid) => {
    if (!window.confirm("確定要刪除此報名？")) return;

    try {
      await del(`/registrations/${uid}`);
      setRegistrations((prev) => prev.filter((reg) => reg.uid !== uid));
      toast.success("報名資料已刪除");
    } catch {
      toast.error("刪除失敗");
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    const API = import.meta.env.VITE_BASE_URL
      ? import.meta.env.VITE_BASE_URL.replace("/api", "")
      : "http://localhost:5050";

    console.log(`API: ${API}`);

    try {
      const response = await fetch(
        `${API}/api/registrations/event/${eventUid}/export`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("下載失敗");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.title}-registrations.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error(t("toast.export_failed"));
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
        <AnimatedButton
          label="返回表單管理"
          icon="faArrowLeft"
          variant="primary"
          onClick={() => navigate("/admin/dashboard", { replace: true })}
        />
      </div>
    );
  }

  // Table columns
  const tableColumns = [
    "#",
    "報名時間",
    "姓名",
    "Email",
    "電話",
    "國籍",
    "所屬單位",
    "接受報名",
    "操作",
  ];

  const lowerSearch = search.toLowerCase();
  const filteredRegs = registrations.filter((reg) => {
    if (filterStatus && reg.status !== filterStatus) return false;
    if (
      search &&
      !reg.name?.toLowerCase().includes(lowerSearch) &&
      !reg.email?.toLowerCase().includes(lowerSearch) &&
      !reg.phone?.toLowerCase().includes(lowerSearch) &&
      !reg.affiliation?.toLowerCase().includes(lowerSearch)
    )
      return false;
    return true;
  });

  const tableData = filteredRegs.map((reg, i) => ({
    "#": i + 1,
    報名時間: new Date(reg.submittedAt).toLocaleString("zh-TW"),
    姓名: reg.name,
    Email: reg.email,
    電話: reg.phone,
    國籍: reg.nationality,
    所屬單位: reg.affiliation || "-",
    接受報名: (
      <select
        value={reg.status}
        onChange={(e) => handleStatusChange(reg.uid, e.target.value)}
        className="select select-bordered select-sm"
      >
        <option value="pending">待確認</option>
        <option value="confirmed">已確認</option>
        <option value="cancelled">已取消</option>
      </select>
    ),
    操作: (
      <div className="flex gap-2">
        <AnimatedButton
          icon="faEye"
          variant="secondary"
          size="sm"
          onClick={() => {
            const modal = document.getElementById("detail_modal");
            modal.dataset.registration = JSON.stringify(reg);
            modal.showModal();
          }}
        />
        <AnimatedButton
          icon="faTrash"
          variant="danger"
          size="sm"
          onClick={() => handleDelete(reg.uid)}
        />
      </div>
    ),
  }));

  return (
    <div className="p-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <AnimatedButton
            label="返回表單管理"
            icon="faArrowLeft"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/dashboard", { replace: true })}
          />
          <h1 className="text-3xl font-bold mt-2">
            {event?.title || "活動"} - 報名管理
          </h1>
          <p className="text-gray-500 mt-2">共 {registrations.length} 筆報名</p>
        </div>
        <AnimatedButton
          label="匯出 CSV"
          icon="faFileExport"
          variant="primary"
          onClick={handleExportCSV}
        />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          className="input input-bordered input-sm w-full max-w-xs"
          placeholder="搜尋姓名、Email、電話、學校…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select select-bordered select-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">全部狀態</option>
          <option value="pending">待確認</option>
          <option value="confirmed">已確認</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">待確認</div>
          <div className="stat-value text-warning">
            {registrations.filter((r) => r.status === "pending").length}
          </div>
        </div>
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">已確認</div>
          <div className="stat-value text-success">
            {registrations.filter((r) => r.status === "confirmed").length}
          </div>
        </div>
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">已取消</div>
          <div className="stat-value text-error">
            {registrations.filter((r) => r.status === "cancelled").length}
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable columns={tableColumns} data={tableData} />

      {/* Detail Modal */}
      <dialog id="detail_modal" className="modal">
        <div className="modal-box max-w-2xl">
          <form method="dialog">
            <AnimatedButton
              icon="faXmark"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
            />
          </form>
          <h3 className="font-bold text-lg mb-4">報名詳情</h3>
          <div className="space-y-3">
            {(() => {
              const reg = JSON.parse(
                document.getElementById("detail_modal")?.dataset.registration ||
                "{}"
              );
              return (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500">姓名</p>
                      <p className="font-medium">{reg.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{reg.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">電話</p>
                      <p className="font-medium">{reg.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">國籍</p>
                      <p className="font-medium">{reg.nationality}</p>
                    </div>
                    {reg.affiliation && (
                      <div>
                        <p className="text-sm text-gray-500">
                          {reg.affiliationType === "school" ? "學校" : "任職單位"}
                        </p>
                        <p className="font-medium">{reg.affiliation}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">報名時間</p>
                      <p className="font-medium">
                        {new Date(reg.submittedAt).toLocaleString("zh-TW")}
                      </p>
                    </div>
                  </div>

                  {reg.customResponses && reg.customResponses.length > 0 && (
                    <div className="divider">自訂欄位回答</div>
                  )}

                  {reg.customResponses?.map((resp, idx) => (
                    <div key={idx}>
                      <p className="text-sm text-gray-500">{resp.label}</p>
                      <p className="font-medium">
                        {Array.isArray(resp.value)
                          ? resp.value.join(", ")
                          : resp.value}
                      </p>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <HelpButton
        title="報名管理使用說明"
        markdownPath="/help/registration-management-help.md"
      />
    </div>
  );
}
