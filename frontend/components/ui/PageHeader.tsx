type PageHeaderProps = {
  title: string;

  description?: string;

  actions?: React.ReactNode;
};

export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          {title}
        </h1>

        {description && (
          <p className="mt-3 max-w-3xl text-slate-400">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}