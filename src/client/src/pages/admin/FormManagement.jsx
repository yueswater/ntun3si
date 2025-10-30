import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFetchList from "../../hooks/useFetchList";
import { create, update, remove } from "../../utils/api";
import ManagementLayout from "../../components/ManagementLayout";
import EditorModalShell from "../../components/EditorModalShell";
import AnimatedButton from "../../components/AnimatedButton";
import AppAlert from "../../components/AppAlert";
import FormBuilder from "../../components/event/FormBuilder";
import HelpButton from "../../components/HelpButton";

/**
 * Form Management - Admin interface for managing registration forms
 */
export default function FormManagement() {
  const { data: forms, loading, setData: setForms } = useFetchList("/forms");
  const { data: events } = useFetchList("/events");
  const navigate = useNavigate();

  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventUid, setSelectedEventUid] = useState("");
  const [formConfig, setFormConfig] = useState({
    customFields: [],
    maxRegistrations: "",
    registrationDeadline: "",
    confirmationMessage: "感謝您的報名，我們會盡快與您聯繫。",
  });
  const [alert, setAlert] = useState({ type: "", message: "" });

  // Handle Create
  const handleCreate = () => {
    setSelected(null);
    setSelectedEventUid("");
    setFormConfig({
      customFields: [],
      maxRegistrations: "",
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
      registrationDeadline: form.registrationDeadline
        ? new Date(form.registrationDeadline).toISOString().slice(0, 16)
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
      setAlert({ type: "warning", message: "請選擇活動" });
      return;
    }

    try {
      const payload = {
        eventUid: selectedEventUid,
        ...formConfig,
      };

      if (selected) {
        const updated = await update("/forms", selected.uid, payload);
        setForms((list) =>
          list.map((f) => (f.uid === selected.uid ? updated : f))
        );
        setAlert({ type: "success", message: "表單更新成功！" });
      } else {
        const created = await create("/forms", payload);
        setForms((list) => [created, ...list]);
        setAlert({ type: "success", message: "表單建立成功！" });
      }

      handleClose();
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.message || "操作失敗",
      });
    }
  };

  // Delete form
  const handleDelete = async (uid) => {
    if (!window.confirm("確定要刪除此表單？此操作無法復原。")) return;

    try {
      await remove("/forms", uid);
      setForms((list) => list.filter((f) => f.uid !== uid));
      setAlert({ type: "success", message: "表單已刪除" });
    } catch {
      setAlert({ type: "error", message: "刪除失敗" });
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
    "報名狀況",
    "允許報名",
    "建立時間",
    "操作",
  ];

  // Table data
  const tableData = forms.map((f, i) => ({
    "#": i + 1,
    活動名稱: getEventTitle(f.eventUid),
    自訂欄位數: f.customFields?.length || 0,
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
          } catch {
            alert("更新狀態失敗");
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

      {/* Alert */}
      {alert.message && (
        <AppAlert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <HelpButton
        title="報名表單管理使用說明"
        markdownPath="/help/form-management-help.md"
      />
    </>
  );
}
