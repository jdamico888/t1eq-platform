type Props = {
  title: string;
  message?: string;
  action?: React.ReactNode;

  qbitId?: string;
  qbitScope?: string;
};

export default function EmptyState({
  title,
  message,
  action,
  qbitId,
  qbitScope = "global",
}: Props) {
  return (
    <div
      data-t1eq-page-card="true"
      data-t1eq-qbit-type={qbitId ? "page-card" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className="
        rounded-2xl
        border
        border-black/10
        bg-white/15
        p-6
        text-black
      "
    >
      <div className="space-y-3">
        <h3 className="text-xl font-bold">
          {title}
        </h3>

        {message && (
          <p className="text-black/60">
            {message}
          </p>
        )}

        {action && (
          <div className="pt-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}