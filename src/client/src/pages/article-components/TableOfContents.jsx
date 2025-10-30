import { useMemo } from "react";

/**
 * Table of Contents component for article navigation
 * @param {Array} toc - Array of heading objects with id, text, and level
 * @param {string} activeSection - Currently expanded section ID
 * @param {string} currentSection - Currently active/highlighted section ID
 * @param {Function} onToggleSection - Handler for expanding/collapsing sections
 * @param {Function} onScrollToId - Handler for scrolling to a specific heading
 */
export default function TableOfContents({
  toc,
  activeSection,
  currentSection,
  onToggleSection,
  onScrollToId,
}) {
  // Group h3 items under their parent h2
  const tocGroups = useMemo(() => {
    const groups = [];
    let current = null;

    for (const item of toc) {
      if (item.level === 2) {
        current = { section: item, children: [] };
        groups.push(current);
      } else if (current) {
        current.children.push(item);
      }
    }

    return groups;
  }, [toc]);

  if (!toc.length) return null;

  return (
    <aside className="col-span-2 hidden lg:block">
      <div className="sticky top-24">
        <h3 className="font-semibold mb-3 text-gray-700">目錄</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          {tocGroups.map(({ section, children }, i) => {
            const isOpen = activeSection === section.id;
            const isActive = currentSection === section.id;

            return (
              <li key={`${section.id}-${i}`}>
                <button
                  onClick={() => onToggleSection(section.id)}
                  className={`flex items-center justify-between w-full text-left hover:text-secondary font-medium transition-colors ${
                    isActive ? "text-secondary" : ""
                  }`}
                >
                  <span>{section.text}</span>
                  {children.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {isOpen ? "－" : "＋"}
                    </span>
                  )}
                </button>

                {isOpen && children.length > 0 && (
                  <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-2 transition-all duration-200">
                    {children.map((sub, j) => (
                      <li key={`${sub.id}-${j}`}>
                        <button
                          onClick={() => onScrollToId(sub.id)}
                          className={`block text-left w-full hover:text-secondary transition-colors ${
                            currentSection === sub.id
                              ? "text-secondary font-semibold"
                              : "text-gray-600"
                          }`}
                        >
                          {sub.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
