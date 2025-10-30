import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPen,
  faTrash,
  faFloppyDisk,
  faXmark,
  faEye,
  faArrowLeft,
  faCamera,
  faFileExport,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Responsive AnimatedButton
 * - "編輯"、"刪除"、"查看" 在小螢幕只顯示 icon。
 * - 其他按鈕維持 label + icon。
 */
export default function AnimatedButton({
  label,
  variant = "primary",
  icon = "faPlus",
  onClick,
  size = "md",
  className = "",
}) {
  const iconMap = {
    faPlus,
    faPen,
    faTrash,
    faFloppyDisk,
    faXmark,
    faEye,
    faArrowLeft,
    faCamera,
    faFileExport,
  };
  const selectedIcon = iconMap[icon] || faPlus;

  const baseClass =
    "relative flex items-center justify-center gap-x-1 px-3 py-1.5 rounded-full font-medium overflow-hidden transition-all duration-300 group text-center leading-none border whitespace-nowrap";

  const variants = {
    primary: `
      ${baseClass}
      text-[#03045E] border-[#03045E]
      before:absolute before:left-0 before:top-0 before:h-full before:w-0
      before:bg-[#03045E] before:transition-all before:duration-300 
      hover:before:w-full hover:text-white
    `,
    secondary: `
      ${baseClass}
      text-[#03045E] border-[#03045E]
      before:absolute before:left-0 before:top-0 before:h-full before:w-0
      before:bg-[#03045E] before:transition-all before:duration-300 
      hover:before:w-full hover:text-white
    `,
    danger: `
      ${baseClass}
      text-white bg-[#dc2626] border-[#dc2626]
      before:absolute before:left-0 before:top-0 before:h-full before:w-0
      before:bg-white before:transition-all before:duration-300 
      hover:before:w-full hover:text-[#dc2626]
    `,
    ghost: `
      ${baseClass}
      text-white bg-[#03045E] border-[#03045E]
      before:absolute before:left-0 before:top-0 before:h-full before:w-0
      before:bg-white before:transition-all before:duration-300 
      hover:before:w-full hover:text-[#03045E]
    `,
  };

  // 哪些按鈕在小螢幕只顯示 icon
  const iconOnlyLabels = ["編輯", "刪除", "查看", "驗證"];

  return (
    <button onClick={onClick} className={`${variants[variant]} ${className}`}>
      <FontAwesomeIcon
        icon={selectedIcon}
        className="text-xs relative z-10 transition-transform duration-300 group-hover:rotate-12"
      />
      <span
        className={`relative z-10 ${
          iconOnlyLabels.includes(label) ? "hidden sm:inline" : ""
        }`}
      >
        {label}
      </span>
    </button>
  );
}
