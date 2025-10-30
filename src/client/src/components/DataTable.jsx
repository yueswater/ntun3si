export default function DataTable({ columns, data }) {
  return (
    <div className="space-y-4 md:overflow-x-auto md:rounded-box md:border md:border-base-content/5 md:bg-base-100 md:shadow">
      {/* 桌面版 */}
      <table className="hidden md:table table-zebra min-w-full">
        <thead className="bg-base-200">
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {Object.values(row).map((val, i) => (
                <td key={i}>{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 手機版 */}
      <div className="block md:hidden space-y-3">
        {data.map((row, index) => (
          <div
            key={index}
            className="border border-base-200 rounded-lg p-3 shadow-sm bg-base-100"
          >
            {columns.map((col, i) => (
              <div
                key={i}
                className="flex justify-between py-1 border-b last:border-0"
              >
                <span className="text-sm text-gray-500">{col}</span>
                <span className="text-sm font-medium text-gray-800">
                  {Object.values(row)[i]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
