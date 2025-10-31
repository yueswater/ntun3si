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

      {/* 手機版卡片 */}
      <div className="block md:hidden space-y-4">
        {data.map((row, index) => (
          <div
            key={index}
            className="card bg-base-100 border border-base-200 shadow-sm rounded-xl"
          >
            <div className="card-body p-4">
              <h2 className="card-title text-base font-semibold mb-2">
                #{index + 1}
              </h2>

              <div className="divide-y divide-base-200 space-y-2">
                {columns.map((col, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center pt-2"
                  >
                    <span className="text-sm text-gray-500">{col}</span>
                    <span className="text-sm font-medium text-gray-800 text-right max-w-[60%] truncate">
                      {Object.values(row)[i]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action area (if actions exist) */}
              {row.actions && (
                <div className="card-actions justify-end mt-3">
                  {row.actions}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
