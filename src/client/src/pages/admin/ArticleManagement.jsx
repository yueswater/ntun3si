import { useRef, useState, useMemo } from "react";
import { marked } from "marked";
import TitleSlugHeader from "../../components/TitleSlugHeader";
import PreviewImageUploader from "../../components/PreviewImageUploader";
import ArticleFormFields from "../../components/article/ArticleFormFields";
import HashtagEditor from "../../components/HashtagEditor";
import useFetchList from "../../hooks/useFetchList";
import useDebouncedSave from "../../hooks/useDebouncedSave";
import useSelection from "../../hooks/useSelection";
import useFileUpload from "../../hooks/useFileUpload";
import { create, update, remove } from "../../utils/api";
import { isValidSlug } from "../../utils/slugValidators";
import ManagementLayout from "../../components/ManagementLayout";
import EditorModalShell from "../../components/EditorModalShell";
import AnimatedButton from "../../components/AnimatedButton";
import TagList from "../../components/TagList";
import HelpButton from "../../components/HelpButton";

export default function ArticleManagement() {
  const {
    data: articles,
    loading,
    setData: setArticles,
  } = useFetchList("/articles");
  const {
    selected,
    open,
    close,
    update: updateSelected,
    isNew,
  } = useSelection(null);

  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const imageInputRef = useRef(null);

  const [content, setContent] = useState("");
  const [previewImg, setPreviewImg] = useState("");
  const [hashtags, setHashtags] = useState([]);

  const { upload } = useFileUpload({ type: "article", maxMB: 5 });
  const {
    queue: queueAutoSave,
    flush: flushSave,
    isPending,
  } = useDebouncedSave(async (payload) => {
    if (!selected || isNew) return;
    const html = marked.parse(payload.content_md ?? content);
    await update("/articles", selected.uid, {
      title: selected.title,
      slug: selected.slug,
      content_md: payload.content_md ?? content,
      content_html: html,
      previewImg: payload.previewImg ?? previewImg,
      hashtags,
    });
  }, 5000);

  const handleEdit = (article) => {
    open(article);
    setContent(article.content_md || "");
    setPreviewImg(article.previewImg || "");
    setHashtags(article.hashtags || []);
  };

  const handleCreate = () => {
    open({ uid: "new", title: "新文章", slug: "new-article-" + Date.now() });
    setContent("");
    setPreviewImg("");
    setHashtags([]);
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`確定要刪除「${article.title}」嗎？`)) return;
    try {
      await remove("/articles", article.uid);
      setArticles((prev) => prev.filter((a) => a.uid !== article.uid));
      alert("文章已刪除");
    } catch {
      alert("刪除失敗");
    }
  };

  const handleManualSave = async () => {
    if (!selected) return;
    const html = marked.parse(content);

    if (isNew) {
      if (!selected.title?.trim() || selected.title === "新文章") {
        alert("請輸入文章標題");
        return;
      }
      if (!isValidSlug(selected.slug)) {
        alert("請輸入 slug");
        return;
      }

      const created = await create("/articles", {
        title: selected.title,
        slug: selected.slug,
        content_md: content,
        content_html: html,
        previewImg,
        hashtags,
      });
      setArticles((list) => [created, ...list]);
      open(created);
      alert("文章創建成功!");
    } else {
      await update("/articles", selected.uid, {
        title: selected.title,
        slug: selected.slug,
        content_md: content,
        content_html: html,
        previewImg,
        hashtags,
      });
    }
  };

  const onContentChange = (next) => {
    setContent(next);
    if (!isNew) queueAutoSave({ content_md: next });
  };

  const tableColumns = [
    "#",
    "文章標題",
    "Slug",
    "標籤",
    "建立時間",
    "更新時間",
    "操作",
  ];

  const tableData = articles.map((a, i) => ({
    "#": i + 1,
    文章標題: a.title,
    Slug: a.slug,
    標籤: <TagList tags={a.hashtags} />,
    建立時間: new Date(a.createdAt).toLocaleDateString(),
    更新時間: new Date(a.updatedAt).toLocaleDateString(),
    操作: (
      <div className="flex gap-2">
        <AnimatedButton
          label="編輯"
          icon="faPen"
          variant="primary"
          onClick={() => handleEdit(a)}
        />
        <AnimatedButton
          label="刪除"
          icon="faTrash"
          variant="danger"
          onClick={() => handleDelete(a)}
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
        title="文章管理"
        onCreate={handleCreate}
        buttonLabel="新增文章"
        tableColumns={tableColumns}
        tableData={tableData}
      />

      {selected && (
        <EditorModalShell
          title="文章編輯"
          onClose={close}
          onSave={handleManualSave}
          flushSave={flushSave}
          isPending={isPending}
          isNew={isNew}
        >
          <div className="p-4 border-b border-base-300 space-y-3">
            <TitleSlugHeader
              mode={isNew ? "new" : "edit"}
              title={selected.title || ""}
              slug={selected.slug || ""}
              onTitle={(v) => updateSelected({ title: v })}
              onSlug={(v) => updateSelected({ slug: v })}
            />
            <PreviewImageUploader
              value={previewImg}
              onChange={setPreviewImg}
              type="article"
              maxMB={5}
              hint="此圖片會顯示在首頁文章列表中（建議尺寸：16:9，最大 5MB）"
            />
            <HashtagEditor hashtags={hashtags} setHashtags={setHashtags} />
          </div>

          <ArticleFormFields
            content={content}
            onContentChange={onContentChange}
            textareaRef={textareaRef}
            previewRef={previewRef}
          />

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
          />
        </EditorModalShell>
      )}

      <HelpButton
        title="文章管理使用說明"
        markdownPath="/help/article-management-help.md"
      />
    </>
  );
}
