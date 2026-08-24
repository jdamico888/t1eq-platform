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
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
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
            data-t1eq-qbit-id={qbitId ? `${qbitId}-description` : undefined}
            data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
            className="mt-2 text-slate-400"
          >
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
