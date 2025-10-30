import AnimatedButton from "./AnimatedButton";
import DataTable from "./DataTable";

export default function ManagementLayout({
  title,
  onCreate,
  buttonLabel,
  tableColumns,
  tableData,
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
      <DataTable columns={tableColumns} data={tableData} />
    </div>
  );
}
