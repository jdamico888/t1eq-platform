type KeyValueRowProps = {
  label: string;

  value?: React.ReactNode;
};

export default function KeyValueRow({
  label,
  value,
}: KeyValueRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-white/5 py-3 last:border-b-0">
      <div className="text-sm text-slate-400">
        {label}
      </div>

      <div className="text-right text-sm text-slate-200">
        {value || "-"}
      </div>
    </div>
  );
}