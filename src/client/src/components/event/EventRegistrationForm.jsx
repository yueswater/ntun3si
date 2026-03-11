import { useState, useEffect, useRef } from "react";
import { post, get } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import CountrySelect from "../../components/CountrySelect";
import { useTranslation } from "react-i18next";

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
    customResponses: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [confirmationMsg, setConfirmationMsg] = useState("");
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const touchTimer = useRef(null);
  const touchDragging = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  // Fetch confirmed registration count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await get(`/registrations/event/${event.uid}/count`);
        setConfirmedCount(data.confirmedCount ?? 0);
      } catch {
        // ignore
      }
    };
    fetchCount();
  }, [event.uid]);

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  // Priority ranking drag handlers (mouse)
  const handleDragStart = (index) => {
    dragItem.current = index;
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDrop = (fieldId, currentOrder) => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;
    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(dragItem.current, 1);
    newOrder.splice(dragOverItem.current, 0, removed);
    dragItem.current = null;
    dragOverItem.current = null;
    handleCustomFieldChange(fieldId, newOrder);
  };

  // Priority ranking touch handlers (mobile long-press drag)
  const handleTouchStart = (e, index) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    dragItem.current = index;
    touchDragging.current = false;
    touchTimer.current = setTimeout(() => {
      touchDragging.current = true;
    }, 350);
  };

  const handleTouchMove = (e, fieldId, currentOrder) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    if (!touchDragging.current) {
      if (dx > 8 || dy > 8) clearTimeout(touchTimer.current);
      return;
    }
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const itemEl = el?.closest("[data-rank-index]");
    if (itemEl) {
      const idx = parseInt(itemEl.dataset.rankIndex, 10);
      if (!isNaN(idx)) dragOverItem.current = idx;
    }
  };

  const handleTouchEnd = (fieldId, currentOrder) => {
    clearTimeout(touchTimer.current);
    if (
      touchDragging.current &&
      dragItem.current !== null &&
      dragOverItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      const newOrder = [...currentOrder];
      const [removed] = newOrder.splice(dragItem.current, 1);
      newOrder.splice(dragOverItem.current, 0, removed);
      handleCustomFieldChange(fieldId, newOrder);
    }
    touchDragging.current = false;
    dragItem.current = null;
    dragOverItem.current = null;
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
            placeholder={t("event.form.phone_placeholder")}
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
                        return (
                          <div
                            key={option}
                            data-rank-index={idx}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={() => handleDrop(field.fieldId, currentOrder)}
                            onTouchStart={(e) => handleTouchStart(e, idx)}
                            onTouchMove={(e) => handleTouchMove(e, field.fieldId, currentOrder)}
                            onTouchEnd={() => handleTouchEnd(field.fieldId, currentOrder)}
                            style={{ touchAction: "none" }}
                            className="flex items-center gap-3 bg-base-200 px-3 py-2.5 rounded cursor-grab active:cursor-grabbing select-none"
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

      {/* Info */}
      <div className="text-sm text-gray-500 mt-4">
        <p>{t("event.form.required_hint")}</p>
        {deadline && (
          <p>
            {t("event.form.deadline")} {deadline.toLocaleString("zh-TW")}
          </p>
        )}
        {form.maxRegistrations && (
          <p>
            {t("event.form.confirmed_count", {
              confirmed: confirmedCount,
              max: form.maxRegistrations,
            })}
          </p>
        )}
      </div>

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
