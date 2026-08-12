type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function DataTableRow({
  children,
  className = "",
}: Props) {
  return (
    <tr
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