type Props = {
  children: React.ReactNode;
  className?: string;

  qbitId?: string;
  qbitScope?: string;
};

export default function DataTableRow({
  children,
  className = "",
  qbitId,
  qbitScope = "global",
}: Props) {
  return (
    <tr
      data-t1eq-qbit-type={qbitId ? "tile" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className={`
        border-t
        border-black/10
        hover:bg-white/10
        transition
        ${className}
      `}
    >
      {children}
    </tr>
  );
}
