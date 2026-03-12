import { useState, useRef } from "react";
import AnimatedButton from "../AnimatedButton";

/**
 * Form Builder - Component for building custom form fields
 */
export default function FormBuilder({ fields, onChange }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [optionInput, setOptionInput] = useState("");
  const optionInputRef = useRef(null);

  const fieldTypes = [
    { value: "text", label: "單行文字" },
    { value: "textarea", label: "多行文字" },
    { value: "select", label: "下拉選單" },
    { value: "radio", label: "單選按鈕" },
    { value: "checkbox", label: "多選框" },
    { value: "priority_ranking", label: "志願排序" },
    { value: "radio_with_other", label: "單選（含其他請說明）" },
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
    setOptionInput("");
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

  const addOption = (index) => {
    const trimmed = optionInput.trim();
    if (!trimmed) return;
    const field = fields[index];
    if ((field.options || []).includes(trimmed)) return;
    handleUpdateField(index, { options: [...(field.options || []), trimmed] });
    setOptionInput("");
    optionInputRef.current?.focus();
  };

  const removeOption = (index, optIdx) => {
    const field = fields[index];
    handleUpdateField(index, {
      options: (field.options || []).filter((_, i) => i !== optIdx),
    });
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

                {["select", "radio", "checkbox", "priority_ranking", "radio_with_other"].includes(field.type) && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">選項</span>
                    </label>
                    {/* Existing option tags */}
                    <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                      {(field.options || []).map((opt, optIdx) => (
                        <span
                          key={optIdx}
                          className="flex items-center gap-1 bg-base-300 text-sm px-2 py-1 rounded-full"
                        >
                          {opt}
                          <button
                            type="button"
                            onClick={() => removeOption(index, optIdx)}
                            className="text-gray-400 hover:text-error leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    {/* New option input */}
                    <div className="flex gap-2">
                      <input
                        ref={editingIndex === index ? optionInputRef : null}
                        type="text"
                        value={optionInput}
                        onChange={(e) => setOptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addOption(index);
                          }
                        }}
                        className="input input-bordered input-sm flex-1"
                        placeholder="輸入選項，按 Enter 新增"
                      />
                      <button
                        type="button"
                        onClick={() => addOption(index)}
                        className="btn btn-sm btn-outline"
                      >
                        新增
                      </button>
                    </div>
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
                    label="完成"
                    icon="faPlus"
                    variant="primary"
                    onClick={() => { setEditingIndex(null); setOptionInput(""); }}
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
                    onClick={() => { setEditingIndex(index); setOptionInput(""); }}
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
