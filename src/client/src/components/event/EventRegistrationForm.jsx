import { useState, useEffect } from "react";
import { post } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import CountrySelect from "../../components/CountrySelect";

/**
 * Event Registration Form Component
 * Handles user registration for events with custom fields
 */
export default function EventRegistrationForm({ event, form }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nationality: "中華民國",
    school: "",
    department: "",
    studentId: "",
    customResponses: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [confirmationMsg, setConfirmationMsg] = useState("");

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  // Initialize custom responses
  useEffect(() => {
    if (form?.customFields) {
      const responses = form.customFields.map((field) => ({
        fieldId: field.fieldId,
        label: field.label,
        value: field.type === "checkbox" ? [] : "",
      }));
      setFormData((prev) => ({ ...prev, customResponses: responses }));
    }
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        if (resp.fieldId === fieldId) {
          const currentValues = Array.isArray(resp.value) ? resp.value : [];
          const newValues = checked
            ? [...currentValues, option]
            : currentValues.filter((v) => v !== option);
          return { ...resp, value: newValues };
        }
        return resp;
      }),
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("請輸入姓名");
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("請輸入有效的電子郵件");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("請輸入電話號碼");
      return false;
    }

    // Validate required custom fields
    for (const field of form.customFields) {
      if (field.required) {
        const response = formData.customResponses.find(
          (r) => r.fieldId === field.fieldId
        );
        if (!response || !response.value || response.value.length === 0) {
          setError(`請填寫必填欄位：${field.label}`);
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
      // 1. Submit registration to backend
      const response = await post(
        `/registrations/event/${event.uid}`,
        formData
      );
      setConfirmationMsg(response.confirmationMessage || "報名成功！");
      setSuccess(true);

      // 2. Send confirmation email via existing newsletter endpoint
      const apiBase =
        import.meta.env.VITE_BASE_URL?.replace(/\/$/, "") ||
        "http://localhost:5050/api";

      await fetch(`${apiBase}/mail/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipients: [formData.email],
          subject: `【NTUN3SI 國安社】${event.title} 報名成功通知`,
          content: `
          您好 ${formData.name}：
          感謝您報名「${event.title}」活動，我們已成功收到您的報名資訊。
          
          活動資訊：
          - 日期：${new Date(event.date).toLocaleString("zh-TW")}
          - 地點：${event.location || "待通知"}
          - 聯絡信箱：ntub113022national@gmail.com

          若非本人操作，請忽略此信。
          感謝您的支持！
        `,
        }),
      });

      // 3. Reset form after submission
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        phone: "",
        nationality: "中華民國",
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
      setError(err.response?.data?.message || "報名失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  // Success message card
  if (success) {
    return (
      <div className="card bg-success text-success-content">
        <div className="card-body">
          <h3 className="card-title">✓ 報名成功！</h3>
          <p>{confirmationMsg}</p>
          <p className="text-sm mt-2">
            我們已將確認信寄至您的電子郵件，請查收。
          </p>
          <div className="card-actions justify-end mt-4">
            <button
              className="btn btn-ghost"
              onClick={() => (window.location.href = "/events")}
            >
              返回活動列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration closed alert
  const deadline = form.registrationDeadline
    ? new Date(form.registrationDeadline)
    : null;
  const isClosed = deadline && new Date() > deadline;

  if (isClosed) {
    return (
      <div className="alert alert-warning">
        <span>報名已截止</span>
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
        {/* 姓名 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              姓名 <span className="text-error">*</span>
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

        {/* 電子郵件 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              電子郵件 <span className="text-error">*</span>
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

        {/* 電話 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              電話 <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input input-bordered"
            placeholder="範例：0912-345-678"
            required
          />
        </div>

        {/* 國籍 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              國籍 <span className="text-error">*</span>
            </span>
          </label>
          <CountrySelect
            value={formData.nationality}
            onChange={handleNationalityChange}
            required
          />
        </div>
      </div>

      {/* 選填欄位 */}
      <div className="divider">選填資訊</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">學校</span>
          </label>
          <input
            type="text"
            name="school"
            value={formData.school}
            onChange={handleChange}
            className="input input-bordered"
            placeholder="例：國立臺灣大學"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">系級</span>
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="input input-bordered"
            placeholder="例：資訊工程學系 大二"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">學號</span>
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
          <div className="divider">其他問題</div>
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
                      <option value="">請選擇...</option>
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

      {/* Submit Button */}
      <div className="form-control mt-6">
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="loading loading-spinner"></span>
              報名中...
            </>
          ) : (
            "確認報名"
          )}
        </button>
      </div>

      {/* Info */}
      <div className="text-sm text-gray-500 mt-4">
        <p>* 為必填欄位</p>
        {deadline && <p>報名截止時間：{deadline.toLocaleString("zh-TW")}</p>}
        {form.maxRegistrations && <p>名額限制：{form.maxRegistrations} 人</p>}
      </div>
    </form>
  );
}
