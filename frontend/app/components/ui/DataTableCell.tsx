type Props = {
  children: React.ReactNode;
  className?: string;

  qbitId?: string;
  qbitScope?: string;
};

export default function DataTableCell({
  children,
  className = "",
  qbitId,
  qbitScope = "global",
}: Props) {
  return (
    <td
      data-t1eq-qbit-type={qbitId ? "text" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className={`
        px-4
        py-3
        whitespace-nowrap
        ${className}
      `}
    >
      {children}
    </td>
  );
}
