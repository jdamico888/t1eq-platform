type Props = {
  headers: string[];
  children: React.ReactNode;
  className?: string;
};

export default function DataTable({
  headers,
  children,
  className = "",
}: Props) {
  return (
    <div
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