import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaCode,
  FaListUl,
  FaListOl,
  FaQuoteRight,
  FaLink,
  FaImage,
  FaHeading,
} from "react-icons/fa";

export default function MarkdownToolbar({
  onBold,
  onItalic,
  onUnderline,
  onStrike,
  onCode,
  onList,
  onOList,
  onQuote,
  onLink,
  onImage,
  onHeading,
  uploadingImage,
}) {
  const ToolbarButton = ({
    icon: Icon,
    onClick,
    title,
    dataAttr,
    disabled,
    loading,
  }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) onClick?.();
      }}
      title={title}
      className={`btn btn-sm btn-ghost hover:btn-primary ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      {...(dataAttr ? { [dataAttr]: true } : {})}
      disabled={disabled}
    >
      {loading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <Icon className="text-base" />
      )}
    </button>
  );

  return (
    <div
      data-toolbar
      className="bg-base-200 p-2 border-b border-base-300 flex flex-nowrap items-center gap-0.5 overflow-x-auto"
    >
      <ToolbarButton
        icon={FaHeading}
        onClick={onHeading}
        title="標題 (Ctrl+H)"
        dataAttr="data-heading-btn"
      />
      <ToolbarButton icon={FaBold} onClick={onBold} title="粗體 (Ctrl+B)" />
      <ToolbarButton icon={FaItalic} onClick={onItalic} title="斜體 (Ctrl+I)" />
      <ToolbarButton
        icon={FaUnderline}
        onClick={onUnderline}
        title="下底線 (Ctrl+U)"
      />
      <ToolbarButton
        icon={FaStrikethrough}
        onClick={onStrike}
        title="刪除線 (Ctrl+Shift+S)"
      />
      <ToolbarButton icon={FaCode} onClick={onCode} title="程式碼 (Ctrl+`)" />
      <ToolbarButton icon={FaListUl} onClick={onList} title="無序列表" />
      <ToolbarButton icon={FaListOl} onClick={onOList} title="有序列表" />
      <ToolbarButton icon={FaQuoteRight} onClick={onQuote} title="引用" />
      <ToolbarButton icon={FaLink} onClick={onLink} title="連結" />
      <ToolbarButton
        icon={FaImage}
        onClick={onImage}
        title={uploadingImage ? "上傳中..." : "圖片"}
        disabled={uploadingImage}
        loading={uploadingImage}
      />
    </div>
  );
}
