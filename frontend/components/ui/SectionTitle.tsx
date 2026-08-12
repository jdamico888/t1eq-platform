type SectionTitleProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export default function SectionTitle({
  title,
  subtitle,
  actions,
}: SectionTitleProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-semibold">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-400">
            {subtitle}
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