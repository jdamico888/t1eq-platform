type GlassCardProps = {
  children: React.ReactNode;

  className?: string;
};

export default function GlassCard({
  children,
  className = "",
}: GlassCardProps) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-2xl backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}