import { useRef, useState, useMemo } from "react";
import { marked } from "marked";
import ArticleFormFields from "../../components/article/ArticleFormFields";
import useFetchList from "../../hooks/useFetchList";
import useDebouncedSave from "../../hooks/useDebouncedSave";
import useSelection from "../../hooks/useSelection";
import { create, update, remove } from "../../utils/api";
import { useToast } from "../../contexts/ToastContext";
import { useTranslation } from "react-i18next";
import ManagementLayout from "../../components/ManagementLayout";
import EditorModalShell from "../../components/EditorModalShell";
import AnimatedButton from "../../components/AnimatedButton";
import axiosClient from "../../api/axiosClient";

const STATUS_OPTIONS = [
    { value: "submitted", labelKey: "cr.status_submitted", color: "badge-info" },
    {
        value: "in_progress",
        labelKey: "cr.status_in_progress",
        color: "badge-warning",
    },
    {
        value: "completed",
        labelKey: "cr.status_completed",
        color: "badge-success",
    },
];

export default function ChangeRequestManagement() {
    const toast = useToast();
    const { t } = useTranslation();
    const {
        data: requests,
        loading,
        setData: setRequests,
    } = useFetchList("/change-requests");
    const {
        selected,
        open,
        close,
        update: updateSelected,
        isNew,
    } = useSelection(null);

    const previewRef = useRef(null);
    const [content, setContent] = useState("");
    const [status, setStatus] = useState("submitted");
    const [pdfLoading, setPdfLoading] = useState(null); // uid of the item currently generating PDF
    const [saving, setSaving] = useState(false);

    const {
        queue: queueAutoSave,
        flush: flushSave,
        isPending,
    } = useDebouncedSave(async (payload) => {
        if (!selected || isNew) return;
        const html = marked.parse(payload.content_md ?? content);
        await update("/change-requests", selected.uid, {
            title: selected.title,
            content_md: payload.content_md ?? content,
            content_html: html,
            status,
        });
    }, 5000);

    const handleEdit = (cr) => {
        open(cr);
        setContent(cr.content_md || "");
        setStatus(cr.status || "submitted");
    };

    const handleCreate = () => {
        open({ uid: "new", title: "" });
        setContent("");
        setStatus("submitted");
    };

    const handleDelete = async (cr) => {
        if (!window.confirm(t("cr.confirm_delete", { title: cr.title }))) return;
        try {
            await remove("/change-requests", cr.uid);
            setRequests((prev) => prev.filter((r) => r.uid !== cr.uid));
            toast.success(t("toast.cr_deleted"));
        } catch {
            toast.error(t("toast.delete_failed"));
        }
    };

    const handleManualSave = async () => {
        if (!selected || saving) return;
        const html = marked.parse(content);
        setSaving(true);

        try {
            if (isNew) {
                if (!selected.title?.trim()) {
                    toast.warning(t("toast.cr_title_required"));
                    return;
                }
                if (!content.trim()) {
                    toast.warning(t("toast.cr_content_required"));
                    return;
                }

                const created = await create("/change-requests", {
                    title: selected.title,
                    content_md: content,
                    content_html: html,
                });
                setRequests((list) => [created, ...list]);
                open(created);
                toast.success(t("toast.cr_created"));
            } else {
                await update("/change-requests", selected.uid, {
                    title: selected.title,
                    content_md: content,
                    content_html: html,
                    status,
                });
                toast.success(t("toast.cr_saved"));
            }
        } catch (err) {
            toast.error(t("toast.save_failed"));
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (cr, newStatus) => {
        try {
            const updated = await update("/change-requests", cr.uid, {
                status: newStatus,
            });
            setRequests((prev) =>
                prev.map((r) => (r.uid === cr.uid ? { ...r, ...updated } : r))
            );
            toast.success(t("toast.cr_status_updated"));
        } catch {
            toast.error(t("toast.status_update_failed"));
        }
    };

    const handleDownloadPDF = async (cr) => {
        setPdfLoading(cr.uid);
        try {
            const res = await axiosClient.get(`/change-requests/${cr.uid}/pdf`, {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `修改需求_${cr.title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error(t("toast.pdf_download_failed"));
        } finally {
            setPdfLoading(null);
        }
    };

    const onContentChange = (next) => {
        setContent(next);
        if (!isNew) queueAutoSave({ content_md: next });
    };

    const getStatusBadge = (s) => {
        const opt = STATUS_OPTIONS.find((o) => o.value === s);
        return opt ? (
            <span className={`badge ${opt.color}`}>{t(opt.labelKey)}</span>
        ) : (
            s
        );
    };

    const tableColumns = [
        "#",
        t("cr.col_title"),
        t("cr.col_submitter"),
        t("cr.col_status"),
        t("cr.col_created"),
        t("cr.col_updated"),
        t("cr.col_actions"),
    ];

    const tableData = requests.map((cr, i) => ({
        "#": i + 1,
        [t("cr.col_title")]: cr.title,
        [t("cr.col_submitter")]: cr.submittedBy?.name || "-",
        [t("cr.col_status")]: (
            <select
                className="select select-sm select-bordered"
                value={cr.status}
                onChange={(e) => handleStatusChange(cr, e.target.value)}
            >
                {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                    </option>
                ))}
            </select>
        ),
        [t("cr.col_created")]: new Date(cr.createdAt).toLocaleString("zh-TW"),
        [t("cr.col_updated")]: new Date(cr.updatedAt).toLocaleString("zh-TW"),
        [t("cr.col_actions")]: (
            <div className="flex gap-2">
                <AnimatedButton
                    label={t("cr.edit")}
                    icon="faPen"
                    variant="primary"
                    onClick={() => handleEdit(cr)}
                />
                {pdfLoading === cr.uid ? (
                    <button
                        className="relative flex items-center justify-center gap-x-1 px-3 py-1.5 rounded-full font-medium border whitespace-nowrap text-white bg-[#03045E] border-[#03045E] opacity-70 cursor-not-allowed"
                        disabled
                    >
                        <span className="loading loading-spinner loading-xs" />
                        <span className="hidden sm:inline">{t("cr.pdf_generating")}</span>
                    </button>
                ) : (
                    <AnimatedButton
                        label="PDF"
                        icon="faFilePdf"
                        variant="ghost"
                        onClick={() => handleDownloadPDF(cr)}
                    />
                )}
                <AnimatedButton
                    label={t("cr.delete")}
                    icon="faTrash"
                    variant="danger"
                    onClick={() => handleDelete(cr)}
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
                title={t("cr.page_title")}
                onCreate={handleCreate}
                buttonLabel={t("cr.create")}
                tableColumns={tableColumns}
                tableData={tableData}
            />

            {selected && (
                <EditorModalShell
                    title={t("cr.editor_title")}
                    onClose={close}
                    onSave={handleManualSave}
                    flushSave={flushSave}
                    isPending={isPending}
                    isNew={isNew}
                    saveLabel={isNew ? t("cr.submit") : t("cr.save_changes")}
                    saving={saving}
                >
                    <div className="p-4 border-b border-base-300 space-y-3">
                        {/* Title input */}
                        <div>
                            <label className="label">
                                <span className="label-text font-semibold">
                                    {t("cr.field_title")}
                                </span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                placeholder={t("cr.title_placeholder")}
                                value={selected.title || ""}
                                onChange={(e) => updateSelected({ title: e.target.value })}
                            />
                        </div>

                        {/* Status selector (only for existing items) */}
                        {!isNew && (
                            <div>
                                <label className="label">
                                    <span className="label-text font-semibold">
                                        {t("cr.field_status")}
                                    </span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    {STATUS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {t(opt.labelKey)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Markdown editor - reuse ArticleFormFields */}
                    <ArticleFormFields
                        content={content}
                        onContentChange={onContentChange}
                        previewRef={previewRef}
                    />
                </EditorModalShell>
            )}
        </>
    );
}
