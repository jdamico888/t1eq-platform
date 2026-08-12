type ContentCardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function ContentCard({
  children,
  className = "",
}: ContentCardProps) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}