import AnimatedButton from "./AnimatedButton";
import DataTable from "./DataTable";

export default function ManagementLayout({
  title,
  onCreate,
  buttonLabel,
  tableColumns,
  tableData,
  searchValue,
  onSearchChange,
  searchPlaceholder = "搜尋…",
  filterNode,
}) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <AnimatedButton
          label={buttonLabel}
          icon="faPlus"
          variant="primary"
          onClick={onCreate}
        />
      </div>

      {/* Search & Filter bar */}
      {(onSearchChange || filterNode) && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {onSearchChange && (
            <input
              type="text"
              className="input input-bordered input-sm w-full max-w-xs"
              placeholder={searchPlaceholder}
              value={searchValue || ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          )}
          {filterNode}
        </div>
      )}

      <DataTable columns={tableColumns} data={tableData} />
    </div>
  );
}
