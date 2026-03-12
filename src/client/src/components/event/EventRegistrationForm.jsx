import { useState, useEffect, useRef } from "react";
import { post } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import CountrySelect from "../../components/CountrySelect";
import { useTranslation } from "react-i18next";

// Auto-format phone number to 09xx-xxx-xxx
function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
}

export default function EventRegistrationForm({ event, form }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nationality: t("event.form.default_nationality"),
    affiliationType: "school",
    affiliation: "",
    department: "",
    jobTitle: "",
    customResponses: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [confirmationMsg, setConfirmationMsg] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const touchTimer = useRef(null);
  const touchDragging = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const [draggingState, setDraggingState] = useState({ fieldId: null, idx: null });
  const [overState, setOverState] = useState({ fieldId: null, idx: null });
  // Tracks whether each radio_with_other field has "其他" selected
  const [otherSelected, setOtherSelected] = useState({});
  const [ghost, setGhost] = useState({ visible: false, x: 0, y: 0, text: "", width: 200 });

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: formatPhone(user.phone || ""),
      }));
    }
  }, [user]);

  // Init custom fields
  useEffect(() => {
    if (form?.customFields) {
      setFormData((prev) => ({
        ...prev,
        customResponses: form.customFields.map((field) => ({
          fieldId: field.fieldId,
          label: field.label,
          value:
            field.type === "checkbox"
              ? []
              : field.type === "priority_ranking"
                ? [...(field.options || [])]
                : "",
        })),
      }));
    }
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formatted = name === "phone" ? formatPhone(value) : value;
    setFormData({ ...formData, [name]: formatted });
  };

  const handleNationalityChange = (value) => {
    setFormData((prev) => ({ ...prev, nationality: value }));
  };

  const handleCustomFieldChange = (fieldId, value) => {
    setFormData((prev) => ({
      ...prev,
      customResponses: prev.customResponses.map((resp) =>
        resp.fieldId === fieldId ? { ...resp, value } : resp
      ),
    }));
  };

  const handleCheckboxChange = (fieldId, option, checked) => {
    setFormData((prev) => ({
      ...prev,
      customResponses: prev.customResponses.map((resp) => {
        if (resp.fieldId !== fieldId) return resp;

        const newValues = checked
          ? [...resp.value, option]
          : resp.value.filter((v) => v !== option);

        return { ...resp, value: newValues };
      }),
    }));
  };

  // Priority ranking drag handlers (mouse/desktop)
  const handleDragStart = (fieldId, index) => {
    dragItem.current = index;
    setDraggingState({ fieldId, idx: index });
  };

  const handleDragEnter = (fieldId, index) => {
    dragOverItem.current = index;
    setOverState({ fieldId, idx: index });
  };

  const handleDragEnd = () => {
    setDraggingState({ fieldId: null, idx: null });
    setOverState({ fieldId: null, idx: null });
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDrop = (fieldId) => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from === null || to === null || from === to) {
      handleDragEnd();
      return;
    }
    setFormData((prev) => ({
      ...prev,
      customResponses: prev.customResponses.map((resp) => {
        if (resp.fieldId !== fieldId) return resp;
        const newOrder = [...resp.value];
        const [removed] = newOrder.splice(from, 1);
        newOrder.splice(to, 0, removed);
        return { ...resp, value: newOrder };
      }),
    }));
    handleDragEnd();
  };

  // Priority ranking touch handlers (mobile long-press drag with ghost)
  const handleTouchStart = (e, fieldId, index, optionText) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    dragItem.current = index;
    touchDragging.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    touchTimer.current = setTimeout(() => {
      touchDragging.current = true;
      setDraggingState({ fieldId, idx: index });
      if (navigator.vibrate) navigator.vibrate(50);
      setGhost({
        visible: true,
        x: touch.clientX - rect.width / 2,
        y: touch.clientY - 60,
        text: optionText,
        width: rect.width,
      });
    }, 350);
  };

  const handleTouchMove = (e, fieldId) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (!touchDragging.current) {
      if (dx > 8 || dy > 8) clearTimeout(touchTimer.current);
      return;
    }
    setGhost((prev) => ({
      ...prev,
      x: touch.clientX - prev.width / 2,
      y: touch.clientY - 60,
    }));
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const itemEl = el?.closest("[data-rank-index]");
    if (itemEl) {
      const idx = parseInt(itemEl.dataset.rankIndex, 10);
      const fid = itemEl.dataset.rankFieldId;
      if (!isNaN(idx) && fid === fieldId) {
        dragOverItem.current = idx;
        setOverState({ fieldId, idx });
      }
    }
  };

  const handleTouchEnd = (fieldId) => {
    clearTimeout(touchTimer.current);
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (touchDragging.current && from !== null && to !== null && from !== to) {
      setFormData((prev) => ({
        ...prev,
        customResponses: prev.customResponses.map((resp) => {
          if (resp.fieldId !== fieldId) return resp;
          const newOrder = [...resp.value];
          const [removed] = newOrder.splice(from, 1);
          newOrder.splice(to, 0, removed);
          return { ...resp, value: newOrder };
        }),
      }));
    }
    touchDragging.current = false;
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingState({ fieldId: null, idx: null });
    setOverState({ fieldId: null, idx: null });
    setGhost({ visible: false, x: 0, y: 0, text: "", width: 200 });
  };

  // Validation (i18n)
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError(t("event.error.name_required"));
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError(t("event.error.email_invalid"));
      return false;
    }
    if (!formData.phone.trim()) {
      setError(t("event.error.phone_required"));
      return false;
    }

    for (const field of form.customFields) {
      if (field.required) {
        const response = formData.customResponses.find(
          (r) => r.fieldId === field.fieldId
        );

        if (!response || !response.value || response.value.length === 0) {
          setError(t("event.error.custom_required", { field: field.label }));
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      // Submit registration
      const response = await post(
        `/registrations/event/${event.uid}`,
        formData
      );

      setConfirmationMsg(
        response.confirmationMessage || t("event.success.default")
      );
      setSuccess(true);

      const apiBase =
        import.meta.env.VITE_BASE_URL?.replace(/\/$/, "") ||
        "http://localhost:5050/api";

      // Send confirmation email
      await fetch(`${apiBase}/mail/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipients: [formData.email],
          subject: t("event.email.subject", { title: event.title }),
          content: t("event.email.content", {
            name: formData.name,
            title: event.title,
            date: new Date(event.date).toLocaleString("zh-TW"),
            location: event.location || t("event.email.location_tba"),
          }),
        }),
      });

      // Reset form
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        phone: "",
        nationality: t("event.form.default_nationality"),
        affiliationType: "school",
        affiliation: "",
        department: "",
        jobTitle: "",
        customResponses: form.customFields.map((field) => ({
          fieldId: field.fieldId,
          label: field.label,
          value:
            field.type === "checkbox"
              ? []
              : field.type === "priority_ranking"
                ? [...(field.options || [])]
                : "",
        })),
      });
    } catch (err) {
      setError(err.response?.data?.message || t("event.error.submit_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  // Success message card
  if (success) {
    return (
      <div className="card bg-success text-success-content">
        <div className="card-body">
          <h3 className="card-title">{t("event.success.title")}</h3>
          <p>{confirmationMsg}</p>
          <p className="text-sm mt-2">{t("event.success.check_email")}</p>

          <div className="card-actions justify-end mt-4">
            <button
              className="btn btn-ghost"
              onClick={() => (window.location.href = "/events")}
            >
              {t("event.action.back_to_events")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const deadline = form.registrationDeadline
    ? new Date(form.registrationDeadline)
    : null;
  const isClosed = deadline && new Date() > deadline;

  if (isClosed) {
    return (
      <div className="alert alert-warning">
        <span>{t("event.error.closed")}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Required Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              {t("event.form.name")} <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input input-bordered"
            required
          />
        </div>

        {/* Email */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              {t("event.form.email")} <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input input-bordered"
            required
          />
        </div>

        {/* Phone */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              {t("event.form.phone")} <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input input-bordered"
            placeholder="09xx-xxx-xxx"
            required
          />
        </div>

        {/* Nationality */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              {t("event.form.nationality")}{" "}
              <span className="text-error">*</span>
            </span>
          </label>
          <CountrySelect
            value={formData.nationality}
            onChange={handleNationalityChange}
            required
          />
        </div>
      </div>

      {/* Affiliation */}
      <div className="divider">{t("event.section.optional")}</div>
      <div className="space-y-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="affiliationType"
              value="school"
              checked={formData.affiliationType === "school"}
              onChange={handleChange}
              className="radio radio-primary"
            />
            <span>{t("event.form.school")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="affiliationType"
              value="organization"
              checked={formData.affiliationType === "organization"}
              onChange={handleChange}
              className="radio radio-primary"
            />
            <span>{t("event.form.organization")}</span>
          </label>
        </div>
        <div className="form-control">
          <input
            type="text"
            name="affiliation"
            value={formData.affiliation}
            onChange={handleChange}
            className="input input-bordered"
            placeholder={
              formData.affiliationType === "school"
                ? t("event.form.school_placeholder")
                : t("event.form.organization_placeholder")
            }
          />
        </div>

        {/* Department (only for school) */}
        {formData.affiliationType === "school" && (
          <div className="form-control">
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="input input-bordered"
              placeholder={t("event.form.department_placeholder")}
            />
          </div>
        )}

        {/* Job title (only for organization) */}
        {formData.affiliationType === "organization" && (
          <div className="form-control">
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              className="input input-bordered"
              placeholder={t("event.form.job_title_placeholder")}
            />
          </div>
        )}
      </div>

      {/* Custom Fields */}
      {form.customFields && form.customFields.length > 0 && (
        <>
          <div className="divider">{t("event.section.custom")}</div>
          <div className="space-y-4">
            {form.customFields.map((field) => {
              const response = formData.customResponses.find(
                (r) => r.fieldId === field.fieldId
              );
              return (
                <div key={field.fieldId} className="form-control">
                  <label className="label">
                    <span className="label-text">
                      {field.label}
                      {field.required && (
                        <span className="text-error ml-1">*</span>
                      )}
                    </span>
                  </label>

                  {/* Text */}
                  {field.type === "text" && (
                    <input
                      type="text"
                      value={response?.value || ""}
                      onChange={(e) =>
                        handleCustomFieldChange(field.fieldId, e.target.value)
                      }
                      className="input input-bordered"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}

                  {/* Textarea */}
                  {field.type === "textarea" && (
                    <textarea
                      value={response?.value || ""}
                      onChange={(e) =>
                        handleCustomFieldChange(field.fieldId, e.target.value)
                      }
                      className="textarea textarea-bordered"
                      rows={4}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}

                  {/* Select */}
                  {field.type === "select" && (
                    <select
                      value={response?.value || ""}
                      onChange={(e) =>
                        handleCustomFieldChange(field.fieldId, e.target.value)
                      }
                      className="select select-bordered"
                      required={field.required}
                    >
                      <option value="">
                        {t("event.form.select_placeholder")}
                      </option>
                      {field.options?.map((option, idx) => (
                        <option key={idx} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Radio */}
                  {field.type === "radio" && (
                    <div className="space-y-2">
                      {field.options?.map((option, idx) => (
                        <label key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={field.fieldId}
                            value={option}
                            checked={response?.value === option}
                            onChange={(e) =>
                              handleCustomFieldChange(
                                field.fieldId,
                                e.target.value
                              )
                            }
                            className="radio radio-primary"
                            required={field.required}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Radio with Other */}
                  {field.type === "radio_with_other" && (
                    <div className="space-y-2">
                      {field.options?.map((option, idx) => (
                        <label key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={field.fieldId}
                            value={option}
                            checked={response?.value === option}
                            onChange={() => {
                              setOtherSelected((prev) => ({ ...prev, [field.fieldId]: false }));
                              handleCustomFieldChange(field.fieldId, option);
                            }}
                            className="radio radio-primary"
                            required={field.required && !otherSelected[field.fieldId] && !response?.value}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                      {/* 其他 option */}
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={field.fieldId}
                          checked={!!otherSelected[field.fieldId]}
                          onChange={() => {
                            setOtherSelected((prev) => ({ ...prev, [field.fieldId]: true }));
                            handleCustomFieldChange(field.fieldId, "");
                          }}
                          className="radio radio-primary"
                        />
                        <span>其他</span>
                      </label>
                      {otherSelected[field.fieldId] && (
                        <input
                          type="text"
                          value={response?.value || ""}
                          onChange={(e) => handleCustomFieldChange(field.fieldId, e.target.value)}
                          className="input input-bordered input-sm w-full mt-1"
                          placeholder="請說明…"
                          autoFocus
                          required={field.required}
                        />
                      )}
                    </div>
                  )}

                  {/* Checkbox */}
                  {field.type === "checkbox" && (
                    <div className="space-y-2">
                      {field.options?.map((option, idx) => (
                        <label key={idx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={
                              Array.isArray(response?.value) &&
                              response.value.includes(option)
                            }
                            onChange={(e) =>
                              handleCheckboxChange(
                                field.fieldId,
                                option,
                                e.target.checked
                              )
                            }
                            className="checkbox checkbox-primary"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Priority Ranking */}
                  {field.type === "priority_ranking" && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 mb-1">
                        {t("event.form.drag_to_rank")}
                      </p>
                      {(Array.isArray(response?.value) && response.value.length > 0
                        ? response.value
                        : field.options || []
                      ).map((option, idx) => {
                        const currentOrder =
                          Array.isArray(response?.value) && response.value.length > 0
                            ? response.value
                            : field.options || [];
                        const isDragging =
                          draggingState.fieldId === field.fieldId &&
                          draggingState.idx === idx;
                        const isOver =
                          overState.fieldId === field.fieldId &&
                          overState.idx === idx &&
                          draggingState.fieldId === field.fieldId &&
                          draggingState.idx !== idx;
                        return (
                          <div
                            key={option}
                            data-rank-index={idx}
                            data-rank-field-id={field.fieldId}
                            draggable
                            onDragStart={() => handleDragStart(field.fieldId, idx)}
                            onDragEnter={() => handleDragEnter(field.fieldId, idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnd={handleDragEnd}
                            onDrop={() => handleDrop(field.fieldId)}
                            onTouchStart={(e) => handleTouchStart(e, field.fieldId, idx, option)}
                            onTouchMove={(e) => handleTouchMove(e, field.fieldId)}
                            onTouchEnd={() => handleTouchEnd(field.fieldId)}
                            style={{ touchAction: "none" }}
                            className={[
                              "flex items-center gap-3 px-3 py-2.5 rounded cursor-grab active:cursor-grabbing select-none transition-all duration-150",
                              isDragging
                                ? "opacity-30 scale-95 bg-base-300"
                                : isOver
                                  ? "border-2 border-primary bg-primary/10"
                                  : "bg-base-200",
                            ].join(" ")}
                          >
                            <span className="text-gray-400 text-lg leading-none">☰</span>
                            <span className="font-medium text-sm w-5 shrink-0">{idx + 1}.</span>
                            <span>{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Submit */}
      <div className="form-control mt-6">
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="loading loading-spinner"></span>
              {t("event.action.submitting")}
            </>
          ) : (
            t("event.action.submit")
          )}
        </button>
      </div>

      {/* Notice */}
      <div className="alert alert-warning text-sm mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <span>{t("event.form.registration_notice")}</span>
      </div>

      {/* Info */}
      <div className="text-sm text-gray-500 mt-4">
        <p>{t("event.form.required_hint")}</p>
        {deadline && (
          <p>
            {t("event.form.deadline")} {deadline.toLocaleString("zh-TW")}
          </p>
        )}
      </div>

      {/* Touch drag ghost — floats above finger while dragging */}
      {ghost.visible && (
        <div
          style={{
            position: "fixed",
            left: ghost.x,
            top: ghost.y,
            width: ghost.width,
            zIndex: 9999,
            pointerEvents: "none",
            transform: "rotate(-2deg) scale(1.06)",
          }}
          className="flex items-center gap-3 bg-base-100 border-2 border-primary px-3 py-2.5 rounded shadow-2xl"
        >
          <span className="text-primary text-lg leading-none">☰</span>
          <span className="font-medium text-sm">{ghost.text}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">
              {t("event.confirm_modal.title")}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-500">{t("event.form.name")}</p>
                  <p className="font-medium">{formData.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t("event.form.email")}</p>
                  <p className="font-medium">{formData.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t("event.form.phone")}</p>
                  <p className="font-medium">{formData.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t("event.form.nationality")}</p>
                  <p className="font-medium">{formData.nationality}</p>
                </div>
              </div>
              {formData.affiliation && (
                <div>
                  <p className="text-gray-500">
                    {formData.affiliationType === "school"
                      ? t("event.form.school")
                      : t("event.form.organization")}
                  </p>
                  <p className="font-medium">{formData.affiliation}</p>
                </div>
              )}
              {formData.customResponses.length > 0 && (
                <>
                  <div className="divider my-2"></div>
                  {formData.customResponses.map((resp) => (
                    <div key={resp.fieldId}>
                      <p className="text-gray-500">{resp.label}</p>
                      <p className="font-medium">
                        {Array.isArray(resp.value)
                          ? resp.value.join(" > ")
                          : resp.value || "-"}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="modal-action mt-6">
              <button
                className="btn btn-ghost"
                onClick={() => setShowConfirmModal(false)}
              >
                {t("event.confirm_modal.edit")}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmedSubmit}
              >
                {t("event.confirm_modal.submit")}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowConfirmModal(false)}
          />
        </dialog>
      )}
    </form>
  );
}
