type SectionHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;

  qbitId?: string;
  qbitScope?: string;
};

export default function SectionHeader({
  title,
  description,
  actions,
  qbitId,
  qbitScope = "global",
}: SectionHeaderProps) {
  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
    >
      <div
        data-t1eq-qbit-type={qbitId ? "section" : undefined}
        data-t1eq-qbit-id={qbitId ? `${qbitId}-text` : undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      >
        <h2
          data-t1eq-qbit-type={qbitId ? "text" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-title` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className="text-2xl font-semibold"
        >
          {title}
        </h2>

        {description && (
          <p
            data-t1eq-qbit-type={qbitId ? "text" : undefined}
            data-t1eq-qbit-id={
              qbitId ? `${qbitId}-description` : undefined
            }
            data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
            className="mt-1 text-sm text-slate-400"
          >
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div
          data-t1eq-qbit-type={qbitId ? "section" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-actions` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className="flex gap-3"
        >
          {actions}
        </div>
      )}
    </div>
  );
}