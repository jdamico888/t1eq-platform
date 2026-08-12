type PanelProps = {
  title?: string;

  children: React.ReactNode;

  className?: string;
};

export default function Panel({
  title,
  children,
  className = "",
}: PanelProps) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl ${className}`}
    >
      {title && (
        <h2 className="mb-6 text-2xl font-semibold">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
}