type PageContainerProps = {
  children: React.ReactNode;

  qbitId?: string;
  qbitScope?: string;
};

export default function PageContainer({
  children,
  qbitId,
  qbitScope = "global",
}: PageContainerProps) {
  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className="space-y-6"
    >
      {children}
    </div>
  );
}