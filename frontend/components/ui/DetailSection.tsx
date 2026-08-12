type DetailSectionProps = {
  title: string;

  description?: string;

  children: React.ReactNode;
};

export default function DetailSection({
  title,
  description,
  children,
}: DetailSectionProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-400">
            {description}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}