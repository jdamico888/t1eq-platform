type DataTableColumn<T> = {
  key: string;

  header: string;

  className?: string;

  render: (
    item: T
  ) => React.ReactNode;
};

type DataTableProps<T> = {
  data: T[];

  columns: DataTableColumn<T>[];

  emptyMessage?: string;
};

export default function DataTable<T>({
  data,
  columns,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-white/10 bg-black/20">
            <tr>
              {columns.map(
                (column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 ${column.className || ""}`}
                  >
                    {
                      column.header
                    }
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {data.length ===
              0 && (
              <tr>
                <td
                  colSpan={
                    columns.length
                  }
                  className="px-6 py-12 text-center text-sm text-slate-400"
                >
                  {
                    emptyMessage
                  }
                </td>
              </tr>
            )}

            {data.map(
              (
                item,
                index
              ) => (
                <tr
                  key={index}
                  className="border-b border-white/5 transition hover:bg-white/5"
                >
                  {columns.map(
                    (
                      column
                    ) => (
                      <td
                        key={
                          column.key
                        }
                        className={`px-6 py-4 align-top ${column.className || ""}`}
                      >
                        {column.render(
                          item
                        )}
                      </td>
                    )
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}