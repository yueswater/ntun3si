import { useState } from "react";
import AnimatedButton from "../AnimatedButton";

/**
 * Form Builder - Component for building custom form fields
 */
export default function FormBuilder({ fields, onChange }) {
  const [editingIndex, setEditingIndex] = useState(null);

  const fieldTypes = [
    { value: "text", label: "單行文字" },
    { value: "textarea", label: "多行文字" },
    { value: "select", label: "下拉選單" },
    { value: "radio", label: "單選按鈕" },
    { value: "checkbox", label: "多選框" },
  ];

  // Add a new field
  const handleAddField = () => {
    const newField = {
      label: "新欄位",
      type: "text",
      required: false,
      placeholder: "",
      options: [],
    };
    onChange([...fields, newField]);
    setEditingIndex(fields.length);
  };

  // Update a field
  const handleUpdateField = (index, updates) => {
    const updated = fields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    onChange(updated);
  };

  // Delete a field
  const handleDeleteField = (index) => {
    if (confirm("確定要刪除此欄位？")) {
      onChange(fields.filter((_, i) => i !== index));
      setEditingIndex(null);
    }
  };

  // Move field up
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...fields];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  // Move field down
  const handleMoveDown = (index) => {
    if (index === fields.length - 1) return;
    const updated = [...fields];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Field List */}
      {fields.map((field, index) => (
        <div key={index} className="card bg-base-200">
          <div className="card-body p-4">
            {editingIndex === index ? (
              // ================================
              // Edit Mode
              // ================================
              <div className="space-y-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">欄位標題</span>
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) =>
                      handleUpdateField(index, { label: e.target.value })
                    }
                    className="input input-bordered input-sm"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">欄位類型</span>
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      handleUpdateField(index, { type: e.target.value })
                    }
                    className="select select-bordered select-sm"
                  >
                    {fieldTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(field.type === "text" || field.type === "textarea") && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">提示文字</span>
                    </label>
                    <input
                      type="text"
                      value={field.placeholder || ""}
                      onChange={(e) =>
                        handleUpdateField(index, {
                          placeholder: e.target.value,
                        })
                      }
                      className="input input-bordered input-sm"
                    />
                  </div>
                )}

                {["select", "radio", "checkbox"].includes(field.type) && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">選項（每行一個）</span>
                    </label>
                    <textarea
                      value={(field.options || []).join("\n")}
                      onChange={(e) =>
                        handleUpdateField(index, {
                          options: e.target.value
                            .split("\n")
                            .filter((o) => o.trim()),
                        })
                      }
                      className="textarea textarea-bordered textarea-sm"
                      rows={4}
                      placeholder="選項1&#10;選項2&#10;選項3"
                    />
                  </div>
                )}

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        handleUpdateField(index, { required: e.target.checked })
                      }
                      className="checkbox checkbox-sm"
                    />
                    <span className="label-text">必填欄位</span>
                  </label>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 justify-end">
                  <AnimatedButton
                    label="新增"
                    icon="faPlus"
                    variant="primary"
                    onClick={() => setEditingIndex(null)}
                  />
                  <AnimatedButton
                    label="刪除"
                    icon="faTrash"
                    variant="danger"
                    onClick={() => handleDeleteField(index)}
                  />
                </div>
              </div>
            ) : (
              // ================================
              // View Mode
              // ================================
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {field.label}
                    {field.required && (
                      <span className="text-error ml-1">*</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    類型：
                    {fieldTypes.find((t) => t.value === field.type)?.label}
                    {field.options && field.options.length > 0 && (
                      <span className="ml-2">
                        ({field.options.length} 個選項)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === fields.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() => setEditingIndex(index)}
                  >
                    編輯
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add Field Button */}
      <button className="btn btn-outline btn-block" onClick={handleAddField}>
        + 新增欄位
      </button>

      {/* Info */}
      {fields.length === 0 && (
        <div className="alert alert-info">
          <span>
            目前沒有自訂欄位。基本資料（姓名、Email、電話、國籍等）已預設包含。
          </span>
        </div>
      )}
    </div>
  );
}
