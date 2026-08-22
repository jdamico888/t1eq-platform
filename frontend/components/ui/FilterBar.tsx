type FilterBarProps = {
  children: React.ReactNode;
};

export default function FilterBar({
  children,
}: FilterBarProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>
    </div>
  );
}