import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useFetchList from "../../hooks/useFetchList";
import { create, update, remove, get } from "../../utils/api";
import ManagementLayout from "../../components/ManagementLayout";
import EditorModalShell from "../../components/EditorModalShell";
import AnimatedButton from "../../components/AnimatedButton";
import { useToast } from "../../contexts/ToastContext";
import { useTranslation } from "react-i18next";
import FormBuilder from "../../components/event/FormBuilder";
import HelpButton from "../../components/HelpButton";

/** "YYYY-MM-DDTHH:mm" in local timezone — for <input type="datetime-local"> */
const toLocalDatetime = (d) => {
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

/**
 * Form Management - Admin interface for managing registration forms
 */
export default function FormManagement() {
  const toast = useToast();
  const { t } = useTranslation();
  const { data: forms, loading, setData: setForms, refresh } = useFetchList("/forms");
  const { data: events } = useFetchList("/events");
  const [counts, setCounts] = useState({});

  // Fetch confirmed registration counts for all forms
  useEffect(() => {
    if (!forms || forms.length === 0) return;
    const fetchCounts = async () => {
      const entries = await Promise.all(
        forms.map(async (f) => {
          try {
            const data = await get(`/registrations/event/${f.eventUid}/count`);
            return [f.eventUid, data.confirmedCount ?? 0];
          } catch {
            return [f.eventUid, 0];
          }
        })
      );
      setCounts(Object.fromEntries(entries));
    };
    fetchCounts();
  }, [forms]);
  const navigate = useNavigate();

  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventUid, setSelectedEventUid] = useState("");
  const [formConfig, setFormConfig] = useState({
    customFields: [],
    maxRegistrations: "",
    registrationStartDate: "",
    registrationDeadline: "",
    confirmationMessage: "感謝您的報名，我們會盡快與您聯繫。",
  });
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");

  // Handle Create
  const handleCreate = () => {
    setSelected(null);
    setSelectedEventUid("");
    setFormConfig({
      customFields: [],
      maxRegistrations: "",
      registrationStartDate: "",
      registrationDeadline: "",
      confirmationMessage: "感謝您的報名，我們會盡快與您聯繫。",
    });
    setIsModalOpen(true);
  };

  // Handle Edit
  const handleEdit = (form) => {
    setSelected(form);
    setSelectedEventUid(form.eventUid);
    setFormConfig({
      customFields: form.customFields || [],
      maxRegistrations: form.maxRegistrations || "",
      registrationStartDate: form.registrationStartDate
        ? toLocalDatetime(form.registrationStartDate)
        : "",
      registrationDeadline: form.registrationDeadline
        ? toLocalDatetime(form.registrationDeadline)
        : "",
      confirmationMessage:
        form.confirmationMessage || "感謝您的報名，我們會盡快與您聯繫。",
    });
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelected(null);
    setSelectedEventUid("");
  };

  // Save form
  const handleSave = async () => {
    if (!selectedEventUid) {
      toast.error("請選擇活動");
      return;
    }

    try {
      const payload = {
        eventUid: selectedEventUid,
        ...formConfig,
        maxRegistrations: formConfig.maxRegistrations === "" ? null : Number(formConfig.maxRegistrations),
        registrationStartDate: formConfig.registrationStartDate
          ? new Date(formConfig.registrationStartDate).toISOString()
          : null,
        registrationDeadline: formConfig.registrationDeadline
          ? new Date(formConfig.registrationDeadline).toISOString()
          : null,
      };

      if (selected) {
        await update("/forms", selected.uid, payload);
        toast.success("表單更新成功！");
      } else {
        await create("/forms", payload);
        toast.success("表單建立成功！");
      }

      handleClose();
      await refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "操作失敗");
    }
  };

  // Delete form
  const handleDelete = async (uid) => {
    if (!window.confirm("確定要刪除此表單？此操作無法復原。")) return;

    try {
      await remove("/forms", uid);
      setForms((list) => list.filter((f) => f.uid !== uid));
      toast.success("表單已刪除");
    } catch {
      toast.error("刪除失敗");
    }
  };

  // Navigate to registration list page
  const handleViewRegistrations = (form) => {
    navigate(`/admin/registrations/${form.eventUid}`);
  };

  // Get event title by uid
  const getEventTitle = (eventUid) => {
    const event = events.find((e) => e.uid === eventUid);
    return event ? event.title : "未知活動";
  };

  // Available events for selection
  const availableEvents = events.filter(
    (event) =>
      !forms.find((form) => form.eventUid === event.uid) ||
      (selected && selected.eventUid === event.uid)
  );

  // Table columns
  const tableColumns = [
    "#",
    "活動名稱",
    "自訂欄位數",
    "已確認報名",
    "報名狀況",
    "允許報名",
    "建立時間",
    "操作",
  ];

  // Table data
  const lowerSearch = search.toLowerCase();
  const filtered = forms.filter((f) => {
    if (filterActive === "active" && !f.isActive) return false;
    if (filterActive === "inactive" && f.isActive) return false;
    if (search && !getEventTitle(f.eventUid).toLowerCase().includes(lowerSearch))
      return false;
    return true;
  });

  const tableData = filtered.map((f, i) => ({
    "#": i + 1,
    活動名稱: getEventTitle(f.eventUid),
    自訂欄位數: f.customFields?.length || 0,
    已確認報名: (() => {
      const confirmed = counts[f.eventUid] ?? "—";
      const max = f.maxRegistrations;
      return max ? `${confirmed} / ${max}` : String(confirmed);
    })(),
    報名狀況: (
      <AnimatedButton
        label="查看報名"
        icon="faEye"
        variant="secondary"
        onClick={() => handleViewRegistrations(f)}
      />
    ),
    允許報名: (
      <input
        type="checkbox"
        className="toggle toggle-success"
        checked={f.isActive}
        onChange={async (e) => {
          const newStatus = e.target.checked;
          try {
            await update("/forms", f.uid, { isActive: newStatus });
            setForms((list) =>
              list.map((item) =>
                item.uid === f.uid ? { ...item, isActive: newStatus } : item
              )
            );
            toast.success(t("toast.status_updated"));
          } catch {
            toast.error(t("toast.status_update_failed"));
          }
        }}
      />
    ),
    建立時間: new Date(f.createdAt).toLocaleDateString(),
    操作: (
      <div className="flex gap-2">
        <AnimatedButton
          label="編輯"
          icon="faPen"
          variant="primary"
          onClick={() => handleEdit(f)}
        />
        <AnimatedButton
          label="刪除"
          icon="faTrash"
          variant="danger"
          onClick={() => handleDelete(f.uid)}
        />
      </div>
    ),
  }));

  // Loading spinner
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  return (
    <>
      <ManagementLayout
        title="報名表單管理"
        onCreate={handleCreate}
        buttonLabel="新增表單"
        tableColumns={tableColumns}
        tableData={tableData}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋活動名稱…"
        filterNode={
          <select
            className="select select-bordered select-sm"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
          >
            <option value="">全部狀態</option>
            <option value="active">允許報名</option>
            <option value="inactive">已關閉</option>
          </select>
        }
      />

      {/* Modal */}
      {isModalOpen && (
        <EditorModalShell
          title={selected ? "編輯報名表單" : "新增報名表單"}
          onClose={handleClose}
          onSave={handleSave}
          isNew={!selected}
        >
          <div className="p-6 space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">選擇活動 *</span>
              </label>
              <select
                value={selectedEventUid}
                onChange={(e) => setSelectedEventUid(e.target.value)}
                className="select select-bordered"
                disabled={!!selected}
              >
                <option value="">請選擇活動...</option>
                {availableEvents.map((event) => (
                  <option key={event.uid} value={event.uid}>
                    {event.title}
                  </option>
                ))}
              </select>
              {selected && (
                <label className="label">
                  <span className="label-text-alt text-info">
                    無法變更已建立表單的活動
                  </span>
                </label>
              )}
            </div>

            {/* Form Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">報名開始時間</span>
                </label>
                <input
                  type="datetime-local"
                  value={formConfig.registrationStartDate}
                  onChange={(e) =>
                    setFormConfig((prev) => ({
                      ...prev,
                      registrationStartDate: e.target.value,
                    }))
                  }
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">報名截止時間</span>
                </label>
                <input
                  type="datetime-local"
                  value={formConfig.registrationDeadline}
                  onChange={(e) =>
                    setFormConfig((prev) => ({
                      ...prev,
                      registrationDeadline: e.target.value,
                    }))
                  }
                  className="input input-bordered"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">報名人數上限</span>
                </label>
                <input
                  type="number"
                  value={formConfig.maxRegistrations}
                  onChange={(e) =>
                    setFormConfig((prev) => ({
                      ...prev,
                      maxRegistrations: e.target.value,
                    }))
                  }
                  className="input input-bordered"
                  placeholder="不限制則留空"
                />
              </div>
            </div>

            {/* Confirmation Message */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">報名成功訊息</span>
              </label>
              <textarea
                value={formConfig.confirmationMessage}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    confirmationMessage: e.target.value,
                  }))
                }
                className="textarea textarea-bordered rounded-2xl"
                rows={3}
              />
            </div>

            <div className="divider">自訂欄位</div>
            <FormBuilder
              fields={formConfig.customFields}
              onChange={(fields) =>
                setFormConfig((prev) => ({ ...prev, customFields: fields }))
              }
            />
          </div>
        </EditorModalShell>
      )}

      <HelpButton
        title="報名表單管理使用說明"
        markdownPath="/help/form-management-help.md"
      />
    </>
  );
}
