import { useState, useEffect } from "react";
import { post } from "../../utils/api";
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
    school: "",
    department: "",
    studentId: "",
    customResponses: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [confirmationMsg, setConfirmationMsg] = useState("");

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

  // Init custom fields
  useEffect(() => {
    if (form?.customFields) {
      setFormData((prev) => ({
        ...prev,
        customResponses: form.customFields.map((field) => ({
          fieldId: field.fieldId,
          label: field.label,
          value: field.type === "checkbox" ? [] : "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

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
        school: "",
        department: "",
        studentId: "",
        customResponses: form.customFields.map((field) => ({
          fieldId: field.fieldId,
          label: field.label,
          value: field.type === "checkbox" ? [] : "",
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

      {/* Optional Fields */}
      <div className="divider">{t("event.section.optional")}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">{t("event.form.school")}</span>
          </label>
          <input
            type="text"
            name="school"
            value={formData.school}
            onChange={handleChange}
            className="input input-bordered"
            placeholder={t("event.form.school_placeholder")}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t("event.form.department")}</span>
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="input input-bordered"
            placeholder={t("event.form.department_placeholder")}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t("event.form.studentId")}</span>
          </label>
          <input
            type="text"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            className="input input-bordered"
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
            {t("event.form.max_limit")} {form.maxRegistrations}
          </p>
        )}
      </div>
    </form>
  );
}
