import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

/**
 * HashtagEditor Component
 * - Controlled input (auto-clear after adding)
 * - Up to 5 tags
 * - Rounded tags with remove button
 */
export default function HashtagEditor({ hashtags, setHashtags }) {
  const [input, setInput] = useState("");

  // Add a new tag from input value
  const handleAddTag = () => {
    const value = input.trim();
    if (!value) return;
    if (hashtags.length >= 5) {
      alert("最多只能新增 5 個標籤");
      return;
    }
    setHashtags([...hashtags, value]);
    setInput(""); // clear input after adding
  };

  // Remove a tag
  const handleRemoveTag = (index) => {
    const updated = hashtags.filter((_, i) => i !== index);
    setHashtags(updated);
  };

  // Handle keydown (Enter to add)
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div>
      <label className="block text-lg font-semibold mb-3">
        標籤 <span className="text-sm text-gray-400">(最多 5 個)</span>
      </label>

      {/* Tag list */}
      <div className="flex flex-wrap gap-2 mb-3">
        {hashtags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium"
          >
            <span>{tag}</span>
            <FontAwesomeIcon
              icon={faTimes}
              className="cursor-pointer hover:text-red-500"
              onClick={() => handleRemoveTag(index)}
            />
          </div>
        ))}
      </div>

      {/* Input + Button */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="輸入新標籤並按 Enter"
          className="input input-bordered rounded-full flex-1"
        />
        <button className="btn btn-outline rounded-full" onClick={handleAddTag}>
          + 新增標籤
        </button>
      </div>
    </div>
  );
}
