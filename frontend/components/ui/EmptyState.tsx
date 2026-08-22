type EmptyStateProps = {
  title: string;
  description?: string;
};

export default function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 px-8 py-16 text-center">
      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      {description && (
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}