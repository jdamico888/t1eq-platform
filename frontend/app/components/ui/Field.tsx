type Props = {
  label: string;
  children: React.ReactNode;
  helperText?: string;
};

export default function Field({
  label,
  children,
  helperText,
}: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-black/70">
        {label}
      </label>

      {children}

      {helperText && (
        <p className="text-xs text-black/50">
          {helperText}
        </p>
      )}
    </div>
  );
}