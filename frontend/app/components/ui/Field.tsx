type Props = {
  label: string;
  children: React.ReactNode;
  helperText?: string;

  qbitId?: string;
  qbitScope?: string;
};

export default function Field({
  label,
  children,
  helperText,
  qbitId,
  qbitScope = "global",
}: Props) {
  return (
    <div className="space-y-2">
      <label
        data-t1eq-qbit-type={qbitId ? "text" : undefined}
        data-t1eq-qbit-id={qbitId ? `${qbitId}-label` : undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
        className="text-sm font-semibold text-black/70"
      >
        {label}
      </label>

      {children}

      {helperText && (
        <p
          data-t1eq-qbit-type={qbitId ? "text" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-helper` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className="text-xs text-black/50"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
