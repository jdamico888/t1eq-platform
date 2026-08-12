type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export default function SectionHeader({
  title,
  subtitle,
  actions,
}: Props) {
  return (
    <div className="flex justify-between items-start gap-4">
      <div>
        <h1 className="text-5xl font-bold text-black">
          {title}
        </h1>

        {subtitle && (
          <p className="text-black/70 mt-2 text-lg">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}