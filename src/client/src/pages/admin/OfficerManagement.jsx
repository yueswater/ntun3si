import { useState } from "react";
import { create, remove, update } from "../../utils/api";
import useFetchList from "../../hooks/useFetchList";
import useSelection from "../../hooks/useSelection";
import ManagementLayout from "../../components/ManagementLayout";
import EditorModalShell from "../../components/EditorModalShell";
import AnimatedButton from "../../components/AnimatedButton";
import PreviewImageUploader from "../../components/PreviewImageUploader";
import { useToast } from "../../contexts/ToastContext";

export default function OfficerManagement() {
  const toast = useToast();
  const {
    data: officers,
    loading,
    setData: setOfficers,
  } = useFetchList("/officers");
  const { selected, open, close, isNew } = useSelection(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    title: "",
    image: "",
    bio: "",
  });

  const handleCreate = () => {
    open({ uid: "new" });
    setForm({
      name: "",
      title: "",
      image: "",
      bio: "",
    });
  };

  const handleEdit = (officer) => {
    open(officer);
    setForm({
      name: officer.name || "",
      title: officer.title || "",
      image: officer.image || "",
      bio: officer.bio || "",
    });
  };

  const handleDelete = async (officer) => {
    if (!window.confirm(`確定要刪除「${officer.name}」嗎？`)) return;
    try {
      await remove("/officers", officer.uid);
      setOfficers((prev) => prev.filter((o) => o.uid !== officer.uid));
    } catch {
      toast.error("刪除失敗，請稍後再試");
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.warning("請輸入姓名");
      return;
    }
    if (!form.title.trim()) {
      toast.warning("請輸入職稱");
      return;
    }

    if (isNew) {
      const created = await create("/officers", form);
      setOfficers((prev) => [...prev, created]);
      open(created);
      return;
    }

    const updated = await update("/officers", selected.uid, form);
    setOfficers((prev) =>
      prev.map((o) => (o.uid === selected.uid ? updated : o))
    );
    open(updated);
  };

  const lowerSearch = search.toLowerCase();
  const filtered = search
    ? officers.filter(
      (o) =>
        o.name?.toLowerCase().includes(lowerSearch) ||
        o.title?.toLowerCase().includes(lowerSearch) ||
        o.bio?.toLowerCase().includes(lowerSearch)
    )
    : officers;

  const tableColumns = ["#", "照片", "姓名", "職稱", "簡介", "操作"];

  const tableData = filtered.map((officer, i) => ({
    "#": i + 1,
    照片: officer.image ? (
      <img
        src={officer.image}
        alt={officer.name}
        className="w-12 h-12 rounded-full object-cover"
      />
    ) : (
      "無"
    ),
    姓名: officer.name,
    職稱: officer.title,
    簡介: officer.bio ? (
      <span className="block max-w-xs truncate">{officer.bio}</span>
    ) : (
      "-"
    ),
    操作: (
      <div className="flex gap-2">
        <AnimatedButton
          label="編輯"
          icon="faPen"
          variant="primary"
          onClick={() => handleEdit(officer)}
        />
        <AnimatedButton
          label="刪除"
          icon="faTrash"
          variant="danger"
          onClick={() => handleDelete(officer)}
        />
      </div>
    ),
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <>
      <ManagementLayout
        title="幹部管理"
        onCreate={handleCreate}
        buttonLabel="新增幹部"
        tableColumns={tableColumns}
        tableData={tableData}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋姓名、職稱、簡介…"
      />

      {selected && (
        <EditorModalShell
          title="幹部資訊編輯"
          onClose={close}
          onSave={handleSave}
          isNew={isNew}
        >
          <div className="p-6 space-y-4">
            <PreviewImageUploader
              value={form.image}
              onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
              type="officer"
              maxMB={5}
              hint="上傳幹部照片（建議 1:1，最大 5MB）"
            />

            <label className="form-control">
              <div className="label">
                <span className="label-text">姓名</span>
              </div>
              <input
                type="text"
                className="input input-bordered"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="請輸入幹部姓名"
              />
            </label>

            <label className="form-control">
              <div className="label">
                <span className="label-text">職稱</span>
              </div>
              <input
                type="text"
                className="input input-bordered"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="請輸入職稱"
              />
            </label>

            <label className="form-control">
              <div className="label">
                <span className="label-text">簡介</span>
              </div>
              <textarea
                className="textarea textarea-bordered !rounded-sm min-h-[140px]"
                value={form.bio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="請輸入幹部簡介"
              />
            </label>
          </div>
        </EditorModalShell>
      )}
    </>
  );
}
