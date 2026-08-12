type SectionHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export default function SectionHeader({
  title,
  description,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        )}
      </div>

      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}