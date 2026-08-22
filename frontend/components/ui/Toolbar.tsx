type ToolbarProps = {
  children: React.ReactNode;
};

export default function Toolbar({
  children,
}: ToolbarProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between">
      {children}
    </div>
  );
}