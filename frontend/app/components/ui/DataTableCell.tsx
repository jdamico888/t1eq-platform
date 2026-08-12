type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function DataTableCell({
  children,
  className = "",
}: Props) {
  return (
    <td
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