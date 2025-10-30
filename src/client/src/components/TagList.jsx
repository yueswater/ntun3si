import { useEffect, useState } from "react";

export default function TagList({ tags = [] }) {
  const [isMobile, setIsMobile] = useState(false);
  const [modalId] = useState(
    () => `tag_modal_${Math.random().toString(36).substring(2, 8)}`
  );

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 640); // Tailwind sm breakpoint
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return (
    <div className="flex items-center justify-center">
      {/* 桌面版：直接顯示所有標籤 */}
      {!isMobile ? (
        <div className="flex flex-wrap gap-2 max-w-[160px] overflow-hidden">
          {tags.map((tag, i) => (
            <span key={i} className="badge badge-outline whitespace-nowrap">
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <>
          {/* 手機版：顯示 ... */}
          <button
            className="text-gray-400 hover:text-gray-600 text-sm"
            onClick={() => document.getElementById(modalId).showModal()}
          >
            ...
          </button>

          {/* Modal：顯示所有標籤 */}
          <dialog id={modalId} className="modal">
            <div className="modal-box">
              <form method="dialog">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                  ✕
                </button>
              </form>
              <h3 className="font-bold text-lg mb-4">標籤列表</h3>

              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="badge badge-outline whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">沒有標籤</p>
              )}
            </div>
            <form method="dialog" className="modal-backdrop">
              <button>close</button>
            </form>
          </dialog>
        </>
      )}
    </div>
  );
}
