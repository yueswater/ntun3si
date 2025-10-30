import { useState } from "react";
import TitleSlugHeader from "../../components/TitleSlugHeader";
import PreviewImageUploader from "../../components/PreviewImageUploader";
import EventFormFields from "../../components/event/EventFormFields";
import HashtagEditor from "../../components/HashtagEditor";
import useFetchList from "../../hooks/useFetchList";
import useDebouncedSave from "../../hooks/useDebouncedSave";
import useSelection from "../../hooks/useSelection";
import { create, update, remove } from "../../utils/api";
import { isValidSlug } from "../../utils/slugValidators";
import ManagementLayout from "../../components/ManagementLayout";
import EditorModalShell from "../../components/EditorModalShell";
import AnimatedButton from "../../components/AnimatedButton";
import TagList from "../../components/TagList";
import HelpButton from "../../components/HelpButton";

export default function EventManagement() {
  const { data: events, loading, setData: setEvents } = useFetchList("/events");
  const {
    selected,
    open,
    close,
    update: updateSelected,
    isNew,
  } = useSelection(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    maxParticipants: "",
    speaker: "",
    speakerBio: "",
    notes: "",
    hashtags: [],
  });
  const [previewImg, setPreviewImg] = useState("");

  const {
    queue: queueAutoSave,
    flush: flushSave,
    isPending,
  } = useDebouncedSave(async (payload) => {
    if (!selected || isNew) return;
    await update("/events", selected.uid, {
      ...payload.form,
      previewImg: payload.previewImg,
    });
  }, 5000);

  const handleEdit = (e) => {
    open(e);
    setForm({
      title: e.title || "",
      description: e.description || "",
      date: e.date ? new Date(e.date).toISOString().slice(0, 16) : "",
      location: e.location || "",
      maxParticipants: e.maxParticipants || "",
      speaker: e.speaker || "",
      speakerBio: e.speakerBio || "",
      notes: e.notes || "",
      hashtags: e.hashtags || [],
    });
    setPreviewImg(e.previewImg || "");
  };

  const handleCreate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(14, 0, 0, 0);
    open({ uid: "new", title: "新活動", slug: "new-event-" + Date.now() });
    setForm({
      title: "新活動",
      description: "",
      date: d.toISOString().slice(0, 16),
      location: "",
      maxParticipants: "",
      speaker: "",
      speakerBio: "",
      notes: "",
      hashtags: [],
    });
    setPreviewImg("");
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`確定要刪除「${event.title}」嗎？`)) return;
    try {
      await remove("/events", event.uid);
      setEvents((prev) => prev.filter((e) => e.uid !== event.uid));
      alert("活動已刪除");
    } catch {
      alert("刪除失敗");
    }
  };

  const handleManualSave = async () => {
    if (!selected) return;

    if (isNew) {
      if (!form.title?.trim() || form.title === "新活動") {
        alert("請輸入活動名稱");
        return;
      }
      if (!form.date) {
        alert("請選擇活動時間");
        return;
      }
      if (!isValidSlug(selected.slug)) {
        alert("請輸入 slug");
        return;
      }

      const created = await create("/events", {
        ...form,
        slug: selected.slug,
        previewImg,
        hashtags: form.hashtags.filter((t) => t.trim() !== ""),
      });
      setEvents((list) => [created, ...list]);
      open(created);
      alert("活動創建成功!");
    } else {
      await update("/events", selected.uid, { ...form, previewImg });
    }
  };

  const onFormChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    if (!isNew) queueAutoSave({ form: next, previewImg });
  };

  const setHashtags = (tags) => {
    const next = { ...form, hashtags: tags };
    setForm(next);
    if (!isNew) queueAutoSave({ form: next, previewImg });
  };

  const tableColumns = [
    "#",
    "活動名稱",
    "時間",
    "地點",
    "人數上限",
    "標籤",
    "建立時間",
    "操作",
  ];

  const tableData = events.map((e, i) => ({
    "#": i + 1,
    活動名稱: e.title,
    時間: e.date ? new Date(e.date).toLocaleString() : "未設定",
    地點: e.location,
    人數上限: e.maxParticipants,
    標籤: <TagList tags={e.hashtags} />,
    建立時間: new Date(e.createdAt).toLocaleDateString(),
    操作: (
      <div className="flex gap-2">
        <AnimatedButton
          label="編輯"
          icon="faPen"
          variant="primary"
          onClick={() => handleEdit(e)}
        />
        <AnimatedButton
          label="刪除"
          icon="faTrash"
          variant="danger"
          onClick={() => handleDelete(e)}
        />
      </div>
    ),
  }));

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  return (
    <>
      <ManagementLayout
        title="活動管理"
        onCreate={handleCreate}
        buttonLabel="新增活動"
        tableColumns={tableColumns}
        tableData={tableData}
      />

      {selected && (
        <EditorModalShell
          title="活動編輯"
          onClose={close}
          onSave={handleManualSave}
          flushSave={flushSave}
          isPending={isPending}
          isNew={isNew}
        >
          <div className="p-4 border-b border-base-300 space-y-3">
            <TitleSlugHeader
              mode={isNew ? "new" : "edit"}
              title={form.title}
              slug={selected.slug || ""}
              onTitle={(v) => {
                setForm((prev) => ({ ...prev, title: v }));
                updateSelected({ title: v });
              }}
              onSlug={(v) => updateSelected({ slug: v })}
            />
            <PreviewImageUploader
              value={previewImg}
              onChange={setPreviewImg}
              type="event"
              maxMB={5}
              hint="此圖片會顯示在首頁活動列表中（建議尺寸：4:3，最大 5MB）"
            />
          </div>

          <div className="p-6 space-y-6">
            <EventFormFields form={form} onChange={onFormChange} />
            <HashtagEditor hashtags={form.hashtags} setHashtags={setHashtags} />
          </div>
        </EditorModalShell>
      )}

      <HelpButton
        title="活動管理使用說明"
        markdownPath="/help/event-management-help.md"
      />
    </>
  );
}
