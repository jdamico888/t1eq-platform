type Props = {
  headers: string[];
  children: React.ReactNode;
  className?: string;

  qbitId?: string;
  qbitScope?: string;
};

export default function DataTable({
  headers,
  children,
  className = "",
  qbitId,
  qbitScope = "global",
}: Props) {
  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className={`
        overflow-hidden
        rounded-2xl
        border
        border-black/10
        bg-white/20
        ${className}
      `}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-black">
          <thead className="bg-black/10">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="
                    px-4
                    py-3
                    text-left
                    font-semibold
                    whitespace-nowrap
                  "
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}
