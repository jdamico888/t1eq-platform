type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;

  qbitId?: string;
  qbitScope?: string;
};

export default function PageHeader({
  title,
  description,
  actions,
  qbitId,
  qbitScope = "global",
}: PageHeaderProps) {
  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"
    >
      <div
        data-t1eq-qbit-type={qbitId ? "section" : undefined}
        data-t1eq-qbit-id={qbitId ? `${qbitId}-text` : undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      >
        <h1
          data-t1eq-qbit-type={qbitId ? "text" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-title` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className="text-4xl font-bold tracking-tight"
        >
          {title}
        </h1>

        {description && (
          <p
            data-t1eq-qbit-type={qbitId ? "text" : undefined}
            data-t1eq-qbit-id={
              qbitId ? `${qbitId}-description` : undefined
            }
            data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
            className="mt-3 max-w-3xl text-slate-400"
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
          className="flex shrink-0 gap-3"
        >
          {actions}
        </div>
      )}
    </div>
  );
}