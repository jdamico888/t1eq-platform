type ToolbarGroupProps = {
  children: React.ReactNode;
};

export default function ToolbarGroup({
  children,
}: ToolbarGroupProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {children}
    </div>
  );
}