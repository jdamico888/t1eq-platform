type ContentCardProps = {
  children: React.ReactNode;
  className?: string;

  qbitId?: string;
  qbitScope?: string;
};

export default function ContentCard({
  children,
  className = "",
  qbitId,
  qbitScope = "global",
}: ContentCardProps) {
  return (
    <div
      data-t1eq-page-card="true"
      data-t1eq-qbit-type={qbitId ? "page-card" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className={`rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}